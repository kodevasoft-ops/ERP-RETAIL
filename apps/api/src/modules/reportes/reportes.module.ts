import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ReportesController } from "./reportes.controller";
import { ReportesService } from "./reportes.service";
import { ExcelExportService } from "./export/excel-export.service";
import { PdfExportService } from "./export/pdf-export.service";
import { ExportQueueService } from "./queue/export-queue.service";

// Usado por el proceso API: SOLO encola jobs (ExportQueueService).
// El procesamiento real (ExportProcessor) vive exclusivamente en el
// proceso worker (ver worker.module.ts) para que nunca compita por CPU
// con las requests HTTP de venta/checkout.
@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>("REDIS_HOST"),
          port: config.get<number>("REDIS_PORT"),
          password: config.get<string>("REDIS_PASSWORD") || undefined,
        },
      }),
    }),
    BullModule.registerQueue({ name: "exportes" }),
  ],
  controllers: [ReportesController],
  providers: [ReportesService, ExcelExportService, PdfExportService, ExportQueueService],
  exports: [ExcelExportService, PdfExportService],
})
export class ReportesModule {}
