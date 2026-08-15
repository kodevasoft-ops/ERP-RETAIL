import { Controller, Get, Query, Res } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { FinanzasService } from "./finanzas.service";
import { GastosService } from "../gastos/gastos.service";
import { ExcelExportService, ColumnaReporte } from "../reportes/export/excel-export.service";
import { PdfExportService } from "../reportes/export/pdf-export.service";
import { RangoFechasDto } from "../reportes/dto/rango-fechas.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

const CONTENT_TYPES = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
} as const;

@Controller({ path: "finanzas", version: "1" })
export class FinanzasController {
  constructor(
    private readonly service: FinanzasService,
    private readonly gastosService: GastosService,
    private readonly excel: ExcelExportService,
    private readonly pdf: PdfExportService,
  ) {}

  @RequirePermissions({ modulo: "finanzas", accion: "ver" })
  @Get("resumen")
  async resumen(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser) {
    const { desde, hasta } = query.rango;
    return this.service.resumen(desde, hasta, { empresaId: user.empresaId });
  }

  @RequirePermissions({ modulo: "finanzas", accion: "ver" })
  @Get("flujo-caja")
  async flujoCaja(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser) {
    const { desde, hasta } = query.rango;
    return this.service.flujoPorDia(desde, hasta, { empresaId: user.empresaId });
  }

  @RequirePermissions({ modulo: "finanzas", accion: "ver" })
  @Get("gastos-por-categoria")
  async gastosPorCategoria(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser) {
    const { desde, hasta } = query.rango;
    return this.gastosService.resumenPorCategoria(desde, hasta, { empresaId: user.empresaId });
  }

  @RequirePermissions({ modulo: "finanzas", accion: "exportar" })
  @Get("flujo-caja/exportar")
  async exportarFlujoCaja(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser, @Res() res: FastifyReply) {
    const { desde, hasta } = query.rango;
    const filas = await this.service.flujoPorDia(desde, hasta, { empresaId: user.empresaId });
    const columnas: ColumnaReporte[] = [
      { header: "Fecha", key: "fecha", width: 15, format: "text" },
      { header: "Ingresos", key: "ingresos", width: 18, format: "currency" },
      { header: "Egresos", key: "egresos", width: 18, format: "currency" },
      { header: "Neto", key: "neto", width: 18, format: "currency" },
    ];
    const formato = query.formato ?? "xlsx";
    const opciones = {
      titulo: "Flujo de caja diario",
      subtitulo: `Del ${desde.toLocaleDateString("es-CO")} al ${hasta.toLocaleDateString("es-CO")}`,
      columnas,
      filas: filas as unknown as Record<string, unknown>[],
      totalizar: ["ingresos", "egresos", "neto"],
    };
    const buffer = formato === "xlsx" ? await this.excel.generar(opciones) : await this.pdf.generar(opciones);
    res
      .header("Content-Type", CONTENT_TYPES[formato])
      .header("Content-Disposition", `attachment; filename="flujo-caja.${formato}"`)
      .send(buffer);
  }
}
