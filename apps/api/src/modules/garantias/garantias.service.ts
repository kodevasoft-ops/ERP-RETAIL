import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { ActualizarEstadoGarantiaDto, CreateGarantiaDto } from "./dto/garantia.dto";
import { buildPaginatedResponse, PaginationQueryDto } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

@Injectable()
export class GarantiasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async crear(dto: CreateGarantiaDto, ctx: RequestContext) {
    const garantia = await this.prisma.garantia.create({
      data: {
        empresaId: ctx.empresaId,
        sucursalId: dto.sucursalId,
        ventaId: dto.ventaId,
        clienteId: dto.clienteId,
        varianteId: dto.varianteId,
        cantidad: dto.cantidad ?? 1,
        motivo: dto.motivo,
        fotos: dto.fotos ?? [],
        responsableId: ctx.usuarioId,
      },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "garantias",
      accion: "crear",
      entidadId: garantia.id,
      despues: garantia,
      resultado: "exito",
    });

    return garantia;
  }

  async listar(query: PaginationQueryDto & { estado?: string }, ctx: RequestContext) {
    const where: Prisma.GarantiaWhereInput = {
      empresaId: ctx.empresaId,
      ...(query.estado && { estado: query.estado as never }),
    };

    const [total, data] = await Promise.all([
      this.prisma.garantia.count({ where }),
      this.prisma.garantia.findMany({ where, orderBy: { createdAt: "desc" }, skip: query.skip, take: query.limit }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async obtenerPorId(id: string, ctx: RequestContext) {
    const garantia = await this.prisma.garantia.findFirst({ where: { id, empresaId: ctx.empresaId } });
    if (!garantia) throw new NotFoundException("Caso de garantía no encontrado.");
    return garantia;
  }

  // Transiciones válidas: protege contra saltos de estado inconsistentes
  // (ej. no se puede pasar de RECIBIDO directo a ENTREGADO).
  private readonly TRANSICIONES: Record<string, string[]> = {
    RECIBIDO: ["EN_REVISION", "RECHAZADO"],
    EN_REVISION: ["ENVIADO_PROVEEDOR", "APROBADO", "RECHAZADO"],
    ENVIADO_PROVEEDOR: ["APROBADO", "RECHAZADO"],
    APROBADO: ["ENTREGADO"],
    RECHAZADO: ["ENTREGADO"],
    ENTREGADO: [],
  };

  async actualizarEstado(id: string, dto: ActualizarEstadoGarantiaDto, ctx: RequestContext) {
    const actual = await this.prisma.garantia.findFirst({ where: { id, empresaId: ctx.empresaId } });
    if (!actual) throw new NotFoundException("Caso de garantía no encontrado.");
    if (actual.version !== dto.version) {
      throw new ConflictException("Este caso fue modificado por otro usuario. Recarga e intenta de nuevo.");
    }
    if (!this.TRANSICIONES[actual.estado].includes(dto.estado)) {
      throw new ConflictException(`No se puede pasar de "${actual.estado}" a "${dto.estado}" directamente.`);
    }

    const actualizada = await this.prisma.garantia.update({
      where: { id, version: actual.version },
      data: {
        estado: dto.estado,
        notas: dto.notas,
        version: { increment: 1 },
        ...(dto.estado === "ENTREGADO" && { entregadaAt: new Date() }),
      },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "garantias",
      accion: "cambiar-estado",
      entidadId: id,
      antes: { estado: actual.estado },
      despues: { estado: dto.estado },
      resultado: "exito",
    });

    return actualizada;
  }
}
