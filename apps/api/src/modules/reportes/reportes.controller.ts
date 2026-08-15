import { Controller, Get, Param, Post, Query, Res } from "@nestjs/common";
import type { FastifyReply } from "fastify";
import { ReportesService } from "./reportes.service";
import { ExcelExportService, ColumnaReporte } from "./export/excel-export.service";
import { PdfExportService } from "./export/pdf-export.service";
import { ExportQueueService } from "./queue/export-queue.service";
import { RangoFechasDto } from "./dto/rango-fechas.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

const CONTENT_TYPES = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  pdf: "application/pdf",
} as const;

@Controller({ path: "reportes", version: "1" })
export class ReportesController {
  constructor(
    private readonly service: ReportesService,
    private readonly excel: ExcelExportService,
    private readonly pdf: PdfExportService,
    private readonly exportQueue: ExportQueueService,
  ) {}

  /**
   * Exportación asíncrona (recomendada bajo carga): encola el job y
   * responde de inmediato. El frontend hace polling a /exportar-async/:jobId.
   * Usa esta ruta para reportes potencialmente grandes (inventario completo,
   * rangos de fechas amplios) donde bloquear el request no es aceptable.
   */
  @RequirePermissions({ modulo: "reportes", accion: "exportar" })
  @Post(":tipo/exportar-async")
  async exportarAsync(
    @Param("tipo") tipo: string,
    @Query() query: RangoFechasDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.exportQueue.encolar({
      tipo,
      formato: query.formato ?? "xlsx",
      empresaId: user.empresaId,
      usuarioId: user.id,
      params: { desde: query.rango.desde.toISOString(), hasta: query.rango.hasta.toISOString() },
    });
  }

  @RequirePermissions({ modulo: "reportes", accion: "exportar" })
  @Get("exportar-async/:jobId")
  async estadoExportacion(@Param("jobId") jobId: string, @Res() res: FastifyReply) {
    const resultado = await this.exportQueue.estado(jobId);

    if (resultado.estado === "completado" && resultado.resultado) {
      const { contentType, nombreArchivo, datosBase64 } = resultado.resultado as {
        contentType: string;
        nombreArchivo: string;
        datosBase64: string;
      };
      // Si el cliente pide el binario directo (Accept: application/octet-stream), lo entrega ya.
      res
        .header("Content-Type", "application/json")
        .send({ estado: "completado", nombreArchivo, contentType, datosBase64 });
      return;
    }

    res.send(resultado);
  }

  private async enviarArchivo(
    res: FastifyReply,
    formato: "xlsx" | "pdf",
    nombreArchivo: string,
    opciones: Parameters<ExcelExportService["generar"]>[0],
  ) {
    const buffer = formato === "xlsx" ? await this.excel.generar(opciones) : await this.pdf.generar(opciones);
    res
      .header("Content-Type", CONTENT_TYPES[formato])
      .header("Content-Disposition", `attachment; filename="${nombreArchivo}.${formato}"`)
      .send(buffer);
  }

  private rangoTexto(desde: Date, hasta: Date) {
    const fmt = (d: Date) => d.toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" });
    return `Del ${fmt(desde)} al ${fmt(hasta)}`;
  }

