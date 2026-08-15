import { useState } from "react";
import { Plus } from "lucide-react";
import { useCotizaciones } from "./use-cotizaciones";
import { CotizacionDrawer } from "./components/cotizacion-drawer";
import { NuevaCotizacionModal } from "./components/nueva-cotizacion-modal";
import { cn } from "@/lib/utils";

const ESTADO_LABEL: Record<string, { label: string; className: string }> = {
  BORRADOR: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  ENVIADA: { label: "Enviada", className: "bg-primary/10 text-primary" },
  ACEPTADA: { label: "Aceptada", className: "bg-success/10 text-success" },
  RECHAZADA: { label: "Rechazada", className: "bg-destructive/10 text-destructive" },
  VENCIDA: { label: "Vencida", className: "bg-warning/10 text-warning" },
  CONVERTIDA: { label: "Convertida", className: "bg-success/10 text-success" },
};

export default function CotizacionesPage() {
  const { data, isLoading } = useCotizaciones({ page: 1, limit: 30 });
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Cotizaciones</h1>
          <p className="text-sm text-muted-foreground">Convierte una cotización aceptada directamente en venta.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} /> Nueva cotización
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Número</th>
              <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
              <th className="px-4 py-2.5 text-left font-medium">Ítems</th>
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando cotizaciones...
                </td>
              </tr>
            )}
            {data?.data.map((c) => (
              <tr key={c.id} onClick={() => setSeleccionada(c.id)} className="cursor-pointer hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">#{c.numero}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {new Date(c.createdAt).toLocaleDateString("es-CO", { dateStyle: "short" })}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{c._count?.items ?? "—"}</td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {Number(c.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ESTADO_LABEL[c.estado]?.className)}>
                    {ESTADO_LABEL[c.estado]?.label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <CotizacionDrawer id={seleccionada} onClose={() => setSeleccionada(null)} />
      <NuevaCotizacionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
