import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ReportesService } from "../reportes.service";
import { ExcelExportService } from "../export/excel-export.service";
import { PdfExportService } from "../export/pdf-export.service";
import { ExportProcessor } from "./export.processor";

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
  providers: [ReportesService, ExcelExportService, PdfExportService, ExportProcessor],
})
export class ExportWorkerModule {}
