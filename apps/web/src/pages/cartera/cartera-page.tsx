import { useState } from "react";
import { AlertTriangle, DollarSign, Clock } from "lucide-react";
import { useResumenCartera, useCuentasPorCobrar, type CuentaPorCobrar } from "./use-cartera";
import { CuentaDrawer } from "./components/cuenta-drawer";
import { cn } from "@/lib/utils";

function money(n: number | string) {
  return Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

const ESTADO_LABEL: Record<string, { label: string; className: string }> = {
  PENDIENTE: { label: "Pendiente", className: "bg-muted text-muted-foreground" },
  PAGADA_PARCIAL: { label: "Abono parcial", className: "bg-primary/10 text-primary" },
  PAGADA: { label: "Pagada", className: "bg-success/10 text-success" },
  VENCIDA: { label: "Vencida", className: "bg-destructive/10 text-destructive" },
};

export default function CarteraPage() {
  const { data: resumen } = useResumenCartera();
  const [estado, setEstado] = useState<string | undefined>();
  const { data, isLoading } = useCuentasPorCobrar({ page: 1, limit: 50, estado });
  const [seleccionada, setSeleccionada] = useState<CuentaPorCobrar | null>(null);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Cartera de clientes</h1>
        <p className="text-sm text-muted-foreground">Ventas a crédito pendientes de cobro.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Total por cobrar</span>
            <DollarSign size={15} className="text-muted-foreground" />
          </div>
          <p className="mt-1 text-xl font-semibold">{resumen ? money(resumen.totalPorCobrar) : "—"}</p>
        </div>
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Vencido</span>
            <AlertTriangle size={15} className="text-destructive" />
          </div>
          <p className="mt-1 text-xl font-semibold text-destructive">{resumen ? money(resumen.totalVencido) : "—"}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Cuentas vencidas</span>
            <Clock size={15} className="text-muted-foreground" />
          </div>
          <p className="mt-1 text-xl font-semibold">{resumen?.cuentasVencidas ?? "—"}</p>
        </div>
      </div>

      <div className="flex gap-1.5">
        {[undefined, "PENDIENTE", "PAGADA_PARCIAL", "VENCIDA", "PAGADA"].map((e) => (
          <button
            key={e ?? "todos"}
            onClick={() => setEstado(e)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              estado === e ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {e ? ESTADO_LABEL[e].label : "Todas"}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
              <th className="px-4 py-2.5 text-left font-medium">Venta</th>
              <th className="px-4 py-2.5 text-left font-medium">Vencimiento</th>
              <th className="px-4 py-2.5 text-right font-medium">Saldo</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando cartera...
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No hay cuentas por cobrar con este filtro.
                </td>
              </tr>
            )}
            {data?.data.map((c) => (
              <tr key={c.id} onClick={() => setSeleccionada(c)} className="cursor-pointer hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">
                  {c.cliente ? `${c.cliente.nombre} ${c.cliente.apellido ?? ""}` : "—"}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">#{c.venta.prefijo}{c.venta.numero}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {c.fechaVencimiento ? new Date(c.fechaVencimiento).toLocaleDateString("es-CO", { dateStyle: "short" }) : "—"}
                </td>
                <td className="px-4 py-2.5 text-right font-medium">{money(c.saldo)}</td>
                <td className="px-4 py-2.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ESTADO_LABEL[c.estado].className)}>
                    {ESTADO_LABEL[c.estado].label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CuentaDrawer cuenta={seleccionada} onClose={() => setSeleccionada(null)} />
    </div>
  );
}