  @RequirePermissions({ modulo: "reportes", accion: "ver" })
  @Get("dashboard")
  dashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.service.resumenDashboard({ empresaId: user.empresaId });
  }

  // ---------- VENTAS POR DÍA ----------

  @RequirePermissions({ modulo: "reportes", accion: "ver" })
  @Get("ventas-por-dia")
  async ventasPorDia(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser) {
    const { desde, hasta } = query.rango;
    return this.service.ventasPorDia(desde, hasta, { empresaId: user.empresaId });
  }

  @RequirePermissions({ modulo: "reportes", accion: "exportar" })
  @Get("ventas-por-dia/exportar")
  async exportarVentasPorDia(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser, @Res() res: FastifyReply) {
    const { desde, hasta } = query.rango;
    const filas = await this.service.ventasPorDia(desde, hasta, { empresaId: user.empresaId });
    const columnas: ColumnaReporte[] = [
      { header: "Fecha", key: "fecha", width: 15, format: "text" },
      { header: "Ventas realizadas", key: "cantidad_ventas", width: 18, format: "integer" },
      { header: "Total vendido", key: "total_ventas", width: 20, format: "currency" },
    ];
    await this.enviarArchivo(res, query.formato ?? "xlsx", "ventas-por-dia", {
      titulo: "Ventas por día",
      subtitulo: this.rangoTexto(desde, hasta),
      columnas,
      filas: filas as unknown as Record<string, unknown>[],
      totalizar: ["cantidad_ventas", "total_ventas"],
    });
  }

  // ---------- VENTAS POR VENDEDOR ----------

  @RequirePermissions({ modulo: "reportes", accion: "ver" })
  @Get("ventas-por-vendedor")
  async ventasPorVendedor(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser) {
    const { desde, hasta } = query.rango;
    return this.service.ventasPorVendedor(desde, hasta, { empresaId: user.empresaId });
  }

  @RequirePermissions({ modulo: "reportes", accion: "exportar" })
  @Get("ventas-por-vendedor/exportar")
  async exportarVentasPorVendedor(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser, @Res() res: FastifyReply) {
    const { desde, hasta } = query.rango;
    const filas = await this.service.ventasPorVendedor(desde, hasta, { empresaId: user.empresaId });
    const columnas: ColumnaReporte[] = [
      { header: "Vendedor", key: "nombre", width: 25, format: "text" },
      { header: "Ventas realizadas", key: "cantidad_ventas", width: 18, format: "integer" },
      { header: "Total vendido", key: "total_ventas", width: 20, format: "currency" },
    ];
    await this.enviarArchivo(res, query.formato ?? "xlsx", "ventas-por-vendedor", {
      titulo: "Ventas por vendedor",
      subtitulo: this.rangoTexto(desde, hasta),
      columnas,
      filas: filas as unknown as Record<string, unknown>[],
      totalizar: ["cantidad_ventas", "total_ventas"],
    });
  }

  // ---------- VENTAS POR CATEGORÍA ----------

  @RequirePermissions({ modulo: "reportes", accion: "ver" })
  @Get("ventas-por-categoria")
  async ventasPorCategoria(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser) {
    const { desde, hasta } = query.rango;
    return this.service.ventasPorCategoria(desde, hasta, { empresaId: user.empresaId });
  }

  // ---------- TOP PRODUCTOS ----------

  @RequirePermissions({ modulo: "reportes", accion: "ver" })
  @Get("top-productos")
  async topProductos(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser) {
    const { desde, hasta } = query.rango;
    return this.service.topProductos(desde, hasta, { empresaId: user.empresaId });
  }

  @RequirePermissions({ modulo: "reportes", accion: "exportar" })
  @Get("top-productos/exportar")
  async exportarTopProductos(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser, @Res() res: FastifyReply) {
    const { desde, hasta } = query.rango;
    const filas = await this.service.topProductos(desde, hasta, { empresaId: user.empresaId }, 100);
    const columnas: ColumnaReporte[] = [
      { header: "Producto", key: "producto", width: 30, format: "text" },
      { header: "Unidades vendidas", key: "unidades", width: 18, format: "integer" },
      { header: "Total vendido", key: "total_ventas", width: 20, format: "currency" },
    ];
    await this.enviarArchivo(res, query.formato ?? "xlsx", "top-productos", {
      titulo: "Productos más vendidos",
      subtitulo: this.rangoTexto(desde, hasta),
      columnas,
      filas: filas as unknown as Record<string, unknown>[],
      totalizar: ["unidades", "total_ventas"],
    });
  }

  // ---------- TOP CLIENTES ----------

  @RequirePermissions({ modulo: "reportes", accion: "ver" })
  @Get("top-clientes")
  async topClientes(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser) {
    const { desde, hasta } = query.rango;
    return this.service.topClientes(desde, hasta, { empresaId: user.empresaId });
  }

  @RequirePermissions({ modulo: "reportes", accion: "exportar" })
  @Get("top-clientes/exportar")
  async exportarTopClientes(@Query() query: RangoFechasDto, @CurrentUser() user: AuthenticatedUser, @Res() res: FastifyReply) {
    const { desde, hasta } = query.rango;
    const filas = await this.service.topClientes(desde, hasta, { empresaId: user.empresaId }, 100);
    const columnas: ColumnaReporte[] = [
      { header: "Cliente", key: "cliente", width: 30, format: "text" },
      { header: "Compras", key: "compras", width: 15, format: "integer" },
      { header: "Total comprado", key: "total_compras", width: 20, format: "currency" },
    ];
    await this.enviarArchivo(res, query.formato ?? "xlsx", "top-clientes", {
      titulo: "Mejores clientes",
      subtitulo: this.rangoTexto(desde, hasta),
      columnas,
      filas: filas as unknown as Record<string, unknown>[],
      totalizar: ["compras", "total_compras"],
    });
  }

  // ---------- INVENTARIO VALORIZADO ----------

  @RequirePermissions({ modulo: "reportes", accion: "ver" })
  @Get("inventario-valorizado")
  async inventarioValorizado(@CurrentUser() user: AuthenticatedUser) {
    return this.service.inventarioValorizado({ empresaId: user.empresaId });
  }

  @RequirePermissions({ modulo: "reportes", accion: "exportar" })
  @Get("inventario-valorizado/exportar")
  async exportarInventarioValorizado(
    @Query() query: RangoFechasDto,
    @CurrentUser() user: AuthenticatedUser,
    @Res() res: FastifyReply,
  ) {
    const filas = await this.service.inventarioValorizado({ empresaId: user.empresaId });
    const valorTotal = filas.reduce((sum, f) => sum + f.valor_total, 0);
    const columnas: ColumnaReporte[] = [
      { header: "Producto", key: "producto", width: 26, format: "text" },
      { header: "Talla", key: "talla", width: 8, format: "text" },
      { header: "Color", key: "color", width: 10, format: "text" },
      { header: "SKU", key: "sku", width: 16, format: "text" },
      { header: "Stock", key: "stock", width: 10, format: "integer" },
      { header: "Costo promedio", key: "costo_promedio", width: 16, format: "currency" },
      { header: "Valor total", key: "valor_total", width: 18, format: "currency" },
    ];
    await this.enviarArchivo(res, query.formato ?? "xlsx", "inventario-valorizado", {
      titulo: "Inventario valorizado",
      subtitulo: `Al corte de hoy · Valor total: $${valorTotal.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`,
      columnas,
      filas: filas as unknown as Record<string, unknown>[],
      totalizar: ["stock", "valor_total"],
    });
  }
}
