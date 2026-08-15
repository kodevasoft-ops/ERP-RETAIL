import { CallHandler, ConflictException, ExecutionContext, Injectable, NestInterceptor, Inject } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { FastifyRequest, FastifyReply } from "fastify";
import type Redis from "ioredis";
import { Observable, from, of } from "rxjs";
import { switchMap, tap } from "rxjs/operators";
import { IDEMPOTENT_KEY } from "../decorators/idempotent.decorator";
import { REDIS_CLIENT } from "../../redis/redis.module";
import type { AuthenticatedUser } from "../decorators/current-user.decorator";

const TTL_SEGUNDOS = 24 * 60 * 60; // una clave de idempotencia protege por 24h
const LOCK_TTL_MS = 30_000; // evita que dos requests simultáneas con la misma key se ejecuten a la vez

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(
    private readonly reflector: Reflector,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const esIdempotente = this.reflector.get<boolean>(IDEMPOTENT_KEY, context.getHandler());
    if (!esIdempotente) return next.handle();

    const req = context.switchToHttp().getRequest<FastifyRequest & { user?: AuthenticatedUser }>();
    const idempotencyKey = req.headers["idempotency-key"] as string | undefined;
    if (!idempotencyKey) return next.handle(); // el header es opcional; sin él, no hay protección extra

    const empresaId = req.user?.empresaId ?? "anon";
    const redisKey = `idempotencia:${empresaId}:${req.routeOptions?.url ?? req.url}:${idempotencyKey}`;
    const lockKey = `${redisKey}:lock`;

    return from(this.redis.get(redisKey)).pipe(
      switchMap((cached) => {
        if (cached) {
          // Ya se procesó antes: devuelve la respuesta original, no reejecuta la acción.
          const { status, body } = JSON.parse(cached);
          const res = context.switchToHttp().getResponse<FastifyReply>();
          res.status(status);
          return of(body);
        }

        return from(this.redis.set(lockKey, "1", "PX", LOCK_TTL_MS, "NX")).pipe(
          switchMap((lockAdquirido) => {
            if (!lockAdquirido) {
              throw new ConflictException(
                "Esta operación ya se está procesando. Espera unos segundos antes de reintentar.",
              );
            }

            return next.handle().pipe(
              tap((body) => {
                const res = context.switchToHttp().getResponse<FastifyReply>();
                void this.redis.set(
                  redisKey,
                  JSON.stringify({ status: res.statusCode, body }),
                  "EX",
                  TTL_SEGUNDOS,
                );
                void this.redis.del(lockKey);
              }),
            );
          }),
        );
      }),
    );
  }
}
