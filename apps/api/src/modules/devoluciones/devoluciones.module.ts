import { Module } from "@nestjs/common";
import { DevolucionesController } from "./devoluciones.controller";
import { DevolucionesService } from "./devoluciones.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [DevolucionesController],
  providers: [DevolucionesService, AuditService],
  exports: [DevolucionesService],
})
export class DevolucionesModule {}
