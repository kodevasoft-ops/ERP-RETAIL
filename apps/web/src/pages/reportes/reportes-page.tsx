import { useState } from "react";
import { TrendingUp, DollarSign, AlertTriangle } from "lucide-react";
import {
  useDashboardResumen,
  useVentasPorDia,
  useVentasPorVendedor,
  useVentasPorCategoria,
  useTopProductos,
  useTopClientes,
  useInventarioValorizado,
} from "./use-reportes";
import { BarChart } from "./components/bar-chart";
import { ReportCard } from "./components/report-card";

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}
function hace30Dias() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function ReportesPage() {
  const [desde, setDesde] = useState(hace30Dias());
  const [hasta, setHasta] = useState(hoy());
  const rango = { desde, hasta };

  const { data: resumen } = useDashboardResumen();
  const { data: ventasDia, isLoading: cargandoDia } = useVentasPorDia(rango);
  const { data: porVendedor, isLoading: cargandoVendedor } = useVentasPorVendedor(rango);
  const { data: porCategoria, isLoading: cargandoCategoria } = useVentasPorCategoria(rango);
  const { data: topProductos, isLoading: cargandoTop } = useTopProductos(rango);
  const { data: topClientes, isLoading: cargandoClientes } = useTopClientes(rango);
  const { data: inventario, isLoading: cargandoInventario } = useInventarioValorizado();

  const valorInventarioTotal = inventario?.reduce((s, i) => s + i.valor_total, 0) ?? 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Reportes</h1>
          <p className="text-sm text-muted-foreground">Exporta cualquier reporte a Excel o PDF con un clic.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary" />
          <span className="text-muted-foreground">a</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      {/* KPIs en vivo */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Ventas de hoy</span>
            <DollarSign size={15} className="text-muted-foreground" />
          </div>
          <p className="mt-1 text-xl font-semibold">{resumen ? money(resumen.ventasHoy.total) : "—"}</p>
          <p className="text-xs text-muted-foreground">{resumen?.ventasHoy.cantidad ?? 0} transacciones</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Ventas del mes</span>
            <TrendingUp size={15} className="text-muted-foreground" />
          </div>
          <p className="mt-1 text-xl font-semibold">{resumen ? money(resumen.ventasMes.total) : "—"}</p>
          <p className="text-xs text-muted-foreground">{resumen?.ventasMes.cantidad ?? 0} transacciones</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Productos con stock bajo</span>
            <AlertTriangle size={15} className="text-warning" />
          </div>
          <p className="mt-1 text-xl font-semibold">{resumen?.productosStockBajo ?? "—"}</p>
          <p className="text-xs text-muted-foreground">variantes bajo el mínimo</p>
        </div>
      </div>

      {/* Ventas por día */}
      <ReportCard titulo="Ventas por día" endpoint="/reportes/ventas-por-dia" params={rango}>
        {cargandoDia ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <BarChart
            datos={(ventasDia ?? []).map((d) => ({ label: d.fecha.slice(5), valor: d.total_ventas }))}
            formatoValor={money}
          />
        )}
      </ReportCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportCard titulo="Ventas por vendedor" endpoint="/reportes/ventas-por-vendedor" params={rango}>
          <SimpleTable
            loading={cargandoVendedor}
            columnas={["Vendedor", "Ventas", "Total"]}
            filas={(porVendedor ?? []).map((v) => [v.nombre, v.cantidad_ventas, money(v.total_ventas)])}
          />
        </ReportCard>

        <ReportCard titulo="Ventas por categoría">
          <SimpleTable
            loading={cargandoCategoria}
            columnas={["Categoría", "Unidades", "Total"]}
            filas={(porCategoria ?? []).map((c) => [c.categoria, c.unidades, money(c.total_ventas)])}
          />
        </ReportCard>

        <ReportCard titulo="Productos más vendidos" endpoint="/reportes/top-productos" params={rango}>
          <SimpleTable
            loading={cargandoTop}
            columnas={["Producto", "Unidades", "Total"]}
            filas={(topProductos ?? []).slice(0, 10).map((p) => [p.producto, p.unidades, money(p.total_ventas)])}
          />
        </ReportCard>

        <ReportCard titulo="Mejores clientes" endpoint="/reportes/top-clientes" params={rango}>
          <SimpleTable
            loading={cargandoClientes}
            columnas={["Cliente", "Compras", "Total"]}
            filas={(topClientes ?? []).slice(0, 10).map((c) => [c.cliente, c.compras, money(c.total_compras)])}
          />
        </ReportCard>
      </div>

      <ReportCard titulo={`Inventario valorizado · Total: ${money(valorInventarioTotal)}`} endpoint="/reportes/inventario-valorizado">
        <SimpleTable
          loading={cargandoInventario}
          columnas={["Producto", "Talla/Color", "SKU", "Stock", "Valor"]}
          filas={(inventario ?? []).slice(0, 15).map((i) => [
            i.producto,
            `${i.talla}/${i.color}`,
            i.sku,
            i.stock,
            money(i.valor_total),
          ])}
        />
        {inventario && inventario.length > 15 && (
          <p className="mt-2 text-xs text-muted-foreground">
            Mostrando 15 de {inventario.length} variantes — exporta a Excel o PDF para ver el listado completo.
          </p>
        )}
      </ReportCard>
    </div>
  );
}

function SimpleTable({ columnas, filas, loading }: { columnas: string[]; filas: (string | number)[][]; loading?: boolean }) {
  if (loading) return <p className="text-sm text-muted-foreground">Cargando...</p>;
  if (filas.length === 0) return <p className="text-sm text-muted-foreground">Sin datos en el rango seleccionado.</p>;

  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="border-b border-border text-xs text-muted-foreground">
          {columnas.map((c, i) => (
            <th key={i} className={`py-1.5 font-medium ${i === columnas.length - 1 ? "text-right" : "text-left"}`}>
              {c}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="divide-y divide-border">
        {filas.map((fila, i) => (
          <tr key={i}>
            {fila.map((valor, j) => (
              <td key={j} className={`py-1.5 ${j === fila.length - 1 ? "text-right font-medium" : "text-muted-foreground"}`}>
                {valor}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
