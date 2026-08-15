import { Module } from "@nestjs/common";
import { ClientesController } from "./clientes.controller";
import { ClientesService } from "./clientes.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [ClientesController],
  providers: [ClientesService, AuditService],
  exports: [ClientesService],
})
export class ClientesModule {}
