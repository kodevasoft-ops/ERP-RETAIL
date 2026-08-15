import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";

interface ErrorResponse {
  statusCode: number;
  message: string;
  errorCode?: string;
  correlationId?: string;
  timestamp: string;
  path: string;
}

/**
 * Captura TODAS las excepciones. Nunca filtra stack traces, mensajes de
 * Prisma/SQL, ni detalles internos al cliente. Todo detalle real va al log
 * (correlacionado por request-id) para diagnóstico interno.
 */
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();
    const correlationId = (request.headers["x-correlation-id"] as string) ?? undefined;

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Ha ocurrido un error inesperado. Intenta nuevamente.";
    let errorCode: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      message =
        typeof body === "string"
          ? body
          : ((body as { message?: string }).message ?? exception.message);
      errorCode = (exception as HttpException & { errorCode?: string }).errorCode;
    }

    this.logger.error({
      msg: "Excepción no controlada",
      correlationId,
      path: request.url,
      method: request.method,
      status,
      exception: exception instanceof Error ? exception.stack : exception,
    });

    const body: ErrorResponse = {
      statusCode: status,
      message: status === HttpStatus.INTERNAL_SERVER_ERROR ? "Error interno del servidor" : message,
      errorCode,
      correlationId,
      timestamp: new Date().toISOString(),
      path: request.url,
    };

    response.status(status).send(body);
  }
}
