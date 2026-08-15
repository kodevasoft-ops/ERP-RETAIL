import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import type { Job } from "bullmq";
import { ReportesService } from "../reportes.service";
import { ExcelExportService, ColumnaReporte } from "../export/excel-export.service";
import { PdfExportService } from "../export/pdf-export.service";
import type { ExportJobData } from "./export-queue.service";

interface ReporteConfig {
  titulo: string;
  columnas: ColumnaReporte[];
  totalizar: string[];
  obtenerFilas: (service: ReportesService, params: Record<string, string>, empresaId: string) => Promise<unknown[]>;
}

const REPORTES: Record<string, ReporteConfig> = {
  "ventas-por-dia": {
    titulo: "Ventas por día",
    columnas: [
      { header: "Fecha", key: "fecha", width: 15, format: "text" },
      { header: "Ventas realizadas", key: "cantidad_ventas", width: 18, format: "integer" },
      { header: "Total vendido", key: "total_ventas", width: 20, format: "currency" },
    ],
    totalizar: ["cantidad_ventas", "total_ventas"],
    obtenerFilas: (s, p, e) => s.ventasPorDia(new Date(p.desde), new Date(p.hasta), { empresaId: e }),
  },
  "top-productos": {
    titulo: "Productos más vendidos",
    columnas: [
      { header: "Producto", key: "producto", width: 30, format: "text" },
      { header: "Unidades vendidas", key: "unidades", width: 18, format: "integer" },
      { header: "Total vendido", key: "total_ventas", width: 20, format: "currency" },
    ],
    totalizar: ["unidades", "total_ventas"],
    obtenerFilas: (s, p, e) => s.topProductos(new Date(p.desde), new Date(p.hasta), { empresaId: e }, 200),
  },
  "inventario-valorizado": {
    titulo: "Inventario valorizado",
    columnas: [
      { header: "Producto", key: "producto", width: 26, format: "text" },
      { header: "Talla", key: "talla", width: 8, format: "text" },
      { header: "Color", key: "color", width: 10, format: "text" },
      { header: "SKU", key: "sku", width: 16, format: "text" },
      { header: "Stock", key: "stock", width: 10, format: "integer" },
      { header: "Valor total", key: "valor_total", width: 18, format: "currency" },
    ],
    totalizar: ["stock", "valor_total"],
    obtenerFilas: (s, _p, e) => s.inventarioValorizado({ empresaId: e }),
  },
};

/**
 * Procesa jobs de la cola "exportes" en un worker separado del proceso
 * que atiende HTTP (ver docker-compose.prod.yml: réplica dedicada con
 * `command: node dist/worker.js`). Así, generar un PDF de 5000 filas
 * nunca compite por CPU con una venta en curso en el POS.
 */
@Processor("exportes")
export class ExportProcessor extends WorkerHost {
  private readonly logger = new Logger(ExportProcessor.name);

  constructor(
    private readonly reportesService: ReportesService,
    private readonly excel: ExcelExportService,
    private readonly pdf: PdfExportService,
  ) {
    super();
  }

  async process(job: Job<ExportJobData>) {
    const config = REPORTES[job.data.tipo];
    if (!config) throw new Error(`Tipo de reporte desconocido: ${job.data.tipo}`);

    this.logger.log(`Generando reporte "${job.data.tipo}" (job ${job.id})`);

    const filas = await config.obtenerFilas(this.reportesService, job.data.params, job.data.empresaId);
    const opciones = {
      titulo: config.titulo,
      columnas: config.columnas,
      filas: filas as Record<string, unknown>[],
      totalizar: config.totalizar,
    };

    const buffer =
      job.data.formato === "xlsx" ? await this.excel.generar(opciones) : await this.pdf.generar(opciones);

    // El resultado (base64) queda en Redis vía BullMQ, recuperable por
    // GET /reportes/exportar/:jobId mientras el job no expire (removeOnComplete).
    return {
      nombreArchivo: `${job.data.tipo}.${job.data.formato}`,
      contentType:
        job.data.formato === "xlsx"
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf",
      datosBase64: buffer.toString("base64"),
    };
  }
}
