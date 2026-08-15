import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { CotizacionesService } from "./cotizaciones.service";
import { CreateCotizacionDto } from "./dto/cotizacion.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "cotizaciones", version: "1" })
export class CotizacionesController {
  constructor(private readonly service: CotizacionesService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId, usuarioId: user.id };
  }

  @RequirePermissions({ modulo: "cotizaciones", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateCotizacionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crear(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "cotizaciones", accion: "ver" })
  @Get()
  listar(@Query() query: PaginationQueryDto & { estado?: string }, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listar(query, this.ctx(user));
  }

  @RequirePermissions({ modulo: "cotizaciones", accion: "ver" })
  @Get(":id")
  obtener(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.obtenerPorId(id, this.ctx(user));
  }

  @RequirePermissions({ modulo: "cotizaciones", accion: "editar" })
  @Post(":id/enviar")
  enviar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.cambiarEstado(id, "ENVIADA", this.ctx(user));
  }

  @RequirePermissions({ modulo: "cotizaciones", accion: "aprobar" })
  @Post(":id/aceptar")
  aceptar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.cambiarEstado(id, "ACEPTADA", this.ctx(user));
  }

  @RequirePermissions({ modulo: "cotizaciones", accion: "anular" })
  @Post(":id/rechazar")
  rechazar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.cambiarEstado(id, "RECHAZADA", this.ctx(user));
  }
}
