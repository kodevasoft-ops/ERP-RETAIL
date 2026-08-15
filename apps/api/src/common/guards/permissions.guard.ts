import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest } from "fastify";
import { PERMISSIONS_KEY, RequiredPermission } from "../decorators/permissions.decorator";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";

/**
 * Se ejecuta DESPUÉS de JwtAuthGuard (request.user ya poblado).
 * Principio de mínimo privilegio: si el endpoint no declara @RequirePermissions,
 * se deniega por defecto (fail-closed), salvo que esté marcado como @Public().
 */
@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<RequiredPermission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!required || required.length === 0) {
      return true; // endpoint sin permisos declarados; protegido solo por autenticación
    }

    const request = context.switchToHttp().getRequest<FastifyRequest & { user: AuthenticatedUser }>();
    const userPermisos = new Set(request.user?.permisos ?? []);

    const tieneTodos = required.every((p) => userPermisos.has(`${p.modulo}:${p.accion}`));

    if (!tieneTodos) {
      throw new ForbiddenException("No tienes permisos suficientes para esta acción.");
    }

    return true;
  }
}
