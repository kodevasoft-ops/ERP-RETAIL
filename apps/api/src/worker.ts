import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { Logger } from "nestjs-pino";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { LoggerModule } from "nestjs-pino";
import { validateEnv } from "./config/env.validation";
import { DatabaseModule } from "./database/database.module";
import { NotificacionesModule } from "./modules/notificaciones/notificaciones.module";
import { ExportWorkerModule } from "./modules/reportes/queue/export-worker.module";

/**
 * Proceso worker dedicado: solo carga lo necesario para procesar colas
 * BullMQ (generación de reportes pesados). Nunca abre puerto HTTP, así
 * que su CPU jamás compite con las requests de venta/checkout que
 * atienden las réplicas del API.
 *
 * Se despliega como servicio separado (ver docker-compose.prod.yml,
 * servicio "worker"), escalable de forma independiente al API — si los
 * reportes pesan más, se agregan réplicas de worker sin tocar el API.
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    LoggerModule.forRoot({ pinoHttp: { level: "info" } }),
    DatabaseModule,
    NotificacionesModule,
    ExportWorkerModule,
  ],
})
class WorkerModule {}

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(WorkerModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));
  app.enableShutdownHooks();
  // El proceso queda vivo procesando jobs de la cola "exportes" — no hace falta listen().
}

bootstrap();
