import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";

interface ItemFactura {
  producto: string;
  variante: string;
  cantidad: number;
  precioUnitario: number;
  descuentoPorcentaje: number;
  ivaPorcentaje: number;
  total: number;
}

interface DatosFactura {
  empresa: { nombre: string; nit: string };
  numero: string;
  fecha: Date;
  cliente?: { nombre: string; documento: string } | null;
  vendedor: string;
  items: ItemFactura[];
  subtotal: number;
  descuentoTotal: number;
  ivaTotal: number;
  total: number;
  pagos: { metodo: string; monto: number }[];
  estado: "COMPLETADA" | "ANULADA";
  motivoAnulacion?: string | null;
  /** "FACTURA" (default) o "NOTA_CREDITO" — cambia el título y omite la sección de pagos. */
  tipoDocumento?: "FACTURA" | "NOTA_CREDITO";
  facturaOrigenNumero?: string;
}

const COLOR_PRIMARIO = "#1E3A8A";
const COLOR_TEXTO = "#1A1A1A";
const COLOR_MUTED = "#6B7280";
const MARGEN = 45;

const METODO_PAGO_LABEL: Record<string, string> = {
  EFECTIVO: "Efectivo",
  TARJETA_CREDITO: "Tarjeta de crédito",
  TARJETA_DEBITO: "Tarjeta de débito",
  TRANSFERENCIA: "Transferencia",
  CREDITO: "Crédito",
  BONO: "Bono",
  PUNTOS: "Puntos de fidelización",
};

