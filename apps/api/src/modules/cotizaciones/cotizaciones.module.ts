import { Module } from "@nestjs/common";
import { CotizacionesController } from "./cotizaciones.controller";
import { CotizacionesService } from "./cotizaciones.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [CotizacionesController],
  providers: [CotizacionesService, AuditService],
  exports: [CotizacionesService],
})
export class CotizacionesModule {}
