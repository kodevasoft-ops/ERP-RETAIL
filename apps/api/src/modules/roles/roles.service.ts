import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { CreateRolDto, UpdateRolDto } from "./dto/rol.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

const ROL_INCLUDE = {
  permisos: { include: { permiso: true } },
  _count: { select: { usuarios: true } },
} as const;

@Injectable()
export class RolesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Todos los permisos del catálogo, agrupados por módulo — insumo para la matriz del frontend. */
  async permisosDisponibles() {
    const permisos = await this.prisma.permiso.findMany({ orderBy: [{ modulo: "asc" }, { accion: "asc" }] });
    const agrupados: Record<string, typeof permisos> = {};
    for (const p of permisos) {
      agrupados[p.modulo] ??= [];
      agrupados[p.modulo].push(p);
    }
    return agrupados;
  }

  private async resolverPermisoIds(modulosAcciones: { modulo: string; accion: string }[]) {
    const permisos = await this.prisma.permiso.findMany({
      where: { OR: modulosAcciones.map((p) => ({ modulo: p.modulo, accion: p.accion as never })) },
    });
    if (permisos.length !== modulosAcciones.length) {
      throw new NotFoundException("Uno o más permisos indicados no existen en el catálogo.");
    }
    return permisos.map((p) => p.id);
  }

  async crear(dto: CreateRolDto, ctx: RequestContext) {
    const existente = await this.prisma.rol.findFirst({
      where: { empresaId: ctx.empresaId, nombre: dto.nombre, deletedAt: null },
    });
    if (existente) throw new ConflictException("Ya existe un rol con ese nombre.");

    const permisoIds = await this.resolverPermisoIds(dto.permisos);

    const rol = await this.prisma.rol.create({
      data: {
        empresaId: ctx.empresaId,
        nombre: dto.nombre,
        descripcion: dto.descripcion,
        permisos: { createMany: { data: permisoIds.map((permisoId) => ({ permisoId })) } },
      },
      include: ROL_INCLUDE,
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "roles",
      accion: "crear",
      entidadId: rol.id,
      despues: rol,
      resultado: "exito",
    });

    return rol;
  }

  async listar(ctx: RequestContext) {
    return this.prisma.rol.findMany({
      where: { empresaId: ctx.empresaId, deletedAt: null },
      orderBy: { nombre: "asc" },
      include: ROL_INCLUDE,
    });
  }

  async obtenerPorId(id: string, ctx: RequestContext) {
    const rol = await this.prisma.rol.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
      include: ROL_INCLUDE,
    });
    if (!rol) throw new NotFoundException("Rol no encontrado.");
    return rol;
  }

  async actualizar(id: string, dto: UpdateRolDto, ctx: RequestContext) {
    const actual = await this.prisma.rol.findFirst({ where: { id, empresaId: ctx.empresaId, deletedAt: null } });
    if (!actual) throw new NotFoundException("Rol no encontrado.");
    if (actual.esSistema) throw new ForbiddenException("El rol Administrador del sistema no se puede editar.");
    if (actual.version !== dto.version) {
      throw new ConflictException("Este rol fue modificado por otro usuario. Recarga e intenta de nuevo.");
    }

    const permisoIds = await this.resolverPermisoIds(dto.permisos);

    const actualizado = await this.prisma.$transaction(async (tx) => {
      await tx.rolPermiso.deleteMany({ where: { rolId: id } });
      await tx.rolPermiso.createMany({ data: permisoIds.map((permisoId) => ({ rolId: id, permisoId })) });

      return tx.rol.update({
        where: { id, version: actual.version },
        data: { nombre: dto.nombre, descripcion: dto.descripcion, version: { increment: 1 } },
        include: ROL_INCLUDE,
      });
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "roles",
      accion: "editar",
      entidadId: id,
      antes: actual,
      despues: actualizado,
      resultado: "exito",
    });

    return actualizado;
  }

  async eliminar(id: string, ctx: RequestContext) {
    const rol = await this.prisma.rol.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
      include: { _count: { select: { usuarios: true } } },
    });
    if (!rol) throw new NotFoundException("Rol no encontrado.");
    if (rol.esSistema) throw new ForbiddenException("El rol Administrador del sistema no se puede eliminar.");
    if (rol._count.usuarios > 0) {
      throw new ConflictException("No se puede eliminar un rol con usuarios asignados. Reasígnalos primero.");
    }

    await this.prisma.rol.update({ where: { id }, data: { deletedAt: new Date() } });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "roles",
      accion: "eliminar",
      entidadId: id,
      resultado: "exito",
    });

    return { success: true };
  }
}
