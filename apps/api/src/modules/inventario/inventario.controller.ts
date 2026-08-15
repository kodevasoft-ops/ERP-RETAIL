import { Body, Controller, Get, Post, Query, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { InventarioService } from "./inventario.service";
import {
  AjusteInventarioDto,
  EntradaInventarioDto,
  SalidaInventarioDto,
  TransferenciaInventarioDto,
} from "./dto/movimientos.dto";
import { QueryKardexDto } from "./dto/query-kardex.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { Idempotent } from "../../common/decorators/idempotent.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "inventario", version: "1" })
export class InventarioController {
  constructor(private readonly service: InventarioService) {}

  private ctx(user: AuthenticatedUser, req: FastifyRequest) {
    return {
      empresaId: user.empresaId,
      usuarioId: user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? "",
      correlationId: req.headers["x-correlation-id"] as string | undefined,
      permisos: user.permisos,
    };
  }

  @RequirePermissions({ modulo: "inventario", accion: "crear" })
  @Idempotent()
  @Post("entradas")
  entrada(@Body() dto: EntradaInventarioDto, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.entrada(dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "inventario", accion: "crear" })
  @Idempotent()
  @Post("salidas")
  salida(@Body() dto: SalidaInventarioDto, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.salida(dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "inventario", accion: "crear" })
  @Idempotent()
  @Post("transferencias")
  transferencia(
    @Body() dto: TransferenciaInventarioDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.transferencia(dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "inventario", accion: "aprobar" })
  @Idempotent()
  @Post("ajustes")
  ajuste(@Body() dto: AjusteInventarioDto, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.ajuste(dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "inventario", accion: "ver" })
  @Get("kardex")
  kardex(@Query() query: QueryKardexDto, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.kardex(query, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "inventario", accion: "ver" })
  @Get("alertas/stock-bajo")
  alertas(@CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.alertasStockBajo(this.ctx(user, req));
  }
}
