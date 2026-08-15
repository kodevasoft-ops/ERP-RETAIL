import { useState } from "react";
import { TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { useResumenFinanciero, useFlujoCaja, useGastosPorCategoria } from "./use-finanzas";
import { BarChart } from "@/pages/reportes/components/bar-chart";
import { ReportCard } from "@/pages/reportes/components/report-card";
import { cn } from "@/lib/utils";

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}
function hoy() {
  return new Date().toISOString().slice(0, 10);
}
function hace30Dias() {
  return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function FinanzasPage() {
  const [desde, setDesde] = useState(hace30Dias());
  const [hasta, setHasta] = useState(hoy());
  const rango = { desde, hasta };

  const { data: resumen, isLoading } = useResumenFinanciero(rango);
  const { data: flujo, isLoading: cargandoFlujo } = useFlujoCaja(rango);
  const { data: gastosCategoria } = useGastosPorCategoria(rango);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Finanzas</h1>
          <p className="text-sm text-muted-foreground">Utilidad real: ingresos menos costo de venta y gastos operativos.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary" />
          <span className="text-muted-foreground">a</span>
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="rounded-md border border-border bg-background px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="Ingresos" valor={resumen?.ingresos} icon={DollarSign} loading={isLoading} />
        <Kpi label="Costo de venta" valor={resumen?.costoVentas} icon={TrendingDown} loading={isLoading} negativo />
        <Kpi
          label="Utilidad bruta"
          valor={resumen?.utilidadBruta}
          sublabel={resumen ? `${(resumen.margenBrutoPct * 100).toFixed(1)}% margen` : undefined}
          icon={TrendingUp}
          loading={isLoading}
        />
        <Kpi
          label="Utilidad neta"
          valor={resumen?.utilidadNeta}
          sublabel={resumen ? `${(resumen.margenNetoPct * 100).toFixed(1)}% margen` : undefined}
          icon={Percent}
          loading={isLoading}
          destacado
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Gastos operativos</p>
          <p className="mt-1 text-lg font-semibold">{resumen ? money(resumen.gastos) : "—"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground">Compras recibidas (inventario)</p>
          <p className="mt-1 text-lg font-semibold">{resumen ? money(resumen.comprasRecibidas) : "—"}</p>
        </div>
      </div>

      <ReportCard titulo="Flujo de caja diario" endpoint="/finanzas/flujo-caja" params={rango}>
        {cargandoFlujo ? (
          <p className="text-sm text-muted-foreground">Cargando...</p>
        ) : (
          <BarChart datos={(flujo ?? []).map((f) => ({ label: f.fecha.slice(5), valor: f.neto }))} formatoValor={money} />
        )}
      </ReportCard>

      {gastosCategoria && gastosCategoria.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-medium">Gastos por categoría</h3>
          <div className="space-y-2">
            {gastosCategoria.map((g) => {
              const max = Math.max(...gastosCategoria.map((x) => x.total));
              return (
                <div key={g.categoria} className="flex items-center gap-3 text-sm">
                  <span className="w-28 shrink-0 text-muted-foreground">{g.categoria}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${(g.total / max) * 100}%` }} />
                  </div>
                  <span className="w-28 shrink-0 text-right font-medium">{money(g.total)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function Kpi({
  label,
  valor,
  sublabel,
  icon: Icon,
  loading,
  negativo,
  destacado,
}: {
  label: string;
  valor?: number;
  sublabel?: string;
  icon: typeof DollarSign;
  loading?: boolean;
  negativo?: boolean;
  destacado?: boolean;
}) {
  return (
    <div className={cn("rounded-lg border p-4", destacado ? "border-primary bg-primary/5" : "border-border bg-card")}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <Icon size={15} className={negativo ? "text-destructive" : "text-muted-foreground"} />
      </div>
      <p className={cn("mt-1 text-xl font-semibold", negativo && "text-destructive")}>
        {loading ? "—" : money(valor ?? 0)}
      </p>
      {sublabel && <p className="text-xs text-muted-foreground">{sublabel}</p>}
    </div>
  );
}
