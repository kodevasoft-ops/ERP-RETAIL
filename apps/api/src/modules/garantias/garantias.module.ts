import { Module } from "@nestjs/common";
import { GarantiasController } from "./garantias.controller";
import { GarantiasService } from "./garantias.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [GarantiasController],
  providers: [GarantiasService, AuditService],
  exports: [GarantiasService],
})
export class GarantiasModule {}
