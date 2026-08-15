import { Injectable } from "@nestjs/common";
import ExcelJS from "exceljs";

const COLUMNAS = [
  { header: "Código producto*", key: "codigo", width: 16 },
  { header: "Nombre*", key: "nombre", width: 28 },
  { header: "Categoría", key: "categoria", width: 16 },
  { header: "Marca", key: "marca", width: 14 },
  { header: "Descripción", key: "descripcion", width: 30 },
  { header: "Talla*", key: "talla", width: 10 },
  { header: "Color*", key: "color", width: 12 },
  { header: "SKU*", key: "sku", width: 16 },
  { header: "Stock*", key: "stock", width: 10 },
  { header: "Stock mínimo", key: "stockMinimo", width: 12 },
  { header: "Costo compra*", key: "costoCompra", width: 14 },
  { header: "Precio venta*", key: "precioVenta", width: 14 },
  { header: "Precio mayorista", key: "precioMayorista", width: 16 },
  { header: "IVA %", key: "iva", width: 8 },
];

/**
 * Un producto con 3 tallas x 2 colores son 6 filas con el mismo "Código
 * producto" — el importador las agrupa automáticamente. Este es el
 * patrón estándar de importación multi-variante (igual que Shopify/VTEX).
 */
@Injectable()
export class PlantillaImportacionService {
  async generar(): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Productos");

    sheet.columns = COLUMNAS;
    const headerRow = sheet.getRow(1);
    headerRow.eachCell((cell) => {
      cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E3A8A" } };
    });
    headerRow.height = 20;

    // Filas de ejemplo — un producto con 2 variantes, para que quede
    // clarísimo el patrón "mismo código, filas repetidas por variante".
    sheet.addRow({
      codigo: "CAM-001",
      nombre: "Camisa Polo Clásica",
      categoria: "Camisas",
      marca: "Genérica",
      descripcion: "Camisa polo 100% algodón",
      talla: "M",
      color: "Azul",
      sku: "CAM-001-M-AZUL",
      stock: 15,
      stockMinimo: 5,
      costoCompra: 35000,
      precioVenta: 69900,
      precioMayorista: 55000,
      iva: 19,
    });
    sheet.addRow({
      codigo: "CAM-001",
      nombre: "Camisa Polo Clásica",
      categoria: "Camisas",
      marca: "Genérica",
      descripcion: "Camisa polo 100% algodón",
      talla: "L",
      color: "Azul",
      sku: "CAM-001-L-AZUL",
      stock: 10,
      stockMinimo: 5,
      costoCompra: 35000,
      precioVenta: 69900,
      precioMayorista: 55000,
      iva: 19,
    });

    sheet.getColumn("stock").numFmt = "#,##0";
    sheet.getColumn("costoCompra").numFmt = '"$"#,##0';
    sheet.getColumn("precioVenta").numFmt = '"$"#,##0';
    sheet.getColumn("precioMayorista").numFmt = '"$"#,##0';

    sheet.autoFilter = { from: "A1", to: "N1" };
    sheet.views = [{ state: "frozen", ySplit: 1 }];

    // Hoja de instrucciones — evita el ida-y-vuelta de soporte explicando el formato.
    const instrucciones = workbook.addWorksheet("Instrucciones");
    instrucciones.columns = [{ width: 90 }];
    const lineas = [
      "CÓMO LLENAR ESTA PLANTILLA",
      "",
      "1. Los campos marcados con * son obligatorios.",
      "2. Un producto con varias tallas/colores = varias filas con el mismo 'Código producto'.",
      "3. El SKU debe ser único en todo el sistema — nunca repetir un SKU entre filas.",
      "4. Si la categoría o marca no existe todavía, se crea automáticamente.",
      "5. No borres ni renombres los encabezados de la fila 1.",
      "6. Borra las filas de ejemplo antes de subir tu archivo real.",
    ];
    lineas.forEach((linea, i) => {
      const cell = instrucciones.getCell(i + 1, 1);
      cell.value = linea;
      if (i === 0) cell.font = { bold: true, size: 13 };
    });

    const arrayBuffer = await workbook.xlsx.writeBuffer();
    return Buffer.from(arrayBuffer);
  }
}
