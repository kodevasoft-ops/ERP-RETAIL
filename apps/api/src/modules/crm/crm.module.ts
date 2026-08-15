import { Module } from "@nestjs/common";
import { CrmController } from "./crm.controller";
import { CrmService } from "./crm.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [CrmController],
  providers: [CrmService, AuditService],
  exports: [CrmService],
})
export class CrmModule {}
