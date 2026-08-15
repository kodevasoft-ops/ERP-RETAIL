import { Controller, Get, Param, Query } from "@nestjs/common";
import { AuditoriaService } from "./auditoria.service";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "auditoria", version: "1" })
export class AuditoriaController {
  constructor(private readonly service: AuditoriaService) {}

  @RequirePermissions({ modulo: "auditoria", accion: "ver" })
  @Get()
  listar(
    @Query() query: PaginationQueryDto & { modulo?: string; usuarioId?: string; desde?: string; hasta?: string; resultado?: string },
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.service.listar(query, { empresaId: user.empresaId });
  }

  @RequirePermissions({ modulo: "auditoria", accion: "ver" })
  @Get("modulos")
  modulos(@CurrentUser() user: AuthenticatedUser) {
    return this.service.modulosConActividad({ empresaId: user.empresaId });
  }

  @RequirePermissions({ modulo: "auditoria", accion: "ver" })
  @Get(":id")
  detalle(@Param("id") id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.detalle(id, { empresaId: user.empresaId });
  }
}
