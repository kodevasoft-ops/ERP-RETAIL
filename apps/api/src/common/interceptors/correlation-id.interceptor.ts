import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { Observable } from "rxjs";
import { randomUUID } from "node:crypto";

@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<FastifyRequest>();
    const res = context.switchToHttp().getResponse<FastifyReply>();

    const correlationId = (req.headers["x-correlation-id"] as string) || randomUUID();
    req.headers["x-correlation-id"] = correlationId;
    res.header("x-correlation-id", correlationId);

    return next.handle();
  }
}
