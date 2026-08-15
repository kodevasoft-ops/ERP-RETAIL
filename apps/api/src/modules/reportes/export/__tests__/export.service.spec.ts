import ExcelJS from "exceljs";
import { ExcelExportService } from "../excel-export.service";
import { PdfExportService } from "../pdf-export.service";

describe("ExcelExportService", () => {
  const service = new ExcelExportService();

  it("genera un .xlsx válido, leíble por ExcelJS, con los datos y el total correctos", async () => {
    const buffer = await service.generar({
      titulo: "Ventas de prueba",
      subtitulo: "Del 1 al 30 de enero",
      columnas: [
        { header: "Producto", key: "producto", format: "text" },
        { header: "Unidades", key: "unidades", format: "integer" },
        { header: "Total", key: "total", format: "currency" },
      ],
      filas: [
        { producto: "Camisa", unidades: 5, total: 250_000 },
        { producto: "Pantalón", unidades: 3, total: 180_000 },
      ],
      totalizar: ["unidades", "total"],
    });

    expect(buffer.length).toBeGreaterThan(0);

    // Round-trip real: si ExcelJS puede releerlo, el archivo no está corrupto.
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(Buffer.from(buffer) as never);
    const sheet = workbook.worksheets[0];

    expect(sheet.getCell(1, 1).value).toBe("Ventas de prueba");
    // fila 4 = encabezados de columna (con subtítulo ocupa la fila 2)
    expect(sheet.getCell(4, 1).value).toBe("Producto");
    // fila 5 = primera fila de datos
    expect(sheet.getCell(5, 1).value).toBe("Camisa");
    expect(sheet.getCell(5, 2).value).toBe(5);
    // fila de totales: unidades = 5+3=8, total = 250000+180000=430000
    const filaTotales = 4 + 2 + 1;
    expect(sheet.getCell(filaTotales, 2).value).toBe(8);
    expect(sheet.getCell(filaTotales, 3).value).toBe(430_000);
  });

  it("no revienta con un conjunto de filas vacío", async () => {
    const buffer = await service.generar({
      titulo: "Reporte vacío",
      columnas: [{ header: "Campo", key: "campo" }],
      filas: [],
    });
    expect(buffer.length).toBeGreaterThan(0);
  });
});

describe("PdfExportService", () => {
  const service = new PdfExportService();

  it("genera un PDF válido (firma binaria %PDF) con múltiples filas", async () => {
    const buffer = await service.generar({
      titulo: "Inventario de prueba",
      columnas: [
        { header: "SKU", key: "sku", width: 15 },
        { header: "Stock", key: "stock", width: 10, format: "integer" },
      ],
      filas: Array.from({ length: 50 }, (_, i) => ({ sku: `SKU-${i}`, stock: i })),
      totalizar: ["stock"],
    });

    expect(buffer.length).toBeGreaterThan(0);
    // Todo PDF válido empieza con esta firma binaria.
    expect(buffer.subarray(0, 5).toString("ascii")).toBe("%PDF-");
  });

  it("pagina correctamente un dataset grande sin perder filas (verificable por tamaño creciente del buffer)", async () => {
    const pocasFilas = await service.generar({
      titulo: "Test",
      columnas: [{ header: "Campo", key: "campo" }],
      filas: [{ campo: "uno" }],
    });
    const muchasFilas = await service.generar({
      titulo: "Test",
      columnas: [{ header: "Campo", key: "campo" }],
      filas: Array.from({ length: 500 }, (_, i) => ({ campo: `fila-${i}` })),
    });

    // Un dataset 500x más grande debe producir un PDF sustancialmente mayor
    // (evidencia indirecta de que sí está paginando y escribiendo todas las filas).
    expect(muchasFilas.length).toBeGreaterThan(pocasFilas.length * 5);
  });
});
