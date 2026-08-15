import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { ComprasService } from "./compras.service";
import {
  CancelarOrdenCompraDto,
  CreateOrdenCompraDto,
  RecibirOrdenCompraDto,
} from "./dto/orden-compra.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Idempotent } from "../../common/decorators/idempotent.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "compras/ordenes", version: "1" })
export class ComprasController {
  constructor(private readonly service: ComprasService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId, usuarioId: user.id };
  }

  @RequirePermissions({ modulo: "compras", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateOrdenCompraDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.crear(dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "compras", accion: "ver" })
  @Get()
  listar(@Query() query: PaginationQueryDto & { estado?: string; proveedorId?: string }, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listar(query, this.ctx(user));
  }

  @RequirePermissions({ modulo: "compras", accion: "ver" })
  @Get(":id")
  obtener(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.obtenerPorId(id, this.ctx(user));
  }

  @RequirePermissions({ modulo: "compras", accion: "aprobar" })
  @Post(":id/enviar")
  enviar(@Param("id", ParseUUIDPipe) id: string, @Body("version") version: number, @CurrentUser() user: AuthenticatedUser) {
    return this.service.enviar(id, version, this.ctx(user));
  }

  @RequirePermissions({ modulo: "compras", accion: "editar" })
  @Idempotent()
  @Post(":id/recibir")
  recibir(@Param("id", ParseUUIDPipe) id: string, @Body() dto: RecibirOrdenCompraDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.recibir(id, dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "compras", accion: "anular" })
  @Post(":id/cancelar")
  cancelar(@Param("id", ParseUUIDPipe) id: string, @Body() dto: CancelarOrdenCompraDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.cancelar(id, dto, this.ctx(user));
  }
}
