import { Module } from "@nestjs/common";
import { ProductosController } from "./productos.controller";
import { ProductosService } from "./productos.service";
import { ImportacionProductosController } from "./importacion/importacion-productos.controller";
import { ImportacionProductosService } from "./importacion/importacion-productos.service";
import { PlantillaImportacionService } from "./importacion/plantilla-importacion.service";
import { AuditService } from "../../common/services/audit.service";

@Module({
  controllers: [ProductosController, ImportacionProductosController],
  providers: [ProductosService, ImportacionProductosService, PlantillaImportacionService, AuditService],
  exports: [ProductosService],
})
export class ProductosModule {}
