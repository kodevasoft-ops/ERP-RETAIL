import { useState } from "react";
import { Plus } from "lucide-react";
import { useGarantias, useActualizarEstadoGarantia, type EstadoGarantia, type Garantia } from "./use-garantias";
import { NuevaGarantiaModal } from "./components/nueva-garantia-modal";
import { cn } from "@/lib/utils";

const COLUMNAS: { estado: EstadoGarantia; label: string; siguientes: EstadoGarantia[] }[] = [
  { estado: "RECIBIDO", label: "Recibido", siguientes: ["EN_REVISION", "RECHAZADO"] },
  { estado: "EN_REVISION", label: "En revisión", siguientes: ["ENVIADO_PROVEEDOR", "APROBADO", "RECHAZADO"] },
  { estado: "ENVIADO_PROVEEDOR", label: "Con proveedor", siguientes: ["APROBADO", "RECHAZADO"] },
  { estado: "APROBADO", label: "Aprobado", siguientes: ["ENTREGADO"] },
  { estado: "RECHAZADO", label: "Rechazado", siguientes: ["ENTREGADO"] },
  { estado: "ENTREGADO", label: "Entregado", siguientes: [] },
];

const ESTADO_LABEL: Record<string, string> = Object.fromEntries(COLUMNAS.map((c) => [c.estado, c.label]));

export default function GarantiasPage() {
  const { data, isLoading } = useGarantias({ page: 1, limit: 100 });
  const actualizar = useActualizarEstadoGarantia();
  const [modalOpen, setModalOpen] = useState(false);

  const porEstado = (estado: EstadoGarantia) => data?.data.filter((g) => g.estado === estado) ?? [];

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Garantías</h1>
          <p className="text-sm text-muted-foreground">Seguimiento de casos por estado.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} /> Nuevo caso
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {COLUMNAS.map((col) => (
            <div key={col.estado} className="flex w-64 shrink-0 flex-col rounded-lg border border-border bg-muted/30">
              <div className="px-3 py-2.5 text-xs font-medium">
                {col.label} <span className="text-muted-foreground">({porEstado(col.estado).length})</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
                {porEstado(col.estado).map((g) => (
                  <GarantiaCard
                    key={g.id}
                    garantia={g}
                    siguientes={col.siguientes}
                    onAvanzar={(estado) => actualizar.mutate({ id: g.id, estado, version: g.version })}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <NuevaGarantiaModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function GarantiaCard({
  garantia,
  siguientes,
  onAvanzar,
}: {
  garantia: Garantia;
  siguientes: EstadoGarantia[];
  onAvanzar: (estado: EstadoGarantia) => void;
}) {
  return (
    <div className="rounded-md border border-border bg-card p-3 text-sm">
      <p className="line-clamp-2 text-xs text-muted-foreground">{garantia.motivo}</p>
      <p className="mt-1 text-xs text-muted-foreground">Cantidad: {garantia.cantidad}</p>
      {siguientes.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {siguientes.map((s) => (
            <button
              key={s}
              onClick={() => onAvanzar(s)}
              className={cn(
                "rounded-full px-2 py-0.5 text-[10px] font-medium",
                s === "RECHAZADO" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary",
              )}
            >
              → {ESTADO_LABEL[s]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
