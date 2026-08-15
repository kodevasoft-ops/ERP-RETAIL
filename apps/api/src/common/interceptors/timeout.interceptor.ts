import { CallHandler, ExecutionContext, Injectable, NestInterceptor, RequestTimeoutException } from "@nestjs/common";
import { Observable, TimeoutError, throwError } from "rxjs";
import { catchError, timeout } from "rxjs/operators";

/**
 * Ningún request debe quedar "colgado" indefinidamente. Bajo carga alta,
 * conexiones lentas (DB saturada, dependencia externa caída) deben liberarse
 * en vez de acumularse y agotar el pool de conexiones o el event loop.
 * Los endpoints de exportación (reportes pesados) usan su propia cola
 * BullMQ precisamente para no chocar con este límite.
 */
const TIMEOUT_MS = 15_000;

@Injectable()
export class TimeoutInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      timeout(TIMEOUT_MS),
      catchError((err) => {
        if (err instanceof TimeoutError) {
          return throwError(() => new RequestTimeoutException("La solicitud tardó demasiado. Intenta nuevamente."));
        }
        return throwError(() => err);
      }),
    );
  }
}
