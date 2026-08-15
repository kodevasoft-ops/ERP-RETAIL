import { Inject, Injectable } from "@nestjs/common";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import type { Cache } from "cache-manager";
import { PrismaService } from "../../database/prisma.service";

interface RequestContext {
  empresaId: string;
}

@Injectable()
export class ReportesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private readonly cache: Cache,
  ) {}

  async ventasPorDia(desde: Date, hasta: Date, ctx: RequestContext) {
    return this.prisma.$queryRaw<{ fecha: string; total_ventas: number; cantidad_ventas: number }[]>`
      SELECT
        TO_CHAR(v.created_at, 'YYYY-MM-DD') AS fecha,
        SUM(v.total)::float AS total_ventas,
        COUNT(*)::int AS cantidad_ventas
      FROM ventas v
      WHERE v.empresa_id = ${ctx.empresaId}
        AND v.estado = 'COMPLETADA'
        AND v.created_at BETWEEN ${desde} AND ${hasta}
      GROUP BY 1
      ORDER BY 1 ASC
    `;
  }

  async ventasPorVendedor(desde: Date, hasta: Date, ctx: RequestContext) {
    return this.prisma.$queryRaw<{ vendedor_id: string; nombre: string; total_ventas: number; cantidad_ventas: number }[]>`
      SELECT
        v.vendedor_id,
        COALESCE(u.nombre || ' ' || u.apellido, 'Desconocido') AS nombre,
        SUM(v.total)::float AS total_ventas,
        COUNT(*)::int AS cantidad_ventas
      FROM ventas v
      LEFT JOIN usuarios u ON u.id = v.vendedor_id
      WHERE v.empresa_id = ${ctx.empresaId}
        AND v.estado = 'COMPLETADA'
        AND v.created_at BETWEEN ${desde} AND ${hasta}
      GROUP BY v.vendedor_id, u.nombre, u.apellido
      ORDER BY total_ventas DESC
    `;
  }

  async ventasPorCategoria(desde: Date, hasta: Date, ctx: RequestContext) {
    return this.prisma.$queryRaw<{ categoria: string; total_ventas: number; unidades: number }[]>`
      SELECT
        COALESCE(c.nombre, 'Sin categoría') AS categoria,
        SUM(vi.total)::float AS total_ventas,
        SUM(vi.cantidad)::int AS unidades
      FROM venta_items vi
      INNER JOIN ventas v ON v.id = vi.venta_id
      INNER JOIN variantes va ON va.id = vi.variante_id
      INNER JOIN productos p ON p.id = va.producto_id
      LEFT JOIN categorias c ON c.id = p.categoria_id
      WHERE v.empresa_id = ${ctx.empresaId}
        AND v.estado = 'COMPLETADA'
        AND v.created_at BETWEEN ${desde} AND ${hasta}
      GROUP BY c.nombre
      ORDER BY total_ventas DESC
    `;
  }

  async topProductos(desde: Date, hasta: Date, ctx: RequestContext, limit = 20) {
    return this.prisma.$queryRaw<{ producto: string; unidades: number; total_ventas: number }[]>`
      SELECT
        p.nombre AS producto,
        SUM(vi.cantidad)::int AS unidades,
        SUM(vi.total)::float AS total_ventas
      FROM venta_items vi
      INNER JOIN ventas v ON v.id = vi.venta_id
      INNER JOIN variantes va ON va.id = vi.variante_id
      INNER JOIN productos p ON p.id = va.producto_id
      WHERE v.empresa_id = ${ctx.empresaId}
        AND v.estado = 'COMPLETADA'
        AND v.created_at BETWEEN ${desde} AND ${hasta}
      GROUP BY p.id, p.nombre
      ORDER BY total_ventas DESC
      LIMIT ${limit}
    `;
  }

  async topClientes(desde: Date, hasta: Date, ctx: RequestContext, limit = 20) {
    return this.prisma.$queryRaw<{ cliente: string; compras: number; total_compras: number }[]>`
      SELECT
        COALESCE(c.nombre || ' ' || COALESCE(c.apellido, ''), 'Cliente ocasional') AS cliente,
        COUNT(v.id)::int AS compras,
        SUM(v.total)::float AS total_compras
      FROM ventas v
      LEFT JOIN clientes c ON c.id = v.cliente_id
      WHERE v.empresa_id = ${ctx.empresaId}
        AND v.estado = 'COMPLETADA'
        AND v.created_at BETWEEN ${desde} AND ${hasta}
      GROUP BY c.id, c.nombre, c.apellido
      ORDER BY total_compras DESC
      LIMIT ${limit}
    `;
  }

  async inventarioValorizado(ctx: RequestContext) {
    return this.prisma.$queryRaw<
      { producto: string; talla: string; color: string; sku: string; stock: number; costo_promedio: number; valor_total: number }[]
    >`
      SELECT
        p.nombre AS producto,
        va.talla,
        va.color,
        va.sku,
        va.stock,
        va.costo_promedio::float AS costo_promedio,
        (va.stock * va.costo_promedio)::float AS valor_total
      FROM variantes va
      INNER JOIN productos p ON p.id = va.producto_id
      WHERE p.empresa_id = ${ctx.empresaId}
        AND va.deleted_at IS NULL
        AND va.stock > 0
      ORDER BY valor_total DESC
    `;
  }

  async resumenDashboard(ctx: RequestContext) {
    // Llave SIEMPRE prefijada con empresaId — el CacheInterceptor genérico
    // de Nest cachea por URL y filtraría datos entre tenants; aquí el
    // aislamiento multi-empresa es explícito e imposible de omitir por error.
    const cacheKey = `dashboard:${ctx.empresaId}`;
    const cacheado = await this.cache.get(cacheKey);
    if (cacheado) return cacheado;

    const inicioMes = new Date();
    inicioMes.setDate(1);
    inicioMes.setHours(0, 0, 0, 0);
    const inicioHoy = new Date();
    inicioHoy.setHours(0, 0, 0, 0);

    const [ventasHoy, ventasMes, stockBajo] = await Promise.all([
      this.prisma.venta.aggregate({
        where: { empresaId: ctx.empresaId, estado: "COMPLETADA", createdAt: { gte: inicioHoy } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.venta.aggregate({
        where: { empresaId: ctx.empresaId, estado: "COMPLETADA", createdAt: { gte: inicioMes } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) FROM variantes v
        INNER JOIN productos p ON p.id = v.producto_id
        WHERE p.empresa_id = ${ctx.empresaId} AND v.deleted_at IS NULL AND v.stock <= v.stock_minimo
      `,
    ]);

    const resultado = {
      ventasHoy: { total: Number(ventasHoy._sum.total ?? 0), cantidad: ventasHoy._count },
      ventasMes: { total: Number(ventasMes._sum.total ?? 0), cantidad: ventasMes._count },
      productosStockBajo: Number(stockBajo[0]?.count ?? 0),
    };

    await this.cache.set(cacheKey, resultado, 15_000);
    return resultado;
  }
}
