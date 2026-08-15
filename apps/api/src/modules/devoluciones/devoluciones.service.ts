import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { OrigenMovimiento, Prisma, TipoMovimiento } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { CreateDevolucionDto, RechazarDevolucionDto } from "./dto/devolucion.dto";
import { buildPaginatedResponse, PaginationQueryDto } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

@Injectable()
export class DevolucionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async crear(dto: CreateDevolucionDto, ctx: RequestContext) {
    const venta = await this.prisma.venta.findFirst({
      where: { id: dto.ventaId, empresaId: ctx.empresaId },
    });
    if (!venta) throw new NotFoundException("Venta no encontrada.");
    if (venta.estado !== "COMPLETADA") {
      throw new BadRequestException("Solo se pueden solicitar devoluciones sobre ventas completadas.");
    }

    if (dto.tipo === "CAMBIO_TALLA" || dto.tipo === "CAMBIO_COLOR") {
      for (const item of dto.items) {
        if (!item.varianteNuevaId) {
          throw new BadRequestException("Debes indicar la variante nueva para un cambio.");
        }
      }
    }

    const devolucion = await this.prisma.devolucion.create({
      data: {
        empresaId: ctx.empresaId,
        sucursalId: dto.sucursalId,
        ventaId: dto.ventaId,
        clienteId: dto.clienteId ?? venta.clienteId,
        tipo: dto.tipo,
        motivo: dto.motivo,
        montoReembolso: dto.montoReembolso,
        usuarioId: ctx.usuarioId,
        items: {
          createMany: {
            data: dto.items.map((i) => ({
              varianteId: i.varianteId,
              cantidad: i.cantidad,
              varianteNuevaId: i.varianteNuevaId,
            })),
          },
        },
      },
      include: { items: true },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "devoluciones",
      accion: "crear",
      entidadId: devolucion.id,
      despues: devolucion,
      resultado: "exito",
    });

    return devolucion;
  }

  async listar(query: PaginationQueryDto & { estado?: string }, ctx: RequestContext) {
    const where: Prisma.DevolucionWhereInput = {
      empresaId: ctx.empresaId,
      ...(query.estado && { estado: query.estado as never }),
    };

    const [total, data] = await Promise.all([
      this.prisma.devolucion.count({ where }),
      this.prisma.devolucion.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.limit,
        include: { _count: { select: { items: true } } },
      }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async obtenerPorId(id: string, ctx: RequestContext) {
    const devolucion = await this.prisma.devolucion.findFirst({
      where: { id, empresaId: ctx.empresaId },
      include: { items: true },
    });
    if (!devolucion) throw new NotFoundException("Devolución no encontrada.");
    return devolucion;
  }

  /**
   * Procesa la devolución: reingresa el/los producto(s) devueltos al
   * inventario y, si es un cambio, descuenta la variante nueva entregada.
   * Si es CREDITO, abona el saldo a favor del cliente. Todo en una única
   * transacción — o se completa por entero o no se aplica nada.
   */
  async procesar(id: string, ctx: RequestContext) {
    return this.prisma.$transaction(async (tx) => {
      const devolucion = await tx.devolucion.findFirst({
        where: { id, empresaId: ctx.empresaId },
        include: { items: true },
      });
      if (!devolucion) throw new NotFoundException("Devolución no encontrada.");
      if (devolucion.estado !== "SOLICITADA") {
        throw new ConflictException("Esta devolución ya fue procesada o rechazada.");
      }

      for (const item of devolucion.items) {
        // Reingreso del producto devuelto.
        const devuelta = await tx.variante.findUniqueOrThrow({ where: { id: item.varianteId } });
        const stockNuevoDevuelta = devuelta.stock + item.cantidad;
        await tx.variante.update({ where: { id: item.varianteId }, data: { stock: stockNuevoDevuelta } });
        await tx.movimientoInventario.create({
          data: {
            empresaId: ctx.empresaId,
            varianteId: item.varianteId,
            sucursalId: devolucion.sucursalId,
            tipo: TipoMovimiento.DEVOLUCION,
            origen: OrigenMovimiento.DEVOLUCION_CLIENTE,
            cantidad: item.cantidad,
            stockAnterior: devuelta.stock,
            stockNuevo: stockNuevoDevuelta,
            motivo: `Devolución de venta - ${devolucion.motivo}`,
            referenciaTipo: "devolucion",
            referenciaId: devolucion.id,
            usuarioId: ctx.usuarioId,
          },
        });

        // Si es cambio, se entrega la variante nueva (descuenta stock).
        if (item.varianteNuevaId) {
          const nueva = await tx.variante.findUniqueOrThrow({ where: { id: item.varianteNuevaId } });
          if (nueva.stock < item.cantidad) {
            throw new BadRequestException(
              `Stock insuficiente para el cambio. Variante ${item.varianteNuevaId} disponible: ${nueva.stock}.`,
            );
          }
          const stockNuevoEntregada = nueva.stock - item.cantidad;
          await tx.variante.update({ where: { id: item.varianteNuevaId }, data: { stock: stockNuevoEntregada } });
          await tx.movimientoInventario.create({
            data: {
              empresaId: ctx.empresaId,
              varianteId: item.varianteNuevaId,
              sucursalId: devolucion.sucursalId,
              tipo: TipoMovimiento.SALIDA,
              origen: OrigenMovimiento.DEVOLUCION_CLIENTE,
              cantidad: item.cantidad,
              stockAnterior: nueva.stock,
              stockNuevo: stockNuevoEntregada,
              motivo: `Entrega por cambio - devolución ${devolucion.id}`,
              referenciaTipo: "devolucion",
              referenciaId: devolucion.id,
              usuarioId: ctx.usuarioId,
            },
          });
        }
      }

      if (devolucion.tipo === "CREDITO" && devolucion.clienteId && devolucion.montoReembolso) {
        await tx.cliente.update({
          where: { id: devolucion.clienteId },
          data: { saldoCredito: { increment: devolucion.montoReembolso } },
        });
      }

      const procesada = await tx.devolucion.update({
        where: { id },
        data: { estado: "COMPLETADA", procesadaAt: new Date() },
      });

      await this.audit.registrar({
        empresaId: ctx.empresaId,
        usuarioId: ctx.usuarioId,
        modulo: "devoluciones",
        accion: "procesar",
        entidadId: id,
        despues: procesada,
        resultado: "exito",
      });

      return procesada;
    });
  }

  async rechazar(id: string, dto: RechazarDevolucionDto, ctx: RequestContext) {
    const devolucion = await this.prisma.devolucion.findFirst({ where: { id, empresaId: ctx.empresaId } });
    if (!devolucion) throw new NotFoundException("Devolución no encontrada.");
    if (devolucion.estado !== "SOLICITADA") {
      throw new ConflictException("Esta devolución ya fue procesada o rechazada.");
    }

    const rechazada = await this.prisma.devolucion.update({
      where: { id },
      data: { estado: "RECHAZADA", motivoRechazo: dto.motivo },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "devoluciones",
      accion: "rechazar",
      entidadId: id,
      despues: rechazada,
      resultado: "exito",
    });

    return rechazada;
  }
}
