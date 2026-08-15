import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from "@nestjs/common";
import { FidelizacionService } from "./fidelizacion.service";
import { AcumularPuntosDto, RedimirPuntosDto } from "./dto/fidelizacion.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "fidelizacion/clientes/:clienteId", version: "1" })
export class FidelizacionController {
  constructor(private readonly service: FidelizacionService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId, usuarioId: user.id };
  }

  @RequirePermissions({ modulo: "clientes", accion: "ver" })
  @Get("historial")
  historial(@Param("clienteId", ParseUUIDPipe) clienteId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.historial(clienteId, this.ctx(user));
  }

  @RequirePermissions({ modulo: "clientes", accion: "editar" })
  @Post("acumular")
  acumular(
    @Param("clienteId", ParseUUIDPipe) clienteId: string,
    @Body() dto: AcumularPuntosDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.acumular(clienteId, dto, this.ctx(user));
  }

  @RequirePermissions({ modulo: "clientes", accion: "editar" })
  @Post("redimir")
  redimir(
    @Param("clienteId", ParseUUIDPipe) clienteId: string,
    @Body() dto: RedimirPuntosDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.redimir(clienteId, dto, this.ctx(user));
  }
}
