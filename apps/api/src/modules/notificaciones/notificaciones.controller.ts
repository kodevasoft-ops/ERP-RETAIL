import { Controller, Get, Param, ParseUUIDPipe, Patch, Query } from "@nestjs/common";
import { NotificacionesService } from "./notificaciones.service";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "notificaciones", version: "1" })
export class NotificacionesController {
  constructor(private readonly service: NotificacionesService) {}

  @Get()
  listar(@Query("soloNoLeidas") soloNoLeidas: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listar(user.empresaId, user.id, soloNoLeidas === "true");
  }

  @Get("no-leidas/count")
  contarNoLeidas(@CurrentUser() user: AuthenticatedUser) {
    return this.service.contarNoLeidas(user.empresaId, user.id);
  }

  @Patch(":id/leida")
  marcarLeida(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.marcarLeida(id, user.empresaId);
  }

  @Patch("leer-todas")
  marcarTodasLeidas(@CurrentUser() user: AuthenticatedUser) {
    return this.service.marcarTodasLeidas(user.empresaId, user.id);
  }
}
