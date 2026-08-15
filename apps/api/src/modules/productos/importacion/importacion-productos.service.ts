import { Injectable } from "@nestjs/common";
import ExcelJS from "exceljs";
import { PrismaService } from "../../../database/prisma.service";
import { AuditService } from "../../../common/services/audit.service";

interface FilaProducto {
  fila: number;
  codigo: string;
  nombre: string;
  categoria?: string;
  marca?: string;
  descripcion?: string;
  talla: string;
  color: string;
  sku: string;
  stock: number;
  stockMinimo: number;
  costoCompra: number;
  precioVenta: number;
  precioMayorista?: number;
  iva: number;
}

interface ErrorFila {
  fila: number;
  mensaje: string;
}

interface RequestContext {
  empresaId: string;
  sucursalId: string;
  usuarioId: string;
}

const COLUMNAS_ESPERADAS = [
  "codigo",
  "nombre",
  "categoria",
  "marca",
  "descripcion",
  "talla",
  "color",
  "sku",
  "stock",
  "stockMinimo",
  "costoCompra",
  "precioVenta",
  "precioMayorista",
  "iva",
] as const;

@Injectable()
export class ImportacionProductosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /** Lee el archivo y valida cada fila SIN tocar la base de datos todavía (dry-run). */
  async validar(buffer: Buffer, ctx: RequestContext): Promise<{ filas: FilaProducto[]; errores: ErrorFila[] }> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error("El archivo no tiene ninguna hoja de datos.");

    const errores: ErrorFila[] = [];
    const filas: FilaProducto[] = [];
    const skusEnArchivo = new Set<string>();

    // Mapea encabezados de la fila 1 a las claves esperadas por posición de columna.
    const headerRow = sheet.getRow(1);
    const columnaPorClave = new Map<(typeof COLUMNAS_ESPERADAS)[number], number>();
    const CLAVE_POR_HEADER: Record<string, (typeof COLUMNAS_ESPERADAS)[number]> = {
      "código producto*": "codigo",
      "nombre*": "nombre",
      categoría: "categoria",
      marca: "marca",
      descripción: "descripcion",
      "talla*": "talla",
      "color*": "color",
      "sku*": "sku",
      "stock*": "stock",
      "stock mínimo": "stockMinimo",
      "costo compra*": "costoCompra",
      "precio venta*": "precioVenta",
      "precio mayorista": "precioMayorista",
      "iva %": "iva",
    };
    headerRow.eachCell((cell, colNumber) => {
      const clave = CLAVE_POR_HEADER[String(cell.value).toLowerCase().trim()];
      if (clave) columnaPorClave.set(clave, colNumber);
    });

    if (!columnaPorClave.has("codigo") || !columnaPorClave.has("sku")) {
      throw new Error(
        "El archivo no tiene el formato esperado. Descarga la plantilla oficial y no modifiques los encabezados.",
      );
    }

    const leer = (row: ExcelJS.Row, clave: (typeof COLUMNAS_ESPERADAS)[number]): string => {
      const col = columnaPorClave.get(clave);
      if (!col) return "";
      const valor = row.getCell(col).value;
      return valor === null || valor === undefined ? "" : String(valor).trim();
    };

    sheet.eachRow((row, numeroFila) => {
      if (numeroFila === 1) return; // encabezado
      const codigo = leer(row, "codigo");
      if (!codigo) return; // fila vacía, se ignora silenciosamente

      const nombre = leer(row, "nombre");
      const talla = leer(row, "talla");
      const color = leer(row, "color");
      const sku = leer(row, "sku");
      const stockTxt = leer(row, "stock");
      const costoTxt = leer(row, "costoCompra");
      const precioTxt = leer(row, "precioVenta");

      const camposFaltantes = [
        !nombre && "Nombre",
        !talla && "Talla",
        !color && "Color",
        !sku && "SKU",
        !stockTxt && "Stock",
        !costoTxt && "Costo compra",
        !precioTxt && "Precio venta",
      ].filter(Boolean);

      if (camposFaltantes.length > 0) {
        errores.push({ fila: numeroFila, mensaje: `Faltan campos obligatorios: ${camposFaltantes.join(", ")}.` });
        return;
      }

      const stock = Number(stockTxt);
      const costoCompra = Number(costoTxt);
      const precioVenta = Number(precioTxt);
      if (!Number.isFinite(stock) || stock < 0) {
        errores.push({ fila: numeroFila, mensaje: `Stock inválido: "${stockTxt}".` });
        return;
      }
      if (!Number.isFinite(costoCompra) || costoCompra < 0 || !Number.isFinite(precioVenta) || precioVenta < 0) {
        errores.push({ fila: numeroFila, mensaje: "Costo o precio inválido — deben ser números positivos." });
        return;
      }

      if (skusEnArchivo.has(sku)) {
        errores.push({ fila: numeroFila, mensaje: `SKU "${sku}" duplicado dentro del mismo archivo.` });
        return;
      }
      skusEnArchivo.add(sku);

      const precioMayoristaTxt = leer(row, "precioMayorista");
      const ivaTxt = leer(row, "iva");

      filas.push({
        fila: numeroFila,
        codigo,
        nombre,
        categoria: leer(row, "categoria") || undefined,
        marca: leer(row, "marca") || undefined,
        descripcion: leer(row, "descripcion") || undefined,
        talla,
        color,
        sku,
        stock,
        stockMinimo: Number(leer(row, "stockMinimo") || 0),
        costoCompra,
        precioVenta,
        precioMayorista: precioMayoristaTxt ? Number(precioMayoristaTxt) : undefined,
        iva: ivaTxt ? Number(ivaTxt) : 19,
      });
    });

    // Verifica contra la base de datos: SKUs que ya existen en el sistema
    // (no solo duplicados dentro del archivo).
    if (filas.length > 0) {
      const skusExistentes = await this.prisma.variante.findMany({
        where: { sku: { in: filas.map((f) => f.sku) } },
        select: { sku: true },
      });
      const setExistentes = new Set(skusExistentes.map((s) => s.sku));
      for (const fila of filas) {
        if (setExistentes.has(fila.sku)) {
          errores.push({ fila: fila.fila, mensaje: `El SKU "${fila.sku}" ya existe en el sistema.` });
        }
      }
    }

    const skusConError = new Set(errores.map((e) => e.fila));
    return { filas: filas.filter((f) => !skusConError.has(f.fila)), errores };
  }

  /**
   * Ejecuta la importación fila por fila. Cada producto (agrupado por
   * código) se crea en su propia transacción corta — un error en un
   * producto nunca revierte los que ya se importaron con éxito. Es la
   * estrategia correcta para lotes grandes: una transacción gigante de
   * 500 filas sería lenta, bloquearía filas por mucho tiempo, y un solo
   * error tiraría abajo todo el trabajo previo.
   */
  async ejecutar(buffer: Buffer, ctx: RequestContext) {
    const { filas, errores } = await this.validar(buffer, ctx);

    const porCodigo = new Map<string, FilaProducto[]>();
    for (const fila of filas) {
      const grupo = porCodigo.get(fila.codigo) ?? [];
      grupo.push(fila);
      porCodigo.set(fila.codigo, grupo);
    }

    let productosCreados = 0;
    let variantesCreadas = 0;
    const erroresEjecucion: ErrorFila[] = [...errores];

    for (const [codigo, filasProducto] of porCodigo) {
      try {
        await this.prisma.$transaction(async (tx) => {
          const primera = filasProducto[0];

          const categoria = primera.categoria
            ? await tx.categoria.upsert({
                where: { empresaId_nombre_padreId: { empresaId: ctx.empresaId, nombre: primera.categoria, padreId: null as never } },
                update: {},
                create: { empresaId: ctx.empresaId, nombre: primera.categoria },
              })
            : null;

          const marca = primera.marca
            ? await tx.marca.upsert({
                where: { empresaId_nombre: { empresaId: ctx.empresaId, nombre: primera.marca } },
                update: {},
                create: { empresaId: ctx.empresaId, nombre: primera.marca },
              })
            : null;

          let producto = await tx.producto.findFirst({
            where: { empresaId: ctx.empresaId, codigo, deletedAt: null },
          });

          if (!producto) {
            producto = await tx.producto.create({
              data: {
                empresaId: ctx.empresaId,
                codigo,
                nombre: primera.nombre,
                descripcion: primera.descripcion,
                categoriaId: categoria?.id,
                marcaId: marca?.id,
              },
            });
            productosCreados++;
          }

          for (const fila of filasProducto) {
            await tx.variante.create({
              data: {
                productoId: producto.id,
                sucursalId: ctx.sucursalId,
                talla: fila.talla,
                color: fila.color,
                sku: fila.sku,
                stock: fila.stock,
                stockMinimo: fila.stockMinimo,
                costoCompra: fila.costoCompra,
                costoPromedio: fila.costoCompra,
                precioVenta: fila.precioVenta,
                precioMayorista: fila.precioMayorista,
                iva: fila.iva,
              },
            });
            variantesCreadas++;
          }
        });
      } catch (error) {
        for (const fila of filasProducto) {
          erroresEjecucion.push({
            fila: fila.fila,
            mensaje: `No se pudo crear (código "${codigo}"): ${error instanceof Error ? error.message : "error desconocido"}.`,
          });
        }
      }
    }

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "productos",
      accion: "importar",
      despues: { productosCreados, variantesCreadas, errores: erroresEjecucion.length },
      resultado: erroresEjecucion.length === 0 ? "exito" : "error",
    });

    return {
      productosCreados,
      variantesCreadas,
      totalErrores: erroresEjecucion.length,
      errores: erroresEjecucion.sort((a, b) => a.fila - b.fila),
    };
  }
}
