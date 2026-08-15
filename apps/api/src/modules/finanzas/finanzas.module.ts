import { Module } from "@nestjs/common";
import { FinanzasController } from "./finanzas.controller";
import { FinanzasService } from "./finanzas.service";
import { GastosModule } from "../gastos/gastos.module";
import { ReportesModule } from "../reportes/reportes.module";

@Module({
  imports: [GastosModule, ReportesModule],
  controllers: [FinanzasController],
  providers: [FinanzasService],
})
export class FinanzasModule {}
