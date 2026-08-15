import { Module } from "@nestjs/common";
import { ComprasController } from "./compras.controller";
import { ComprasService } from "./compras.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [ComprasController],
  providers: [ComprasService, AuditService],
  exports: [ComprasService],
})
export class ComprasModule {}
