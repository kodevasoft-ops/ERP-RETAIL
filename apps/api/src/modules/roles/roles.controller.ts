import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { RolesService } from "./roles.service";
import { CreateRolDto, UpdateRolDto } from "./dto/rol.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "roles", version: "1" })
export class RolesController {
  constructor(private readonly service: RolesService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId, usuarioId: user.id };
  }

  @RequirePermissions({ modulo: "roles", accion: "ver" })
  @Get("permisos-disponibles")
  permisosDisponibles() {
    return this.service.permisosDisponibles();
  }

  @RequirePermissions({ modulo: "roles", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateRolDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crear(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "roles", accion: "ver" })
  @Get()
  listar(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listar(this.ctx(user));
  }

  @RequirePermissions({ modulo: "roles", accion: "ver" })
  @Get(":id")
  obtener(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.obtenerPorId(id, this.ctx(user));
  }

  @RequirePermissions({ modulo: "roles", accion: "editar" })
  @Patch(":id")
  actualizar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateRolDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.actualizar(id, dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "roles", accion: "eliminar" })
  @Delete(":id")
  eliminar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.eliminar(id, this.ctx(user));
  }
}
