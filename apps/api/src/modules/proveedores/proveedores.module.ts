import { Module } from "@nestjs/common";
import { ProveedoresController } from "./proveedores.controller";
import { ProveedoresService } from "./proveedores.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [ProveedoresController],
  providers: [ProveedoresService, AuditService],
  exports: [ProveedoresService],
})
export class ProveedoresModule {}
