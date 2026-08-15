import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { EstadoLead } from "database";
import { CrmService } from "./crm.service";
import { CreateLeadDto, CreateSeguimientoDto, MoverLeadDto, UpdateLeadDto } from "./dto/lead.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "crm/leads", version: "1" })
export class CrmController {
  constructor(private readonly service: CrmService) {}

  private ctx(user: AuthenticatedUser, req: FastifyRequest) {
    return {
      empresaId: user.empresaId,
      usuarioId: user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? "",
      correlationId: req.headers["x-correlation-id"] as string | undefined,
    };
  }

  @RequirePermissions({ modulo: "crm", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateLeadDto, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.crear(dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "crm", accion: "ver" })
  @Get("kanban")
  kanban(@Query("vendedorId") vendedorId: string | undefined, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.kanban(this.ctx(user, req), vendedorId);
  }

  @RequirePermissions({ modulo: "crm", accion: "ver" })
  @Get()
  listar(
    @Query() query: PaginationQueryDto & { estado?: EstadoLead; vendedorId?: string },
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.listar(query, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "crm", accion: "ver" })
  @Get(":id")
  obtener(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.obtenerPorId(id, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "crm", accion: "editar" })
  @Patch(":id")
  actualizar(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateLeadDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.actualizar(id, dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "crm", accion: "editar" })
  @Patch(":id/mover")
  mover(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: MoverLeadDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.mover(id, dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "crm", accion: "crear" })
  @Post(":id/seguimientos")
  agregarSeguimiento(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: CreateSeguimientoDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.agregarSeguimiento(id, dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "crm", accion: "eliminar" })
  @Delete(":id")
  eliminar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.eliminar(id, this.ctx(user, req));
  }
}
