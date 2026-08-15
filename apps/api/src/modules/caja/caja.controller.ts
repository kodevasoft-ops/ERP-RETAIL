import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { CajaService } from "./caja.service";
import { AbrirCajaDto, CerrarCajaDto, MovimientoCajaDto } from "./dto/caja.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Idempotent } from "../../common/decorators/idempotent.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "caja", version: "1" })
export class CajaController {
  constructor(private readonly service: CajaService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId, usuarioId: user.id };
  }

  @RequirePermissions({ modulo: "caja", accion: "crear" })
  @Idempotent()
  @Post("abrir")
  abrir(@Body() dto: AbrirCajaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.abrir(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "caja", accion: "ver" })
  @Get("activa")
  sesionActiva(@Query("cajaId", ParseUUIDPipe) cajaId: string) {
    return this.service.sesionActiva(cajaId);
  }

  @RequirePermissions({ modulo: "caja", accion: "ver" })
  @Get(":id/resumen")
  resumen(@Param("id", ParseUUIDPipe) id: string) {
    return this.service.resumen(id);
  }

  @RequirePermissions({ modulo: "caja", accion: "crear" })
  @Post(":id/movimientos")
  movimiento(@Param("id", ParseUUIDPipe) id: string, @Body() dto: MovimientoCajaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.registrarMovimiento(id, dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "caja", accion: "aprobar" })
  @Idempotent()
  @Post(":id/cerrar")
  cerrar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CerrarCajaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.cerrar(id, dto, this.ctx(user));
  }
}
