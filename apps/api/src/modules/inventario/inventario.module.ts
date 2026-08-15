import { Module } from "@nestjs/common";
import { InventarioController } from "./inventario.controller";
import { InventarioService } from "./inventario.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [InventarioController],
  providers: [InventarioService, AuditService],
  exports: [InventarioService],
})
export class InventarioModule {}
