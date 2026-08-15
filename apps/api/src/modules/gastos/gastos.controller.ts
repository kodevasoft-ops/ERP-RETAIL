import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { GastosService } from "./gastos.service";
import { CreateGastoDto, UpdateGastoDto } from "./dto/gasto.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "gastos", version: "1" })
export class GastosController {
  constructor(private readonly service: GastosService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId, usuarioId: user.id };
  }

  @RequirePermissions({ modulo: "gastos", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateGastoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crear(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "gastos", accion: "ver" })
  @Get()
  listar(
    @Query() query: PaginationQueryDto & { categoria?: string; desde?: string; hasta?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.listar(query, this.ctx(user));
  }

  @RequirePermissions({ modulo: "gastos", accion: "editar" })
  @Patch(":id")
  actualizar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateGastoDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.actualizar(id, dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "gastos", accion: "eliminar" })
  @Delete(":id")
  eliminar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.eliminar(id, this.ctx(user));
  }
}
