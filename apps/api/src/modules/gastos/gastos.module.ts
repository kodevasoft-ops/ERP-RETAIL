import { Module } from "@nestjs/common";
import { GastosController } from "./gastos.controller";
import { GastosService } from "./gastos.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [GastosController],
  providers: [GastosService, AuditService],
  exports: [GastosService],
})
export class GastosModule {}
