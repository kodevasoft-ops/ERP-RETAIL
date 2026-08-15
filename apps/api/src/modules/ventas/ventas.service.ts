import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { MetodoPago, OrigenMovimiento, Prisma, TipoMovimiento } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { NotificacionesService } from "../notificaciones/notificaciones.service";
import { CreateVentaDto, AnularVentaDto } from "./dto/venta.dto";
import { buildPaginatedResponse, PaginationQueryDto } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
  permisos: string[];
  ip?: string;
  userAgent?: string;
  correlationId?: string;
}

interface VarianteLock {
  id: string;
  stock: number;
  precio_venta: string;
  iva: string;
  descuento_max: string;
  sucursal_id: string;
}

const TOLERANCIA_REDONDEO = 1; // pesos — evita falsos rechazos por decimales

@Injectable()
export class VentasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  private async lockVariante(tx: Prisma.TransactionClient, varianteId: string, empresaId: string) {
    const rows = await tx.$queryRaw<VarianteLock[]>`
      SELECT v.id, v.stock, v.precio_venta, v.iva, v.descuento_max, v.sucursal_id
      FROM variantes v
      INNER JOIN productos p ON p.id = v.producto_id
      WHERE v.id = ${varianteId} AND p.empresa_id = ${empresaId} AND v.deleted_at IS NULL
      FOR UPDATE
    `;
    if (rows.length === 0) throw new NotFoundException(`Variante ${varianteId} no encontrada.`);
    return rows[0];
  }

  private async siguienteNumero(tx: Prisma.TransactionClient, empresaId: string, sucursalId: string, tipo = "venta") {
    // Upsert + update atómico: Postgres bloquea la fila durante el UPDATE,
    // así que dos checkouts concurrentes nunca obtienen el mismo consecutivo.
    await tx.numeracion.upsert({
      where: { empresaId_sucursalId_tipo: { empresaId, sucursalId, tipo } },
      update: {},
      create: { empresaId, sucursalId, tipo, consecutivoActual: 0 },
    });

    const actualizado = await tx.numeracion.update({
      where: { empresaId_sucursalId_tipo: { empresaId, sucursalId, tipo } },
      data: { consecutivoActual: { increment: 1 } },
    });

    return actualizado.consecutivoActual;
  }

  async crear(dto: CreateVentaDto, ctx: RequestContext) {
    if (dto.pagos.some((p) => p.metodo === "CREDITO") && !dto.clienteId) {
      throw new BadRequestException("Una venta a crédito requiere un cliente identificado.");
    }

    // Chequeo rápido de idempotencia fuera de la transacción principal.
    const existente = await this.prisma.venta.findUnique({
      where: { empresaId_idempotencyKey: { empresaId: ctx.empresaId, idempotencyKey: dto.idempotencyKey } },
      include: { items: true, pagos: true },
    });
    if (existente) return existente;

    try {
      const venta = await this.prisma.$transaction(async (tx) => {
        let subtotalVenta = 0;
        let descuentoVenta = 0;
        let ivaVenta = 0;
        const itemsData: Prisma.VentaItemCreateManyVentaInput[] = [];

        for (const item of dto.items) {
          const variante = await this.lockVariante(tx, item.varianteId, ctx.empresaId);

          if (variante.stock < item.cantidad) {
            throw new BadRequestException(
              `Stock insuficiente para la variante ${item.varianteId}. Disponible: ${variante.stock}.`,
            );
          }

          const descuentoPct = item.descuentoPorcentaje ?? 0;
          if (descuentoPct > Number(variante.descuento_max)) {
            throw new BadRequestException(
              `El descuento solicitado (${descuentoPct}%) excede el máximo permitido (${variante.descuento_max}%).`,
            );
          }

          const precioUnitario = Number(variante.precio_venta);
          const bruto = precioUnitario * item.cantidad;
          const descuentoMonto = bruto * (descuentoPct / 100);
          const subtotalItem = bruto - descuentoMonto;
          const ivaItem = subtotalItem * (Number(variante.iva) / 100);
          const totalItem = subtotalItem + ivaItem;

          subtotalVenta += subtotalItem;
          descuentoVenta += descuentoMonto;
          ivaVenta += ivaItem;

          itemsData.push({
            varianteId: item.varianteId,
            cantidad: item.cantidad,
            precioUnitario,
            descuentoPorcentaje: descuentoPct,
            ivaPorcentaje: Number(variante.iva),
            subtotal: subtotalItem,
            total: totalItem,
          });

          // Descuento de stock + kardex, en la misma transacción del checkout.
          const stockNuevo = variante.stock - item.cantidad;
          await tx.variante.update({ where: { id: item.varianteId }, data: { stock: stockNuevo } });
        }

        const totalVenta = subtotalVenta + ivaVenta;
        const totalPagado = dto.pagos.reduce((sum, p) => sum + p.monto, 0);

        if (Math.abs(totalPagado - totalVenta) > TOLERANCIA_REDONDEO) {
          throw new BadRequestException(
            `Los pagos (${totalPagado.toFixed(2)}) no coinciden con el total de la venta (${totalVenta.toFixed(2)}).`,
          );
        }

        const numero = await this.siguienteNumero(tx, ctx.empresaId, dto.sucursalId);

        if (dto.cotizacionId) {
          const cotizacion = await tx.cotizacion.findFirst({
            where: { id: dto.cotizacionId, empresaId: ctx.empresaId },
          });
          if (!cotizacion) throw new NotFoundException("Cotización no encontrada.");
          if (cotizacion.estado === "CONVERTIDA") {
            throw new ConflictException("Esta cotización ya fue convertida en una venta.");
          }
        }

        const venta = await tx.venta.create({
          data: {
            empresaId: ctx.empresaId,
            sucursalId: dto.sucursalId,
            numero,
            clienteId: dto.clienteId,
            vendedorId: ctx.usuarioId,
            cajaId: dto.cajaId,
            subtotal: subtotalVenta,
            descuentoTotal: descuentoVenta,
            ivaTotal: ivaVenta,
            total: totalVenta,
            observaciones: dto.observaciones,
            idempotencyKey: dto.idempotencyKey,
            items: { createMany: { data: itemsData } },
            pagos: {
              createMany: {
                data: dto.pagos.map((p) => ({ metodo: p.metodo, monto: p.monto, referencia: p.referencia })),
              },
            },
          },
          include: { items: true, pagos: true },
        });

        if (dto.cotizacionId) {
          await tx.cotizacion.update({
            where: { id: dto.cotizacionId },
            data: { estado: "CONVERTIDA", ventaId: venta.id },
          });
        }

        // Si algún pago fue a crédito, genera automáticamente la cuenta por
        // cobrar — sin esto, una venta a crédito no dejaba ningún rastro
        // de que el cliente todavía debe ese dinero.
        const montoCredito = dto.pagos.filter((p) => p.metodo === "CREDITO").reduce((sum, p) => sum + p.monto, 0);
        if (montoCredito > 0 && venta.clienteId) {
          await tx.cuentaPorCobrar.create({
            data: {
              empresaId: ctx.empresaId,
              clienteId: venta.clienteId,
              ventaId: venta.id,
              monto: montoCredito,
              saldo: montoCredito,
              fechaVencimiento: new Date(Date.now() + 30 * 24 * 60 * 60_000), // 30 días por defecto
            },
          });
        }

        // Kardex: un movimiento de salida por cada línea, referenciado a la venta.
        for (const item of itemsData) {
          const varianteActual = await tx.variante.findUniqueOrThrow({ where: { id: item.varianteId } });
          await tx.movimientoInventario.create({
            data: {
              empresaId: ctx.empresaId,
              varianteId: item.varianteId,
              sucursalId: dto.sucursalId,
              tipo: TipoMovimiento.SALIDA,
              origen: OrigenMovimiento.VENTA,
              cantidad: item.cantidad,
              stockAnterior: varianteActual.stock + item.cantidad,
              stockNuevo: varianteActual.stock,
              motivo: `Venta #${venta.prefijo}${numero}`,
              referenciaTipo: "venta",
              referenciaId: venta.id,
              usuarioId: ctx.usuarioId,
            },
          });
        }

        await this.audit.registrar({
          empresaId: ctx.empresaId,
          usuarioId: ctx.usuarioId,
          ip: ctx.ip,
          userAgent: ctx.userAgent,
          correlationId: ctx.correlationId,
          modulo: "ventas",
          accion: "crear",
          entidadId: venta.id,
          despues: venta,
          resultado: "exito",
        });

        return venta;
      });

      // Fuera de la transacción: una notificación fallida nunca debe
      // revertir una venta ya confirmada.
      await this.notificarStockBajo(dto.items.map((i) => i.varianteId), ctx);

      return venta;
    } catch (error) {
      // Condición de carrera: dos requests con la misma idempotencyKey
      // llegaron simultáneamente y ambas pasaron el chequeo previo.
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const venta = await this.prisma.venta.findUnique({
          where: { empresaId_idempotencyKey: { empresaId: ctx.empresaId, idempotencyKey: dto.idempotencyKey } },
          include: { items: true, pagos: true },
        });
        if (venta) return venta;
      }
      throw error;
    }
  }

  private async notificarStockBajo(varianteIds: string[], ctx: RequestContext) {
    if (varianteIds.length === 0) return;
    const variantesBajas = await this.prisma.$queryRaw<
      { id: string; talla: string; color: string; stock: number; nombre: string }[]
    >`
      SELECT v.id, v.talla, v.color, v.stock, p.nombre
      FROM variantes v
      INNER JOIN productos p ON p.id = v.producto_id
      WHERE v.id = ANY(${varianteIds})
        AND v.stock <= v.stock_minimo
    `;

    for (const v of variantesBajas) {
      await this.notificaciones.crear({
        empresaId: ctx.empresaId,
        tipo: "STOCK_BAJO",
        titulo: "Stock bajo",
        mensaje: `${v.nombre} (${v.talla}/${v.color}) quedó con ${v.stock} unidades.`,
        entidadTipo: "variante",
        entidadId: v.id,
      });
    }
  }

  async anular(id: string, dto: AnularVentaDto, ctx: RequestContext) {
    if (!ctx.permisos.includes("ventas:anular")) {
      throw new ForbiddenException("Requiere permiso de anulación de ventas.");
    }

    return this.prisma.$transaction(async (tx) => {
      const venta = await tx.venta.findFirst({
        where: { id, empresaId: ctx.empresaId },
        include: { items: true },
      });
      if (!venta) throw new NotFoundException("Venta no encontrada.");
      if (venta.estado === "ANULADA") {
        throw new ConflictException("Esta venta ya se encuentra anulada.");
      }

      // Revertir stock de cada línea (reingreso al inventario).
      for (const item of venta.items) {
        const variante = await tx.variante.findUniqueOrThrow({ where: { id: item.varianteId } });
        const stockNuevo = variante.stock + item.cantidad;
        await tx.variante.update({ where: { id: item.varianteId }, data: { stock: stockNuevo } });

        await tx.movimientoInventario.create({
          data: {
            empresaId: ctx.empresaId,
            varianteId: item.varianteId,
            sucursalId: venta.sucursalId,
            tipo: TipoMovimiento.ENTRADA,
            origen: OrigenMovimiento.VENTA,
            cantidad: item.cantidad,
            stockAnterior: variante.stock,
            stockNuevo,
            motivo: `Anulación venta #${venta.prefijo}${venta.numero}: ${dto.motivo}`,
            referenciaTipo: "venta",
            referenciaId: venta.id,
            usuarioId: ctx.usuarioId,
          },
        });
      }

      const anulada = await tx.venta.update({
        where: { id },
        data: {
          estado: "ANULADA",
          motivoAnulacion: dto.motivo,
          anuladaPorId: ctx.usuarioId,
          anuladaAt: new Date(),
        },
      });

      // Documento fiscal formal, no solo un cambio de estado: numeración
      // consecutiva propia (mismo mecanismo atómico que Ventas/Compras),
      // e ítems espejo de la factura original — queda como el respaldo
      // legal de la reversa, imprimible y descargable igual que la factura.
      const numeroNotaCredito = await this.siguienteNumero(tx, ctx.empresaId, venta.sucursalId, "nota_credito");
      const notaCredito = await tx.notaCredito.create({
        data: {
          empresaId: ctx.empresaId,
          sucursalId: venta.sucursalId,
          numero: numeroNotaCredito,
          ventaId: venta.id,
          motivo: dto.motivo,
          subtotal: venta.subtotal,
          ivaTotal: venta.ivaTotal,
          total: venta.total,
          usuarioId: ctx.usuarioId,
          items: {
            createMany: {
              data: venta.items.map((i) => ({
                varianteId: i.varianteId,
                cantidad: i.cantidad,
                precioUnitario: i.precioUnitario,
                ivaPorcentaje: i.ivaPorcentaje,
                total: i.total,
              })),
            },
          },
        },
      });

      await this.audit.registrar({
        empresaId: ctx.empresaId,
        usuarioId: ctx.usuarioId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        correlationId: ctx.correlationId,
        modulo: "ventas",
        accion: "anular",
        entidadId: id,
        antes: venta,
        despues: { anulada, notaCredito },
        resultado: "exito",
      });

      return { ...anulada, notaCredito };
    });
  }

  async listar(
    query: PaginationQueryDto & { estado?: "COMPLETADA" | "ANULADA"; clienteId?: string; sucursalId?: string },
    ctx: RequestContext,
  ) {
    const where: Prisma.VentaWhereInput = {
      empresaId: ctx.empresaId,
      ...(query.estado && { estado: query.estado }),
      ...(query.clienteId && { clienteId: query.clienteId }),
      ...(query.sucursalId && { sucursalId: query.sucursalId }),
      ...(query.search && {
        numero: Number.isNaN(Number(query.search)) ? undefined : Number(query.search),
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.venta.count({ where }),
      this.prisma.venta.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.limit,
        include: { pagos: true, _count: { select: { items: true } } },
      }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async obtenerPorId(id: string, ctx: RequestContext) {
    const venta = await this.prisma.venta.findFirst({
      where: { id, empresaId: ctx.empresaId },
      include: {
        items: { include: { variante: { include: { producto: { select: { nombre: true, codigo: true } } } } } },
        pagos: true,
      },
    });
    if (!venta) throw new NotFoundException("Venta no encontrada.");
    return venta;
  }

  async datosParaFactura(id: string, ctx: RequestContext) {
    const venta = await this.prisma.venta.findFirst({
      where: { id, empresaId: ctx.empresaId },
      include: {
        items: { include: { variante: { include: { producto: { select: { nombre: true } } } } } },
        pagos: true,
        cliente: { select: { nombre: true, apellido: true, numeroDocumento: true } },
      },
    });
    if (!venta) throw new NotFoundException("Venta no encontrada.");

    const [empresa, vendedor] = await Promise.all([
      this.prisma.empresa.findUniqueOrThrow({ where: { id: ctx.empresaId }, select: { nombre: true, nit: true } }),
      this.prisma.usuario.findUnique({ where: { id: venta.vendedorId }, select: { nombre: true, apellido: true } }),
    ]);

    return {
      empresa,
      numero: `${venta.prefijo}${venta.numero}`,
      fecha: venta.createdAt,
      cliente: venta.cliente
        ? { nombre: `${venta.cliente.nombre} ${venta.cliente.apellido ?? ""}`.trim(), documento: venta.cliente.numeroDocumento }
        : null,
      vendedor: vendedor ? `${vendedor.nombre} ${vendedor.apellido}` : "—",
      items: venta.items.map((i) => ({
        producto: i.variante.producto.nombre,
        variante: `${i.variante.talla}/${i.variante.color}`,
        cantidad: i.cantidad,
        precioUnitario: Number(i.precioUnitario),
        descuentoPorcentaje: Number(i.descuentoPorcentaje),
        ivaPorcentaje: Number(i.ivaPorcentaje),
        total: Number(i.total),
      })),
      subtotal: Number(venta.subtotal),
      descuentoTotal: Number(venta.descuentoTotal),
      ivaTotal: Number(venta.ivaTotal),
      total: Number(venta.total),
      pagos: venta.pagos.map((p) => ({ metodo: p.metodo, monto: Number(p.monto) })),
      estado: venta.estado,
      motivoAnulacion: venta.motivoAnulacion,
    };
  }

  async datosParaNotaCredito(id: string, ctx: RequestContext) {
    const notaCredito = await this.prisma.notaCredito.findFirst({
      where: { ventaId: id, empresaId: ctx.empresaId },
      include: {
        items: { include: { variante: { include: { producto: { select: { nombre: true } } } } } },
        venta: {
          select: {
            numero: true,
            prefijo: true,
            vendedorId: true,
            cliente: { select: { nombre: true, apellido: true, numeroDocumento: true } },
          },
        },
      },
    });
    if (!notaCredito) throw new NotFoundException("Esta venta no tiene una nota crédito asociada.");

    const [empresa, vendedor] = await Promise.all([
      this.prisma.empresa.findUniqueOrThrow({ where: { id: ctx.empresaId }, select: { nombre: true, nit: true } }),
      this.prisma.usuario.findUnique({
        where: { id: notaCredito.venta.vendedorId },
        select: { nombre: true, apellido: true },
      }),
    ]);

    return {
      empresa,
      numero: `${notaCredito.prefijo}${notaCredito.numero}`,
      fecha: notaCredito.createdAt,
      cliente: notaCredito.venta.cliente
        ? {
            nombre: `${notaCredito.venta.cliente.nombre} ${notaCredito.venta.cliente.apellido ?? ""}`.trim(),
            documento: notaCredito.venta.cliente.numeroDocumento,
          }
        : null,
      vendedor: vendedor ? `${vendedor.nombre} ${vendedor.apellido}` : "—",
      items: notaCredito.items.map((i) => ({
        producto: i.variante.producto.nombre,
        variante: `${i.variante.talla}/${i.variante.color}`,
        cantidad: i.cantidad,
        precioUnitario: Number(i.precioUnitario),
        descuentoPorcentaje: 0,
        ivaPorcentaje: Number(i.ivaPorcentaje),
        total: Number(i.total),
      })),
      subtotal: Number(notaCredito.subtotal),
      descuentoTotal: 0,
      ivaTotal: Number(notaCredito.ivaTotal),
      total: Number(notaCredito.total),
      pagos: [],
      estado: "COMPLETADA" as const,
      motivoAnulacion: notaCredito.motivo,
      tipoDocumento: "NOTA_CREDITO" as const,
      facturaOrigenNumero: `${notaCredito.venta.prefijo}${notaCredito.venta.numero}`,
    };
  }
}
