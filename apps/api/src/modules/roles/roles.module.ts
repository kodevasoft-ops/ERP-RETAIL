import { Module } from "@nestjs/common";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [RolesController],
  providers: [RolesService, AuditService],
  exports: [RolesService],
})
export class RolesModule {}
