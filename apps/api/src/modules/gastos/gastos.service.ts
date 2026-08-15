import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { CreateGastoDto, UpdateGastoDto } from "./dto/gasto.dto";
import { buildPaginatedResponse, PaginationQueryDto } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

@Injectable()
export class GastosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async crear(dto: CreateGastoDto, ctx: RequestContext) {
    // Si el gasto se paga desde una caja abierta, se registra también como
    // retiro de caja — una sola operación, un solo rastro contable.
    const gasto = await this.prisma.$transaction(async (tx) => {
      const creado = await tx.gasto.create({
        data: {
          empresaId: ctx.empresaId,
          sucursalId: dto.sucursalId,
          categoria: dto.categoria,
          descripcion: dto.descripcion,
          monto: dto.monto,
          fecha: new Date(dto.fecha),
          comprobanteUrl: dto.comprobanteUrl,
          sesionCajaId: dto.sesionCajaId,
          usuarioId: ctx.usuarioId,
        },
      });

      if (dto.sesionCajaId) {
        const sesion = await tx.sesionCaja.findFirst({ where: { id: dto.sesionCajaId, estado: "ABIERTA" } });
        if (!sesion) throw new NotFoundException("La sesión de caja indicada no está abierta.");

        await tx.movimientoCaja.create({
          data: {
            sesionCajaId: dto.sesionCajaId,
            tipo: "RETIRO",
            monto: dto.monto,
            motivo: `Gasto: ${dto.descripcion}`,
            usuarioId: ctx.usuarioId,
          },
        });
      }

      return creado;
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "gastos",
      accion: "crear",
      entidadId: gasto.id,
      despues: gasto,
      resultado: "exito",
    });

    return gasto;
  }

  async listar(query: PaginationQueryDto & { categoria?: string; desde?: string; hasta?: string }, ctx: RequestContext) {
    const where: Prisma.GastoWhereInput = {
      empresaId: ctx.empresaId,
      deletedAt: null,
      ...(query.categoria && { categoria: query.categoria as never }),
      ...((query.desde || query.hasta) && {
        fecha: {
          ...(query.desde && { gte: new Date(query.desde) }),
          ...(query.hasta && { lte: new Date(query.hasta) }),
        },
      }),
      ...(query.search && { descripcion: { contains: query.search, mode: "insensitive" } }),
    };

    const [total, data] = await Promise.all([
      this.prisma.gasto.count({ where }),
      this.prisma.gasto.findMany({ where, orderBy: { fecha: "desc" }, skip: query.skip, take: query.limit }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async actualizar(id: string, dto: UpdateGastoDto, ctx: RequestContext) {
    const actual = await this.prisma.gasto.findFirst({ where: { id, empresaId: ctx.empresaId, deletedAt: null } });
    if (!actual) throw new NotFoundException("Gasto no encontrado.");
    if (actual.version !== dto.version) throw new ConflictException("Este gasto fue modificado por otro usuario.");

    const { version, fecha, ...cambios } = dto;
    const actualizado = await this.prisma.gasto.update({
      where: { id, version: actual.version },
      data: { ...cambios, ...(fecha && { fecha: new Date(fecha) }), version: { increment: 1 } },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "gastos",
      accion: "editar",
      entidadId: id,
      antes: actual,
      despues: actualizado,
      resultado: "exito",
    });

    return actualizado;
  }

  async eliminar(id: string, ctx: RequestContext) {
    const actual = await this.prisma.gasto.findFirst({ where: { id, empresaId: ctx.empresaId, deletedAt: null } });
    if (!actual) throw new NotFoundException("Gasto no encontrado.");

    await this.prisma.gasto.update({ where: { id }, data: { deletedAt: new Date() } });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "gastos",
      accion: "eliminar",
      entidadId: id,
      antes: actual,
      resultado: "exito",
    });

    return { success: true };
  }

  async resumenPorCategoria(desde: Date, hasta: Date, ctx: { empresaId: string }) {
    const resultado = await this.prisma.gasto.groupBy({
      by: ["categoria"],
      where: { empresaId: ctx.empresaId, deletedAt: null, fecha: { gte: desde, lte: hasta } },
      _sum: { monto: true },
      orderBy: { _sum: { monto: "desc" } },
    });
    return resultado.map((r) => ({ categoria: r.categoria, total: Number(r._sum.monto ?? 0) }));
  }
}
