import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { UsuariosService } from "./usuarios.service";
import { CreateUsuarioDto, ResetPasswordDto, UpdateUsuarioDto } from "./dto/usuario.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "usuarios", version: "1" })
export class UsuariosController {
  constructor(private readonly service: UsuariosService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId, usuarioId: user.id };
  }

  @RequirePermissions({ modulo: "usuarios", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateUsuarioDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crear(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "usuarios", accion: "ver" })
  @Get()
  listar(@Query() query: PaginationQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listar(query, this.ctx(user));
  }

  @RequirePermissions({ modulo: "usuarios", accion: "editar" })
  @Patch(":id")
  actualizar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateUsuarioDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.actualizar(id, dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "usuarios", accion: "eliminar" })
  @Delete(":id")
  desactivar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.desactivar(id, this.ctx(user));
  }

  @RequirePermissions({ modulo: "usuarios", accion: "aprobar" })
  @Post(":id/reset-password")
  resetPassword(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: ResetPasswordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.resetPassword(id, dto, this.ctx(user));
  }
}
