import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { EnviosService } from "./envios.service";
import { ActualizarEnvioDto, CreateEnvioDto } from "./dto/envio.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "envios", version: "1" })
export class EnviosController {
  constructor(private readonly service: EnviosService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId, usuarioId: user.id };
  }

  @RequirePermissions({ modulo: "envios", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateEnvioDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crear(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "envios", accion: "ver" })
  @Get()
  listar(@Query() query: PaginationQueryDto & { estado?: string }, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listar(query, this.ctx(user));
  }

  @RequirePermissions({ modulo: "envios", accion: "editar" })
  @Patch(":id")
  actualizar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: ActualizarEnvioDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.actualizar(id, dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "envios", accion: "ver" })
  @Get(":id/rastreo")
  async rastreo(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    const url = await this.service.urlRastreo(id, this.ctx(user));
    return { url };
  }
}
