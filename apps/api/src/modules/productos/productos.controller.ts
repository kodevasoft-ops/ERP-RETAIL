import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { ProductosService } from "./productos.service";
import { CreateProductoDto } from "./dto/create-producto.dto";
import { UpdateProductoDto } from "./dto/update-producto.dto";
import { QueryProductosDto } from "./dto/query-productos.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "productos", version: "1" })
export class ProductosController {
  constructor(private readonly service: ProductosService) {}

  private ctx(user: AuthenticatedUser, req: FastifyRequest) {
    return {
      empresaId: user.empresaId,
      usuarioId: user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? "",
      correlationId: req.headers["x-correlation-id"] as string | undefined,
    };
  }

  @RequirePermissions({ modulo: "productos", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateProductoDto, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.crear(dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "productos", accion: "ver" })
  @Get()
  listar(@Query() query: QueryProductosDto, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.listar(query, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "productos", accion: "ver" })
  @Get(":id")
  obtener(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.obtenerPorId(id, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "productos", accion: "editar" })
  @Patch(":id")
  actualizar(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductoDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.actualizar(id, dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "productos", accion: "eliminar" })
  @Delete(":id")
  eliminar(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.eliminar(id, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "productos", accion: "editar" })
  @Post(":id/imagenes")
  agregarImagen(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() body: { url: string; esPrincipal?: boolean },
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.agregarImagen(id, body.url, body.esPrincipal ?? false, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "productos", accion: "editar" })
  @Delete(":id/imagenes/:imagenId")
  eliminarImagen(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("imagenId", ParseUUIDPipe) imagenId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.eliminarImagen(id, imagenId, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "productos", accion: "editar" })
  @Patch(":id/imagenes/:imagenId/principal")
  marcarImagenPrincipal(
    @Param("id", ParseUUIDPipe) id: string,
    @Param("imagenId", ParseUUIDPipe) imagenId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.marcarImagenPrincipal(id, imagenId, this.ctx(user, req));
  }
}
