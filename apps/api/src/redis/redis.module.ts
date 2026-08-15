import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Redis from "ioredis";

export const REDIS_CLIENT = "REDIS_CLIENT";

/**
 * Cliente Redis único para toda la app. Se reutiliza en:
 *  - Rate limiting distribuido (ThrottlerModule con storage Redis)
 *  - Cache de endpoints de lectura pesada (dashboard, reportes)
 *  - Colas BullMQ (exportación de reportes, notificaciones)
 *
 * Con esto, escalar horizontalmente a N réplicas del API es seguro:
 * el estado compartido (límites de rate, cache, colas) vive en Redis,
 * no en la memoria de cada proceso.
 */
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        new Redis({
          host: config.get<string>("REDIS_HOST"),
          port: config.get<number>("REDIS_PORT"),
          password: config.get<string>("REDIS_PASSWORD") || undefined,
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => Math.min(times * 200, 2000), // backoff exponencial acotado
          enableReadyCheck: true,
        }),
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
