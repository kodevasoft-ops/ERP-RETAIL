import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";
import type { ColumnaReporte, ExportOptions } from "./excel-export.service";

const COLOR_PRIMARIO = "#1E3A8A";
const COLOR_TEXTO = "#1A1A1A";
const COLOR_MUTED = "#666666";
const COLOR_BANDA = "#F7F8FA";
const MARGEN = 40;

function formatearValor(valor: unknown, formato?: ColumnaReporte["format"]): string {
  if (valor === null || valor === undefined) return "";
  switch (formato) {
    case "currency":
      return `$${Number(valor).toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
    case "integer":
      return Number(valor).toLocaleString("es-CO", { maximumFractionDigits: 0 });
    case "percent":
      return `${(Number(valor) * 100).toFixed(1)}%`;
    case "date":
      return new Date(valor as string).toLocaleDateString("es-CO");
    default:
      return String(valor);
  }
}

@Injectable()
export class PdfExportService {
  async generar(options: ExportOptions): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: MARGEN, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const pageWidth = doc.page.width - MARGEN * 2;
      const columnas = options.columnas;
      const anchoTotal = columnas.reduce((sum, c) => sum + (c.width ?? 18), 0);
      const anchosCol = columnas.map((c) => ((c.width ?? 18) / anchoTotal) * pageWidth);

      // ---- Encabezado ----
      doc.fontSize(18).fillColor(COLOR_TEXTO).font("Helvetica-Bold").text(options.titulo, MARGEN, MARGEN);
      if (options.subtitulo) {
        doc.fontSize(9).fillColor(COLOR_MUTED).font("Helvetica").text(options.subtitulo, MARGEN, MARGEN + 24);
      }

      let y = MARGEN + (options.subtitulo ? 48 : 36);

      const dibujarEncabezadoTabla = () => {
        doc.rect(MARGEN, y, pageWidth, 20).fill(COLOR_PRIMARIO);
        let x = MARGEN;
        doc.fontSize(8).fillColor("#FFFFFF").font("Helvetica-Bold");
        columnas.forEach((col, i) => {
          doc.text(col.header, x + 4, y + 6, { width: anchosCol[i] - 8, ellipsis: true });
          x += anchosCol[i];
        });
        y += 20;
      };

      dibujarEncabezadoTabla();

      // ---- Filas ----
      doc.font("Helvetica").fontSize(8);
      options.filas.forEach((fila, idx) => {
        if (y > doc.page.height - MARGEN - 30) {
          doc.addPage();
          y = MARGEN;
          dibujarEncabezadoTabla();
          doc.font("Helvetica").fontSize(8);
        }

        if (idx % 2 === 1) {
          doc.rect(MARGEN, y, pageWidth, 18).fill(COLOR_BANDA);
        }

        let x = MARGEN;
        doc.fillColor(COLOR_TEXTO);
        columnas.forEach((col, i) => {
          const texto = formatearValor(fila[col.key], col.format);
          doc.text(texto, x + 4, y + 5, { width: anchosCol[i] - 8, ellipsis: true });
          x += anchosCol[i];
        });
        y += 18;
      });

      // ---- Totales ----
      if (options.totalizar?.length) {
        doc.moveTo(MARGEN, y).lineTo(MARGEN + pageWidth, y).strokeColor("#999999").stroke();
        y += 4;
        let x = MARGEN;
        doc.font("Helvetica-Bold").fontSize(8).fillColor(COLOR_TEXTO);
        columnas.forEach((col, i) => {
          if (i === 0) {
            doc.text("Total", x + 4, y + 4, { width: anchosCol[i] - 8 });
          } else if (options.totalizar!.includes(col.key)) {
            const suma = options.filas.reduce((acc, f) => acc + (Number(f[col.key]) || 0), 0);
            doc.text(formatearValor(suma, col.format ?? "integer"), x + 4, y + 4, { width: anchosCol[i] - 8 });
          }
          x += anchosCol[i];
        });
      }

      // ---- Pie de página con numeración ----
      const paginas = doc.bufferedPageRange();
      for (let i = 0; i < paginas.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(7)
          .fillColor(COLOR_MUTED)
          .text(
            `Generado el ${new Date().toLocaleString("es-CO")} · Página ${i + 1} de ${paginas.count}`,
            MARGEN,
            doc.page.height - MARGEN + 5,
            { width: pageWidth, align: "center" },
          );
      }

      doc.end();
    });
  }
}