function money(n: number) {
  return `$${n.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;
}

@Injectable()
export class FacturaPdfService {
  async generar(datos: DatosFactura): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: "A4", margin: MARGEN, bufferPages: true });
      const chunks: Buffer[] = [];
      doc.on("data", (c) => chunks.push(c));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      const anchoUtil = doc.page.width - MARGEN * 2;
      let y = MARGEN;

      // ---- Encabezado ----
      doc.fontSize(18).fillColor(COLOR_TEXTO).font("Helvetica-Bold").text(datos.empresa.nombre, MARGEN, y);
      doc.fontSize(9).fillColor(COLOR_MUTED).font("Helvetica").text(`NIT: ${datos.empresa.nit}`, MARGEN, y + 22);

      doc
        .fontSize(14)
        .fillColor(COLOR_PRIMARIO)
        .font("Helvetica-Bold")
        .text(
          datos.tipoDocumento === "NOTA_CREDITO"
            ? `Nota crédito #${datos.numero}`
            : `Factura de venta #${datos.numero}`,
          MARGEN,
          y,
          { width: anchoUtil, align: "right" },
        );
      doc
        .fontSize(9)
        .fillColor(COLOR_MUTED)
        .font("Helvetica")
        .text(datos.fecha.toLocaleString("es-CO", { dateStyle: "long", timeStyle: "short" }), MARGEN, y + 20, {
          width: anchoUtil,
          align: "right",
        });

      if (datos.estado === "ANULADA") {
        doc
          .fontSize(28)
          .fillColor("#DC2626")
          .font("Helvetica-Bold")
          .opacity(0.15)
          .text("ANULADA", MARGEN, y + 60, { width: anchoUtil, align: "center" })
          .opacity(1);
      }

      y += 55;
      doc.moveTo(MARGEN, y).lineTo(MARGEN + anchoUtil, y).strokeColor("#E5E7EB").stroke();
      y += 12;

      // ---- Cliente / vendedor ----
      doc.fontSize(9).fillColor(COLOR_MUTED).font("Helvetica").text("Cliente", MARGEN, y);
      doc
        .fontSize(10)
        .fillColor(COLOR_TEXTO)
        .font("Helvetica-Bold")
        .text(datos.cliente ? `${datos.cliente.nombre} · ${datos.cliente.documento}` : "Cliente ocasional", MARGEN, y + 12);

      doc
        .fontSize(9)
        .fillColor(COLOR_MUTED)
        .font("Helvetica")
        .text("Vendedor", MARGEN, y, { width: anchoUtil, align: "right" });
      doc
        .fontSize(10)
        .fillColor(COLOR_TEXTO)
        .font("Helvetica-Bold")
        .text(datos.vendedor, MARGEN, y + 12, { width: anchoUtil, align: "right" });

      y += 40;

      if (datos.tipoDocumento === "NOTA_CREDITO" && datos.facturaOrigenNumero) {
        doc
          .fontSize(9)
          .fillColor(COLOR_MUTED)
          .font("Helvetica")
          .text(`Referencia: reversa de la factura #${datos.facturaOrigenNumero}`, MARGEN, y);
        y += 18;
      }

      // ---- Tabla de ítems ----
      const columnas = [
        { header: "Producto", w: 0.4 },
        { header: "Cant.", w: 0.1 },
        { header: "Precio unit.", w: 0.16 },
        { header: "Desc.", w: 0.1 },
        { header: "IVA", w: 0.08 },
        { header: "Total", w: 0.16 },
      ];

      const dibujarEncabezado = () => {
        doc.rect(MARGEN, y, anchoUtil, 20).fill(COLOR_PRIMARIO);
        let x = MARGEN;
        doc.fontSize(8).fillColor("#FFFFFF").font("Helvetica-Bold");
        for (const col of columnas) {
          doc.text(col.header, x + 4, y + 6, { width: col.w * anchoUtil - 8, align: col.header === "Producto" ? "left" : "right" });
          x += col.w * anchoUtil;
        }
        y += 20;
      };

      dibujarEncabezado();
      doc.font("Helvetica").fontSize(8.5);

      datos.items.forEach((item, idx) => {
        if (y > doc.page.height - MARGEN - 120) {
          doc.addPage();
          y = MARGEN;
          dibujarEncabezado();
          doc.font("Helvetica").fontSize(8.5);
        }

        if (idx % 2 === 1) doc.rect(MARGEN, y, anchoUtil, 22).fill("#F9FAFB");

        let x = MARGEN;
        doc.fillColor(COLOR_TEXTO);
        doc.text(`${item.producto}  (${item.variante})`, x + 4, y + 6, { width: columnas[0].w * anchoUtil - 8 });
        x += columnas[0].w * anchoUtil;
        doc.text(String(item.cantidad), x + 4, y + 6, { width: columnas[1].w * anchoUtil - 8, align: "right" });
        x += columnas[1].w * anchoUtil;
        doc.text(money(item.precioUnitario), x + 4, y + 6, { width: columnas[2].w * anchoUtil - 8, align: "right" });
        x += columnas[2].w * anchoUtil;
        doc.text(item.descuentoPorcentaje > 0 ? `${item.descuentoPorcentaje}%` : "—", x + 4, y + 6, {
          width: columnas[3].w * anchoUtil - 8,
          align: "right",
        });
        x += columnas[3].w * anchoUtil;
        doc.text(`${item.ivaPorcentaje}%`, x + 4, y + 6, { width: columnas[4].w * anchoUtil - 8, align: "right" });
        x += columnas[4].w * anchoUtil;
        doc.font("Helvetica-Bold").text(money(item.total), x + 4, y + 6, { width: columnas[5].w * anchoUtil - 8, align: "right" });
        doc.font("Helvetica");

        y += 22;
      });

      // ---- Totales ----
      y += 8;
      const anchoTotales = 200;
      const xTotales = MARGEN + anchoUtil - anchoTotales;

      const filaTotal = (label: string, valor: string, negrita = false) => {
        doc
          .fontSize(negrita ? 11 : 9)
          .fillColor(negrita ? COLOR_TEXTO : COLOR_MUTED)
          .font(negrita ? "Helvetica-Bold" : "Helvetica")
          .text(label, xTotales, y, { width: anchoTotales * 0.5 })
          .text(valor, xTotales + anchoTotales * 0.5, y, { width: anchoTotales * 0.5, align: "right" });
        y += negrita ? 18 : 14;
      };

      filaTotal("Subtotal", money(datos.subtotal));
      if (datos.descuentoTotal > 0) filaTotal("Descuento", `-${money(datos.descuentoTotal)}`);
      filaTotal("IVA", money(datos.ivaTotal));
      doc.moveTo(xTotales, y).lineTo(xTotales + anchoTotales, y).strokeColor("#E5E7EB").stroke();
      y += 6;
      filaTotal("Total", money(datos.total), true);

      // ---- Métodos de pago (no aplica a Nota Crédito) ----
      if (datos.tipoDocumento !== "NOTA_CREDITO") {
        y += 10;
        doc.fontSize(9).fillColor(COLOR_MUTED).font("Helvetica").text("Pagado con:", MARGEN, y);
        y += 14;
        for (const pago of datos.pagos) {
          doc
            .fontSize(9)
            .fillColor(COLOR_TEXTO)
            .text(`${METODO_PAGO_LABEL[pago.metodo] ?? pago.metodo}: ${money(pago.monto)}`, MARGEN, y);
          y += 13;
        }
      }

      if ((datos.estado === "ANULADA" || datos.tipoDocumento === "NOTA_CREDITO") && datos.motivoAnulacion) {
        y += 10;
        doc
          .fontSize(9)
          .fillColor("#DC2626")
          .font("Helvetica-Bold")
          .text(
            datos.tipoDocumento === "NOTA_CREDITO"
              ? `Motivo: ${datos.motivoAnulacion}`
              : `Venta anulada — Motivo: ${datos.motivoAnulacion}`,
            MARGEN,
            y,
            { width: anchoUtil },
          );
      }

      // ---- Pie de página ----
      const paginas = doc.bufferedPageRange();
      for (let i = 0; i < paginas.count; i++) {
        doc.switchToPage(i);
        doc
          .fontSize(7)
          .fillColor(COLOR_MUTED)
          .text(
            `${datos.empresa.nombre} · Documento generado electrónicamente · Página ${i + 1} de ${paginas.count}`,
            MARGEN,
            doc.page.height - MARGEN + 10,
            { width: anchoUtil, align: "center" },
          );
      }

      doc.end();
    });
  }
}
