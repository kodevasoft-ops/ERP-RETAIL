import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { ActualizarEnvioDto, CreateEnvioDto } from "./dto/envio.dto";
import { PaginationQueryDto, buildPaginatedResponse } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

const TRANSICIONES: Record<string, string[]> = {
  PENDIENTE: ["DESPACHADO"],
  DESPACHADO: ["EN_TRANSITO", "DEVUELTO"],
  EN_TRANSITO: ["ENTREGADO", "DEVUELTO"],
  ENTREGADO: [],
  DEVUELTO: [],
};

@Injectable()
export class EnviosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async crear(dto: CreateEnvioDto, ctx: RequestContext) {
    const venta = await this.prisma.venta.findFirst({ where: { id: dto.ventaId, empresaId: ctx.empresaId } });
    if (!venta) throw new NotFoundException("Venta no encontrada.");

    const existente = await this.prisma.envio.findUnique({ where: { ventaId: dto.ventaId } });
    if (existente) throw new ConflictException("Esta venta ya tiene un envío registrado.");

    const envio = await this.prisma.envio.create({
      data: { empresaId: ctx.empresaId, ...dto },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "envios",
      accion: "crear",
      entidadId: envio.id,
      despues: envio,
      resultado: "exito",
    });

    return envio;
  }

  async listar(query: PaginationQueryDto & { estado?: string }, ctx: RequestContext) {
    const where = {
      empresaId: ctx.empresaId,
      ...(query.estado && { estado: query.estado as never }),
    };
    const [total, data] = await Promise.all([
      this.prisma.envio.count({ where }),
      this.prisma.envio.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.limit,
        include: { transportadora: true },
      }),
    ]);
    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async actualizar(id: string, dto: ActualizarEnvioDto, ctx: RequestContext) {
    const actual = await this.prisma.envio.findFirst({ where: { id, empresaId: ctx.empresaId } });
    if (!actual) throw new NotFoundException("Envío no encontrado.");
    if (actual.version !== dto.version) throw new ConflictException("Este envío fue modificado por otro usuario.");

    if (dto.estado && dto.estado !== actual.estado && !TRANSICIONES[actual.estado].includes(dto.estado)) {
      throw new ConflictException(`No se puede pasar de "${actual.estado}" a "${dto.estado}" directamente.`);
    }

    const { version, ...cambios } = dto;
    const actualizado = await this.prisma.envio.update({
      where: { id, version: actual.version },
      data: {
        ...cambios,
        version: { increment: 1 },
        ...(dto.estado === "DESPACHADO" && { despachadoAt: new Date() }),
        ...(dto.estado === "ENTREGADO" && { entregadoAt: new Date() }),
      },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "envios",
      accion: "editar",
      entidadId: id,
      antes: actual,
      despues: actualizado,
      resultado: "exito",
    });

    return actualizado;
  }

  /** Resuelve la URL de rastreo real de la transportadora con el número de guía. */
  async urlRastreo(id: string, ctx: RequestContext): Promise<string | null> {
    const envio = await this.prisma.envio.findFirst({
      where: { id, empresaId: ctx.empresaId },
      include: { transportadora: true },
    });
    if (!envio?.transportadora?.urlRastreo || !envio.numeroGuia) return null;
    return envio.transportadora.urlRastreo.replace("{guia}", envio.numeroGuia);
  }
}
