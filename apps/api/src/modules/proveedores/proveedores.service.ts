import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { CreateProveedorDto, UpdateProveedorDto } from "./dto/proveedor.dto";
import { buildPaginatedResponse, PaginationQueryDto } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

@Injectable()
export class ProveedoresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async crear(dto: CreateProveedorDto, ctx: RequestContext) {
    const existente = await this.prisma.proveedor.findFirst({
      where: { empresaId: ctx.empresaId, nit: dto.nit, deletedAt: null },
    });
    if (existente) throw new ConflictException("Ya existe un proveedor con ese NIT.");

    const proveedor = await this.prisma.proveedor.create({
      data: { empresaId: ctx.empresaId, ...dto },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "proveedores",
      accion: "crear",
      entidadId: proveedor.id,
      despues: proveedor,
      resultado: "exito",
    });

    return proveedor;
  }

  async listar(query: PaginationQueryDto, ctx: RequestContext) {
    const where: Prisma.ProveedorWhereInput = {
      empresaId: ctx.empresaId,
      deletedAt: null,
      ...(query.search && {
        OR: [
          { nombre: { contains: query.search, mode: "insensitive" } },
          { nit: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.proveedor.count({ where }),
      this.prisma.proveedor.findMany({ where, orderBy: { nombre: "asc" }, skip: query.skip, take: query.limit }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async obtenerPorId(id: string, ctx: RequestContext) {
    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!proveedor) throw new NotFoundException("Proveedor no encontrado.");
    return proveedor;
  }

  async actualizar(id: string, dto: UpdateProveedorDto, ctx: RequestContext) {
    const actual = await this.prisma.proveedor.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!actual) throw new NotFoundException("Proveedor no encontrado.");
    if (actual.version !== dto.version) {
      throw new ConflictException("Este proveedor fue modificado por otro usuario.");
    }

    const { version, ...cambios } = dto;
    const actualizado = await this.prisma.proveedor.update({
      where: { id, version: actual.version },
      data: { ...cambios, version: { increment: 1 } },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "proveedores",
      accion: "editar",
      entidadId: id,
      antes: actual,
      despues: actualizado,
      resultado: "exito",
    });

    return actualizado;
  }

  async eliminar(id: string, ctx: RequestContext) {
    const actual = await this.prisma.proveedor.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!actual) throw new NotFoundException("Proveedor no encontrado.");

    await this.prisma.proveedor.update({ where: { id }, data: { deletedAt: new Date(), activo: false } });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "proveedores",
      accion: "eliminar",
      entidadId: id,
      antes: actual,
      resultado: "exito",
    });

    return { success: true };
  }
}
