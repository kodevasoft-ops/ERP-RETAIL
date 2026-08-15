import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { OrigenMovimiento, Prisma, TipoMovimiento } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import {
  CancelarOrdenCompraDto,
  CreateOrdenCompraDto,
  RecibirOrdenCompraDto,
} from "./dto/orden-compra.dto";
import { buildPaginatedResponse, PaginationQueryDto } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

const IVA_DEFECTO = 19;

@Injectable()
export class ComprasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async siguienteNumero(tx: Prisma.TransactionClient, empresaId: string, sucursalId: string) {
    await tx.numeracion.upsert({
      where: { empresaId_sucursalId_tipo: { empresaId, sucursalId, tipo: "compra" } },
      update: {},
      create: { empresaId, sucursalId, tipo: "compra", consecutivoActual: 0 },
    });
    const actualizado = await tx.numeracion.update({
      where: { empresaId_sucursalId_tipo: { empresaId, sucursalId, tipo: "compra" } },
      data: { consecutivoActual: { increment: 1 } },
    });
    return actualizado.consecutivoActual;
  }

  async crear(dto: CreateOrdenCompraDto, ctx: RequestContext) {
    // Se valida existencia de las variantes referenciadas antes de crear.
    const variantes = await this.prisma.variante.findMany({
      where: { id: { in: dto.items.map((i) => i.varianteId) } },
      select: { id: true, iva: true },
    });
    const varianteMap = new Map(variantes.map((v) => [v.id, v]));

    let subtotal = 0;
    let ivaTotal = 0;
    const itemsData: Prisma.OrdenCompraItemCreateManyOrdenCompraInput[] = [];

    for (const item of dto.items) {
      const variante = varianteMap.get(item.varianteId);
      if (!variante) throw new NotFoundException(`Variante ${item.varianteId} no encontrada.`);

      const ivaPct = Number(variante.iva ?? IVA_DEFECTO);
      const itemSubtotal = item.costoUnitario * item.cantidad;
      subtotal += itemSubtotal;
      ivaTotal += itemSubtotal * (ivaPct / 100);

      itemsData.push({
        varianteId: item.varianteId,
        cantidad: item.cantidad,
        costoUnitario: item.costoUnitario,
        subtotal: itemSubtotal,
      });
    }

    const orden = await this.prisma.$transaction(async (tx) => {
      const numero = await this.siguienteNumero(tx, ctx.empresaId, dto.sucursalId);

      return tx.ordenCompra.create({
        data: {
          empresaId: ctx.empresaId,
          sucursalId: dto.sucursalId,
          proveedorId: dto.proveedorId,
          numero,
          estado: "BORRADOR",
          subtotal,
          ivaTotal,
          total: subtotal + ivaTotal,
          fechaEsperada: dto.fechaEsperada ? new Date(dto.fechaEsperada) : undefined,
          observaciones: dto.observaciones,
          usuarioId: ctx.usuarioId,
          items: { createMany: { data: itemsData } },
        },
        include: { items: true, proveedor: { select: { nombre: true } } },
      });
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "compras",
      accion: "crear",
      entidadId: orden.id,
      despues: orden,
      resultado: "exito",
    });

    return orden;
  }

  async enviar(id: string, version: number, ctx: RequestContext) {
    const orden = await this.prisma.ordenCompra.findFirst({ where: { id, empresaId: ctx.empresaId } });
    if (!orden) throw new NotFoundException("Orden de compra no encontrada.");
    if (orden.estado !== "BORRADOR") {
      throw new ConflictException("Solo se pueden enviar órdenes en estado Borrador.");
    }
    if (orden.version !== version) throw new ConflictException("La orden fue modificada por otro usuario.");

    return this.prisma.ordenCompra.update({
      where: { id, version },
      data: { estado: "ENVIADA", version: { increment: 1 } },
    });
  }

  /**
   * Recepción de mercancía: incrementa el stock de cada variante con
   * costeo promedio ponderado (misma lógica que una entrada manual de
   * inventario), en la misma transacción que actualiza la orden y genera
   * la cuenta por pagar al proveedor.
   */
  async recibir(id: string, dto: RecibirOrdenCompraDto, ctx: RequestContext) {
    return this.prisma.$transaction(async (tx) => {
      const orden = await tx.ordenCompra.findFirst({
        where: { id, empresaId: ctx.empresaId },
        include: { items: true },
      });
      if (!orden) throw new NotFoundException("Orden de compra no encontrada.");
      if (!["ENVIADA", "RECIBIDA_PARCIAL"].includes(orden.estado)) {
        throw new ConflictException("La orden no está en un estado que permita recepción.");
      }
      if (orden.version !== dto.version) throw new ConflictException("La orden fue modificada por otro usuario.");

      for (const recepcion of dto.items) {
        const item = orden.items.find((i) => i.id === recepcion.ordenCompraItemId);
        if (!item) throw new NotFoundException(`Ítem ${recepcion.ordenCompraItemId} no pertenece a esta orden.`);

        const totalRecibido = item.cantidadRecibida + recepcion.cantidadRecibida;
        if (totalRecibido > item.cantidad) {
          throw new BadRequestException(
            `La cantidad recibida excede lo ordenado para la variante ${item.varianteId}.`,
          );
        }

        const varianteRows = await tx.$queryRaw<
          { id: string; stock: number; costo_promedio: string; sucursal_id: string }[]
        >`
          SELECT id, stock, costo_promedio, sucursal_id FROM variantes WHERE id = ${item.varianteId} FOR UPDATE
        `;
        const variante = varianteRows[0];
        if (!variante) throw new NotFoundException(`Variante ${item.varianteId} no encontrada.`);

        const stockAnterior = variante.stock;
        const stockNuevo = stockAnterior + recepcion.cantidadRecibida;
        const costoPromedioNuevo =
          stockAnterior > 0
            ? (stockAnterior * Number(variante.costo_promedio) + recepcion.cantidadRecibida * Number(item.costoUnitario)) /
              stockNuevo
            : Number(item.costoUnitario);

        await tx.variante.update({
          where: { id: item.varianteId },
          data: { stock: stockNuevo, costoPromedio: costoPromedioNuevo, costoCompra: item.costoUnitario },
        });

        await tx.movimientoInventario.create({
          data: {
            empresaId: ctx.empresaId,
            varianteId: item.varianteId,
            sucursalId: variante.sucursal_id,
            tipo: TipoMovimiento.ENTRADA,
            origen: OrigenMovimiento.COMPRA,
            cantidad: recepcion.cantidadRecibida,
            stockAnterior,
            stockNuevo,
            costoUnitario: item.costoUnitario,
            motivo: `Recepción orden de compra #${orden.numero}`,
            referenciaTipo: "orden_compra",
            referenciaId: orden.id,
            usuarioId: ctx.usuarioId,
          },
        });

        await tx.ordenCompraItem.update({
          where: { id: item.id },
          data: { cantidadRecibida: totalRecibido },
        });
      }

      const itemsActualizados = await tx.ordenCompraItem.findMany({ where: { ordenCompraId: id } });
      const completa = itemsActualizados.every((i) => i.cantidadRecibida >= i.cantidad);
      const nuevoEstado = completa ? "RECIBIDA_TOTAL" : "RECIBIDA_PARCIAL";

      const actualizada = await tx.ordenCompra.update({
        where: { id, version: dto.version },
        data: { estado: nuevoEstado, version: { increment: 1 } },
        include: { items: true },
      });

      // Cuenta por pagar: se genera una sola vez, en la primera recepción.
      const cxpExistente = await tx.cuentaPorPagar.findFirst({ where: { ordenCompraId: id } });
      if (!cxpExistente) {
        await tx.cuentaPorPagar.create({
          data: {
            empresaId: ctx.empresaId,
            proveedorId: orden.proveedorId,
            ordenCompraId: id,
            monto: orden.total,
            saldo: orden.total,
          },
        });
      }

      await this.audit.registrar({
        empresaId: ctx.empresaId,
        usuarioId: ctx.usuarioId,
        modulo: "compras",
        accion: "recibir",
        entidadId: id,
        despues: actualizada,
        resultado: "exito",
      });

      return actualizada;
    });
  }

  async cancelar(id: string, dto: CancelarOrdenCompraDto, ctx: RequestContext) {
    const orden = await this.prisma.ordenCompra.findFirst({ where: { id, empresaId: ctx.empresaId } });
    if (!orden) throw new NotFoundException("Orden de compra no encontrada.");
    if (!["BORRADOR", "ENVIADA"].includes(orden.estado)) {
      throw new ConflictException("No se puede cancelar una orden que ya tiene recepciones de mercancía.");
    }
    if (orden.version !== dto.version) throw new ConflictException("La orden fue modificada por otro usuario.");

    const cancelada = await this.prisma.ordenCompra.update({
      where: { id, version: dto.version },
      data: {
        estado: "CANCELADA",
        observaciones: `${orden.observaciones ?? ""}\nCancelada: ${dto.motivo}`.trim(),
        version: { increment: 1 },
      },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "compras",
      accion: "cancelar",
      entidadId: id,
      antes: orden,
      despues: cancelada,
      resultado: "exito",
    });

    return cancelada;
  }

  async listar(query: PaginationQueryDto & { estado?: string; proveedorId?: string }, ctx: RequestContext) {
    const where: Prisma.OrdenCompraWhereInput = {
      empresaId: ctx.empresaId,
      ...(query.estado && { estado: query.estado as never }),
      ...(query.proveedorId && { proveedorId: query.proveedorId }),
    };

    const [total, data] = await Promise.all([
      this.prisma.ordenCompra.count({ where }),
      this.prisma.ordenCompra.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.limit,
        include: { proveedor: { select: { nombre: true } }, _count: { select: { items: true } } },
      }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async obtenerPorId(id: string, ctx: RequestContext) {
    const orden = await this.prisma.ordenCompra.findFirst({
      where: { id, empresaId: ctx.empresaId },
      include: {
        proveedor: true,
        items: { include: { variante: { include: { producto: { select: { nombre: true } } } } } },
      },
    });
    if (!orden) throw new NotFoundException("Orden de compra no encontrada.");
    return orden;
  }
}
