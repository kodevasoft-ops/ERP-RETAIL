import { Module } from "@nestjs/common";
import { CarteraController } from "./cartera.controller";
import { CarteraService } from "./cartera.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [CarteraController],
  providers: [CarteraService, AuditService],
  exports: [CarteraService],
})
export class CarteraModule {}
