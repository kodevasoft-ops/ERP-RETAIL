import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

interface RequestContext {
  empresaId: string;
}

@Injectable()
export class FinanzasService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Utilidad bruta real: ingresos por ventas menos el costo de lo vendido,
   * calculado contra el costo promedio ACTUAL de cada variante (aproximación
   * estándar cuando no se congela costo histórico por línea de venta).
   */
  async resumen(desde: Date, hasta: Date, ctx: RequestContext) {
    const [ingresos, costoVentas, gastos, compras] = await Promise.all([
      this.prisma.venta.aggregate({
        where: { empresaId: ctx.empresaId, estado: "COMPLETADA", createdAt: { gte: desde, lte: hasta } },
        _sum: { total: true },
      }),
      this.prisma.$queryRaw<{ costo: number }[]>`
        SELECT COALESCE(SUM(vi.cantidad * va.costo_promedio), 0)::float AS costo
        FROM venta_items vi
        INNER JOIN ventas v ON v.id = vi.venta_id
        INNER JOIN variantes va ON va.id = vi.variante_id
        WHERE v.empresa_id = ${ctx.empresaId}
          AND v.estado = 'COMPLETADA'
          AND v.created_at BETWEEN ${desde} AND ${hasta}
      `,
      this.prisma.gasto.aggregate({
        where: { empresaId: ctx.empresaId, deletedAt: null, fecha: { gte: desde, lte: hasta } },
        _sum: { monto: true },
      }),
      this.prisma.ordenCompra.aggregate({
        where: {
          empresaId: ctx.empresaId,
          estado: { in: ["RECIBIDA_PARCIAL", "RECIBIDA_TOTAL"] },
          createdAt: { gte: desde, lte: hasta },
        },
        _sum: { total: true },
      }),
    ]);

    const totalIngresos = Number(ingresos._sum.total ?? 0);
    const totalCostoVentas = costoVentas[0]?.costo ?? 0;
    const utilidadBruta = totalIngresos - totalCostoVentas;
    const totalGastos = Number(gastos._sum.monto ?? 0);
    const utilidadNeta = utilidadBruta - totalGastos;

    return {
      ingresos: totalIngresos,
      costoVentas: totalCostoVentas,
      utilidadBruta,
      margenBrutoPct: totalIngresos > 0 ? utilidadBruta / totalIngresos : 0,
      gastos: totalGastos,
      comprasRecibidas: Number(compras._sum.total ?? 0),
      utilidadNeta,
      margenNetoPct: totalIngresos > 0 ? utilidadNeta / totalIngresos : 0,
    };
  }

  async flujoPorDia(desde: Date, hasta: Date, ctx: RequestContext) {
    const [ingresosDiarios, egresosDiarios] = await Promise.all([
      this.prisma.$queryRaw<{ fecha: string; ingresos: number }[]>`
        SELECT TO_CHAR(created_at, 'YYYY-MM-DD') AS fecha, SUM(total)::float AS ingresos
        FROM ventas
        WHERE empresa_id = ${ctx.empresaId} AND estado = 'COMPLETADA'
          AND created_at BETWEEN ${desde} AND ${hasta}
        GROUP BY 1
      `,
      this.prisma.$queryRaw<{ fecha: string; egresos: number }[]>`
        SELECT TO_CHAR(fecha, 'YYYY-MM-DD') AS fecha, SUM(monto)::float AS egresos
        FROM gastos
        WHERE empresa_id = ${ctx.empresaId} AND deleted_at IS NULL
          AND fecha BETWEEN ${desde} AND ${hasta}
        GROUP BY 1
      `,
    ]);

    const mapa = new Map<string, { fecha: string; ingresos: number; egresos: number }>();
    for (const i of ingresosDiarios) mapa.set(i.fecha, { fecha: i.fecha, ingresos: i.ingresos, egresos: 0 });
    for (const e of egresosDiarios) {
      const existente = mapa.get(e.fecha);
      if (existente) existente.egresos = e.egresos;
      else mapa.set(e.fecha, { fecha: e.fecha, ingresos: 0, egresos: e.egresos });
    }

    return Array.from(mapa.values())
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .map((d) => ({ ...d, neto: d.ingresos - d.egresos }));
  }
}
