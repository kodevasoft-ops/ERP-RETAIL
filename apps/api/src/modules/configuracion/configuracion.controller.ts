import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { ConfiguracionService } from "./configuracion.service";
import {
  CreateCategoriaDto,
  CreateMarcaDto,
  CreateSucursalDto,
  CreateTransportadoraDto,
  UpdateEmpresaDto,
  UpdateSucursalDto,
} from "./dto/configuracion.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "configuracion", version: "1" })
export class ConfiguracionController {
  constructor(private readonly service: ConfiguracionService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId };
  }

  @RequirePermissions({ modulo: "configuracion", accion: "ver" })
  @Get("empresa")
  empresa(@CurrentUser() user: AuthenticatedUser) {
    return this.service.empresa(this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "editar" })
  @Patch("empresa")
  actualizarEmpresa(@Body() dto: UpdateEmpresaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.actualizarEmpresa(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "ver" })
  @Get("sucursales")
  sucursales(@CurrentUser() user: AuthenticatedUser) {
    return this.service.sucursales(this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "crear" })
  @Post("sucursales")
  crearSucursal(@Body() dto: CreateSucursalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crearSucursal(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "editar" })
  @Patch("sucursales/:id")
  actualizarSucursal(@Param("id", ParseUUIDPipe) id: string, @Body() dto: UpdateSucursalDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.actualizarSucursal(id, dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "ver" })
  @Get("categorias")
  categorias(@CurrentUser() user: AuthenticatedUser) {
    return this.service.categorias(this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "crear" })
  @Post("categorias")
  crearCategoria(@Body() dto: CreateCategoriaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crearCategoria(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "eliminar" })
  @Delete("categorias/:id")
  eliminarCategoria(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.eliminarCategoria(id, this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "ver" })
  @Get("marcas")
  marcas(@CurrentUser() user: AuthenticatedUser) {
    return this.service.marcas(this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "crear" })
  @Post("marcas")
  crearMarca(@Body() dto: CreateMarcaDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crearMarca(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "eliminar" })
  @Delete("marcas/:id")
  eliminarMarca(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.eliminarMarca(id, this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "ver" })
  @Get("transportadoras")
  transportadoras(@CurrentUser() user: AuthenticatedUser) {
    return this.service.transportadoras(this.ctx(user));
  }

  @RequirePermissions({ modulo: "configuracion", accion: "crear" })
  @Post("transportadoras")
  crearTransportadora(@Body() dto: CreateTransportadoraDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crearTransportadora(dto, this.ctx(user));
  }
}
