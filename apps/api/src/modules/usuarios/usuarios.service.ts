import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { AuthService } from "../auth/auth.service";
import { CreateUsuarioDto, ResetPasswordDto, UpdateUsuarioDto } from "./dto/usuario.dto";
import { buildPaginatedResponse, PaginationQueryDto } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

const USUARIO_INCLUDE = {
  roles: { include: { rol: { select: { id: true, nombre: true } } } },
} satisfies Prisma.UsuarioInclude;

@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly authService: AuthService,
  ) {}

  async crear(dto: CreateUsuarioDto, ctx: RequestContext) {
    const existente = await this.prisma.usuario.findFirst({
      where: { empresaId: ctx.empresaId, email: dto.email, deletedAt: null },
    });
    if (existente) throw new ConflictException("Ya existe un usuario con ese correo.");

    const roles = await this.prisma.rol.findMany({
      where: { id: { in: dto.rolIds }, empresaId: ctx.empresaId },
    });
    if (roles.length !== dto.rolIds.length) {
      throw new NotFoundException("Uno o más roles indicados no existen en esta empresa.");
    }

    const passwordHash = await this.authService.hashPassword(dto.password);

    const usuario = await this.prisma.usuario.create({
      data: {
        empresaId: ctx.empresaId,
        email: dto.email,
        passwordHash,
        nombre: dto.nombre,
        apellido: dto.apellido,
        sucursalId: dto.sucursalId,
        roles: { createMany: { data: dto.rolIds.map((rolId) => ({ rolId })) } },
      },
      include: USUARIO_INCLUDE,
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "usuarios",
      accion: "crear",
      entidadId: usuario.id,
      despues: { ...usuario, passwordHash: "[omitido]" },
      resultado: "exito",
    });

    return usuario;
  }

  async listar(query: PaginationQueryDto, ctx: RequestContext) {
    const where: Prisma.UsuarioWhereInput = {
      empresaId: ctx.empresaId,
      deletedAt: null,
      ...(query.search && {
        OR: [
          { nombre: { contains: query.search, mode: "insensitive" } },
          { apellido: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.usuario.count({ where }),
      this.prisma.usuario.findMany({
        where,
        orderBy: { nombre: "asc" },
        skip: query.skip,
        take: query.limit,
        include: USUARIO_INCLUDE,
        omit: { passwordHash: true, mfaSecret: true },
      }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async actualizar(id: string, dto: UpdateUsuarioDto, ctx: RequestContext) {
    const actual = await this.prisma.usuario.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!actual) throw new NotFoundException("Usuario no encontrado.");
    if (actual.version !== dto.version) {
      throw new ConflictException("Este usuario fue modificado por otro usuario. Recarga e intenta de nuevo.");
    }

    const { version, rolIds, ...cambios } = dto;

    const actualizado = await this.prisma.$transaction(async (tx) => {
      if (rolIds) {
        const roles = await tx.rol.findMany({ where: { id: { in: rolIds }, empresaId: ctx.empresaId } });
        if (roles.length !== rolIds.length) {
          throw new NotFoundException("Uno o más roles indicados no existen en esta empresa.");
        }
        // Reemplazo transaccional del set de roles (evita estados intermedios inconsistentes).
        await tx.usuarioRol.deleteMany({ where: { usuarioId: id } });
        await tx.usuarioRol.createMany({ data: rolIds.map((rolId) => ({ usuarioId: id, rolId })) });
      }

      return tx.usuario.update({
        where: { id, version: actual.version },
        data: { ...cambios, version: { increment: 1 } },
        include: USUARIO_INCLUDE,
        omit: { passwordHash: true, mfaSecret: true },
      });
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "usuarios",
      accion: "editar",
      entidadId: id,
      antes: { ...actual, passwordHash: "[omitido]" },
      despues: actualizado,
      resultado: "exito",
    });

    return actualizado;
  }

  async desactivar(id: string, ctx: RequestContext) {
    const actual = await this.prisma.usuario.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!actual) throw new NotFoundException("Usuario no encontrado.");
    if (actual.id === ctx.usuarioId) {
      throw new ConflictException("No puedes desactivar tu propio usuario.");
    }

    await this.prisma.usuario.update({ where: { id }, data: { activo: false } });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "usuarios",
      accion: "desactivar",
      entidadId: id,
      resultado: "exito",
    });

    return { success: true };
  }

  async resetPassword(id: string, dto: ResetPasswordDto, ctx: RequestContext) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!usuario) throw new NotFoundException("Usuario no encontrado.");

    const passwordHash = await this.authService.hashPassword(dto.nuevaPassword);

    // Cambiar contraseña implica revocar todas las sesiones activas del usuario.
    await this.prisma.$transaction([
      this.prisma.usuario.update({ where: { id }, data: { passwordHash, intentosFallidos: 0, bloqueadoHasta: null } }),
      this.prisma.refreshToken.updateMany({ where: { usuarioId: id }, data: { revocado: true } }),
      this.prisma.sesion.updateMany({ where: { usuarioId: id }, data: { activa: false, revocadaAt: new Date() } }),
    ]);

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "usuarios",
      accion: "reset-password",
      entidadId: id,
      resultado: "exito",
    });

    return { success: true };
  }
}
