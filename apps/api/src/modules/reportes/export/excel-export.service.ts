import { Injectable } from "@nestjs/common";
import ExcelJS from "exceljs";

export interface ColumnaReporte {
  header: string;
  key: string;
  width?: number;
  /** 'currency' formatea como $ #,##0; 'integer' sin decimales; 'percent' como %; 'date' como fecha corta */
  format?: "currency" | "integer" | "percent" | "date" | "text";
}

export interface ExportOptions {
  titulo: string;
  subtitulo?: string;
  columnas: ColumnaReporte[];
  filas: Record<string, unknown>[];
  /** Si se indica, agrega una fila de totales sumando estas columnas (por key). */
  totalizar?: string[];
}

const FORMATOS: Record<NonNullable<ColumnaReporte["format"]>, string> = {
  currency: '"$"#,##0',
  integer: "#,##0",
  percent: "0.0%",
  date: "dd/mm/yyyy",
  text: "@",
};

const COLOR_PRIMARIO = "1E3A8A"; // azul profesional, consistente con el design system
const COLOR_HEADER_TEXTO = "FFFFFFFF";

@Injectable()
export class ExcelExportService {
  async generar(options: ExportOptions): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "ERP Retail";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet(options.titulo.slice(0, 31), {
      views: [{ state: "frozen", ySplit: options.subtitulo ? 4 : 3 }],
      pageSetup: { orientation: "landscape", fitToPage: true },
    });

    // ---- Encabezado del documento ----
    sheet.mergeCells(1, 1, 1, options.columnas.length);
    const tituloCell = sheet.getCell(1, 1);
    tituloCell.value = options.titulo;
    tituloCell.font = { size: 16, bold: true, color: { argb: "FF1A1A1A" } };
    sheet.getRow(1).height = 28;

    let filaHeader = 3;
    if (options.subtitulo) {
      sheet.mergeCells(2, 1, 2, options.columnas.length);
      const subCell = sheet.getCell(2, 1);
      subCell.value = options.subtitulo;
      subCell.font = { size: 10, color: { argb: "FF666666" } };
      filaHeader = 4;
    }

    // ---- Fila de encabezados de columna ----
    const headerRow = sheet.getRow(filaHeader);
    options.columnas.forEach((col, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = col.header;
      cell.font = { bold: true, color: { argb: COLOR_HEADER_TEXTO } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${COLOR_PRIMARIO}` } };
      cell.alignment = { vertical: "middle", horizontal: "left" };
      cell.border = { bottom: { style: "thin", color: { argb: "FFCCCCCC" } } };
    });
    headerRow.height = 22;

    sheet.columns = options.columnas.map((col) => ({ key: col.key, width: col.width ?? 18 }));

    // ---- Filas de datos ----
    options.filas.forEach((fila, idx) => {
      const row = sheet.getRow(filaHeader + 1 + idx);
      options.columnas.forEach((col, i) => {
        const cell = row.getCell(i + 1);
        cell.value = (fila[col.key] as ExcelJS.CellValue) ?? "";
        if (col.format) cell.numFmt = FORMATOS[col.format];
        // Bandas alternadas — mejora legibilidad en reportes largos.
        if (idx % 2 === 1) {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF7F8FA" } };
        }
      });
    });

    // ---- Fila de totales ----
    if (options.totalizar?.length) {
      const totalRowIndex = filaHeader + 1 + options.filas.length;
      const totalRow = sheet.getRow(totalRowIndex);
      options.columnas.forEach((col, i) => {
        const cell = totalRow.getCell(i + 1);
        if (i === 0) {
          cell.value = "Total";
          cell.font = { bold: true };
        } else if (options.totalizar!.includes(col.key)) {
          const suma = options.filas.reduce((acc, f) => acc + (Number(f[col.key]) || 0), 0);
          cell.value = suma;
          cell.numFmt = FORMATOS[col.format ?? "integer"];
          cell.font = { bold: true };
        }
        cell.border = { top: { style: "thin", color: { argb: "FF999999" } } };
      });
    }

    // ---- Autofiltro sobre el rango de datos ----
    sheet.autoFilter = {
      from: { row: filaHeader, column: 1 },
      to: { row: filaHeader, column: options.columnas.length },
    };

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
