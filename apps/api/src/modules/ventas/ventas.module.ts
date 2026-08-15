import { Module } from "@nestjs/common";
import { VentasController } from "./ventas.controller";
import { VentasService } from "./ventas.service";
import { FacturaPdfService } from "./pdf/factura-pdf.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [VentasController],
  providers: [VentasService, AuditService, FacturaPdfService],
  exports: [VentasService],
})
export class VentasModule {}
