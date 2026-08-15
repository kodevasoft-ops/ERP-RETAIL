import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

export interface AuthenticatedUser {
  id: string;
  empresaId: string;
  sucursalId: string | null;
  email: string;
  permisos: string[]; // formato "modulo:accion"
}

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<FastifyRequest & { user: AuthenticatedUser }>();
    return data ? request.user?.[data] : request.user;
  },
);
