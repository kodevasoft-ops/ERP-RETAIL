import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Req, Res } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { VentasService } from "./ventas.service";
import { FacturaPdfService } from "./pdf/factura-pdf.service";
import { AnularVentaDto, CreateVentaDto } from "./dto/venta.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "ventas", version: "1" })
export class VentasController {
  constructor(
    private readonly service: VentasService,
    private readonly facturaPdf: FacturaPdfService,
  ) {}

  private ctx(user: AuthenticatedUser, req: FastifyRequest) {
    return {
      empresaId: user.empresaId,
      usuarioId: user.id,
      permisos: user.permisos,
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? "",
      correlationId: req.headers["x-correlation-id"] as string | undefined,
    };
  }

  @RequirePermissions({ modulo: "ventas", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateVentaDto, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.crear(dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "ventas", accion: "ver" })
  @Get()
  listar(
    @Query() query: PaginationQueryDto & { estado?: "COMPLETADA" | "ANULADA"; clienteId?: string; sucursalId?: string },
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.listar(query, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "ventas", accion: "ver" })
  @Get(":id")
  obtener(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.obtenerPorId(id, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "ventas", accion: "anular" })
  @Post(":id/anular")
  anular(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: AnularVentaDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.anular(id, dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "ventas", accion: "ver" })
  @Get(":id/factura.pdf")
  async factura(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const datos = await this.service.datosParaFactura(id, this.ctx(user, req));
    const buffer = await this.facturaPdf.generar(datos);
    res
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `inline; filename="factura-${datos.numero}.pdf"`)
      .send(buffer);
  }

  @RequirePermissions({ modulo: "ventas", accion: "ver" })
  @Get(":id/nota-credito.pdf")
  async notaCredito(
    @Param("id", ParseUUIDPipe) id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
    @Res() res: FastifyReply,
  ) {
    const datos = await this.service.datosParaNotaCredito(id, this.ctx(user, req));
    const buffer = await this.facturaPdf.generar(datos);
    res
      .header("Content-Type", "application/pdf")
      .header("Content-Disposition", `inline; filename="nota-credito-${datos.numero}.pdf"`)
      .send(buffer);
  }
}
