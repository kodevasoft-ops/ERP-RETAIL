import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { GarantiasService } from "./garantias.service";
import { ActualizarEstadoGarantiaDto, CreateGarantiaDto } from "./dto/garantia.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Idempotent } from "../../common/decorators/idempotent.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "garantias", version: "1" })
export class GarantiasController {
  constructor(private readonly service: GarantiasService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId, usuarioId: user.id };
  }

  @RequirePermissions({ modulo: "garantias", accion: "crear" })
  @Idempotent()
  @Post()
  crear(@Body() dto: CreateGarantiaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crear(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "garantias", accion: "ver" })
  @Get()
  listar(@Query() query: PaginationQueryDto & { estado?: string }, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listar(query, this.ctx(user));
  }

  @RequirePermissions({ modulo: "garantias", accion: "ver" })
  @Get(":id")
  obtener(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.obtenerPorId(id, this.ctx(user));
  }

  @RequirePermissions({ modulo: "garantias", accion: "editar" })
  @Patch(":id/estado")
  actualizarEstado(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ActualizarEstadoGarantiaDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.actualizarEstado(id, dto, this.ctx(user));
  }
}
