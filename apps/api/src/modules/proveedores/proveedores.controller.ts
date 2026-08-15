import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from "@nestjs/common";
import { ProveedoresService } from "./proveedores.service";
import { CreateProveedorDto, UpdateProveedorDto } from "./dto/proveedor.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "proveedores", version: "1" })
export class ProveedoresController {
  constructor(private readonly service: ProveedoresService) {}

  @RequirePermissions({ modulo: "compras", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateProveedorDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crear(dto, { empresaId: user.empresaId, usuarioId: user.id });
  }

  @RequirePermissions({ modulo: "compras", accion: "ver" })
  @Get()
  listar(@Query() query: PaginationQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listar(query, { empresaId: user.empresaId, usuarioId: user.id });
  }

  @RequirePermissions({ modulo: "compras", accion: "ver" })
  @Get(":id")
  obtener(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.obtenerPorId(id, { empresaId: user.empresaId, usuarioId: user.id });
  }

  @RequirePermissions({ modulo: "compras", accion: "editar" })
  @Patch(":id")
  actualizar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateProveedorDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.actualizar(id, dto, { empresaId: user.empresaId, usuarioId: user.id });
  }

  @RequirePermissions({ modulo: "compras", accion: "eliminar" })
  @Delete(":id")
  eliminar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.eliminar(id, { empresaId: user.empresaId, usuarioId: user.id });
  }
}
