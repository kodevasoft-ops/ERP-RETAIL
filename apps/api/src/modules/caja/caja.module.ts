import { Module } from "@nestjs/common";
import { CajaController } from "./caja.controller";
import { CajaService } from "./caja.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [CajaController],
  providers: [CajaService, AuditService],
  exports: [CajaService],
})
export class CajaModule {}
