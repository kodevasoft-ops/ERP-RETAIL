import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { CreateCotizacionDto } from "./dto/cotizacion.dto";
import { buildPaginatedResponse, PaginationQueryDto } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

@Injectable()
export class CotizacionesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  private async siguienteNumero(tx: Prisma.TransactionClient, empresaId: string, sucursalId: string) {
    await tx.numeracion.upsert({
      where: { empresaId_sucursalId_tipo: { empresaId, sucursalId, tipo: "cotizacion" } },
      update: {},
      create: { empresaId, sucursalId, tipo: "cotizacion", consecutivoActual: 0 },
    });
    const actualizado = await tx.numeracion.update({
      where: { empresaId_sucursalId_tipo: { empresaId, sucursalId, tipo: "cotizacion" } },
      data: { consecutivoActual: { increment: 1 } },
    });
    return actualizado.consecutivoActual;
  }

  async crear(dto: CreateCotizacionDto, ctx: RequestContext) {
    const variantes = await this.prisma.variante.findMany({
      where: { id: { in: dto.items.map((i) => i.varianteId) }, deletedAt: null },
    });
    const varianteMap = new Map(variantes.map((v) => [v.id, v]));

    let subtotal = 0;
    let descuentoTotal = 0;
    let ivaTotal = 0;
    const itemsData: Prisma.CotizacionItemCreateManyCotizacionInput[] = [];

    for (const item of dto.items) {
      const variante = varianteMap.get(item.varianteId);
      if (!variante) throw new NotFoundException(`Variante ${item.varianteId} no encontrada.`);

      const descuentoPct = item.descuentoPorcentaje ?? 0;
      const precioUnitario = Number(variante.precioVenta);
      const bruto = precioUnitario * item.cantidad;
      const descuentoMonto = bruto * (descuentoPct / 100);
      const subtotalItem = bruto - descuentoMonto;
      const ivaItem = subtotalItem * (Number(variante.iva) / 100);

      subtotal += subtotalItem;
      descuentoTotal += descuentoMonto;
      ivaTotal += ivaItem;

      itemsData.push({
        varianteId: item.varianteId,
        cantidad: item.cantidad,
        precioUnitario,
        descuentoPorcentaje: descuentoPct,
        ivaPorcentaje: Number(variante.iva),
        subtotal: subtotalItem,
        total: subtotalItem + ivaItem,
      });
    }

    const cotizacion = await this.prisma.$transaction(async (tx) => {
      const numero = await this.siguienteNumero(tx, ctx.empresaId, dto.sucursalId);
      return tx.cotizacion.create({
        data: {
          empresaId: ctx.empresaId,
          sucursalId: dto.sucursalId,
          numero,
          clienteId: dto.clienteId,
          leadId: dto.leadId,
          vendedorId: ctx.usuarioId,
          subtotal,
          descuentoTotal,
          ivaTotal,
          total: subtotal + ivaTotal,
          fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : undefined,
          observaciones: dto.observaciones,
          items: { createMany: { data: itemsData } },
        },
        include: { items: true },
      });
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "cotizaciones",
      accion: "crear",
      entidadId: cotizacion.id,
      despues: cotizacion,
      resultado: "exito",
    });

    return cotizacion;
  }

  async listar(query: PaginationQueryDto & { estado?: string }, ctx: RequestContext) {
    const where: Prisma.CotizacionWhereInput = {
      empresaId: ctx.empresaId,
      ...(query.estado && { estado: query.estado as never }),
    };

    const [total, data] = await Promise.all([
      this.prisma.cotizacion.count({ where }),
      this.prisma.cotizacion.findMany({
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
    const cotizacion = await this.prisma.cotizacion.findFirst({
      where: { id, empresaId: ctx.empresaId },
      include: {
        items: { include: { variante: { include: { producto: { select: { nombre: true } } } } } },
      },
    });
    if (!cotizacion) throw new NotFoundException("Cotización no encontrada.");
    return cotizacion;
  }

  async cambiarEstado(id: string, estado: "ENVIADA" | "ACEPTADA" | "RECHAZADA", ctx: RequestContext) {
    const cotizacion = await this.prisma.cotizacion.findFirst({ where: { id, empresaId: ctx.empresaId } });
    if (!cotizacion) throw new NotFoundException("Cotización no encontrada.");
    if (cotizacion.estado === "CONVERTIDA") {
      throw new ConflictException("Esta cotización ya fue convertida en venta y no se puede modificar.");
    }

    const actualizada = await this.prisma.cotizacion.update({ where: { id }, data: { estado } });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "cotizaciones",
      accion: `estado-${estado.toLowerCase()}`,
      entidadId: id,
      antes: { estado: cotizacion.estado },
      despues: { estado },
      resultado: "exito",
    });

    return actualizada;
  }
}
