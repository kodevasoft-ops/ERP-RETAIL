import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { DevolucionesService } from "./devoluciones.service";
import { CreateDevolucionDto, RechazarDevolucionDto } from "./dto/devolucion.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Idempotent } from "../../common/decorators/idempotent.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "devoluciones", version: "1" })
export class DevolucionesController {
  constructor(private readonly service: DevolucionesService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId, usuarioId: user.id };
  }

  @RequirePermissions({ modulo: "devoluciones", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateDevolucionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crear(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "devoluciones", accion: "ver" })
  @Get()
  listar(@Query() query: PaginationQueryDto & { estado?: string }, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listar(query, this.ctx(user));
  }

  @RequirePermissions({ modulo: "devoluciones", accion: "ver" })
  @Get(":id")
  obtener(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.obtenerPorId(id, this.ctx(user));
  }

  @RequirePermissions({ modulo: "devoluciones", accion: "aprobar" })
  @Idempotent()
  @Post(":id/procesar")
  procesar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.procesar(id, this.ctx(user));
  }

  @RequirePermissions({ modulo: "devoluciones", accion: "anular" })
  @Post(":id/rechazar")
  rechazar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: RechazarDevolucionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.rechazar(id, dto, this.ctx(user));
  }
}
