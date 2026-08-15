import { Module } from "@nestjs/common";
import { EnviosController } from "./envios.controller";
import { EnviosService } from "./envios.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [EnviosController],
  providers: [EnviosService, AuditService],
  exports: [EnviosService],
})
export class EnviosModule {}
