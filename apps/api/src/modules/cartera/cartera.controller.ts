import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query } from "@nestjs/common";
import { CarteraService } from "./cartera.service";
import { RegistrarAbonoDto } from "./dto/cartera.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { Idempotent } from "../../common/decorators/idempotent.decorator";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "cartera", version: "1" })
export class CarteraController {
  constructor(private readonly service: CarteraService) {}

  private ctx(user: AuthenticatedUser) {
    return { empresaId: user.empresaId, usuarioId: user.id };
  }

  @RequirePermissions({ modulo: "clientes", accion: "ver" })
  @Get()
  listar(@Query() query: PaginationQueryDto & { estado?: string; clienteId?: string }, @CurrentUser() user: AuthenticatedUser) {
    return this.service.listar(query, this.ctx(user));
  }

  @RequirePermissions({ modulo: "clientes", accion: "ver" })
  @Get("resumen")
  resumen(@CurrentUser() user: AuthenticatedUser) {
    return this.service.resumen(this.ctx(user));
  }

  @RequirePermissions({ modulo: "clientes", accion: "ver" })
  @Get(":id/abonos")
  historial(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.historialAbonos(id, this.ctx(user));
  }

  @RequirePermissions({ modulo: "clientes", accion: "editar" })
  @Idempotent()
  @Post(":id/abonos")
  registrarAbono(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: RegistrarAbonoDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.registrarAbono(id, dto, this.ctx(user));
  }
}
