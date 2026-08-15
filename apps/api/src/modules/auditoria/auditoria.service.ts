import { Injectable } from "@nestjs/common";
import { Prisma } from "database";
import { PrismaService } from "../../database/prisma.service";
import { PaginationQueryDto, buildPaginatedResponse } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
}

@Injectable()
export class AuditoriaService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(
    query: PaginationQueryDto & { modulo?: string; usuarioId?: string; desde?: string; hasta?: string; resultado?: string },
    ctx: RequestContext,
  ) {
    const where: Prisma.AuditLogWhereInput = {
      empresaId: ctx.empresaId,
      ...(query.modulo && { modulo: query.modulo }),
      ...(query.usuarioId && { usuarioId: query.usuarioId }),
      ...(query.resultado && { resultado: query.resultado }),
      ...((query.desde || query.hasta) && {
        createdAt: {
          ...(query.desde && { gte: new Date(query.desde) }),
          ...(query.hasta && { lte: new Date(query.hasta) }),
        },
      }),
      ...(query.search && {
        OR: [{ accion: { contains: query.search, mode: "insensitive" } }, { entidadId: { contains: query.search } }],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.limit,
        include: { usuario: { select: { nombre: true, apellido: true, email: true } } },
      }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  /** Lista de módulos con actividad registrada — alimenta el filtro del frontend sin hardcodear la lista. */
  async modulosConActividad(ctx: RequestContext) {
    const resultado = await this.prisma.auditLog.groupBy({
      by: ["modulo"],
      where: { empresaId: ctx.empresaId },
      _count: true,
      orderBy: { modulo: "asc" },
    });
    return resultado.map((r) => ({ modulo: r.modulo, total: r._count }));
  }

  async detalle(id: string, ctx: RequestContext) {
    return this.prisma.auditLog.findFirst({
      where: { id, empresaId: ctx.empresaId },
      include: { usuario: { select: { nombre: true, apellido: true, email: true } } },
    });
  }
}
