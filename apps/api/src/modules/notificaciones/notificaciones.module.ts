import { Global, Module } from "@nestjs/common";
import { NotificacionesController } from "./notificaciones.controller";
import { NotificacionesService } from "./notificaciones.service";

// Global: cualquier módulo puede inyectar NotificacionesService sin
// declarar el import explícito — reduce fricción para disparar alertas
// desde puntos de negocio dispersos (stock bajo, nuevo lead, etc.)
@Global()
@Module({
  controllers: [NotificacionesController],
  providers: [NotificacionesService],
  exports: [NotificacionesService],
})
export class NotificacionesModule {}
