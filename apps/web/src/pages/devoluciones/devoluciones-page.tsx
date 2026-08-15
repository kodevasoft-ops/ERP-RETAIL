import { useState } from "react";
import { Plus, Check, X as XIcon } from "lucide-react";
import { useDevoluciones, useProcesarDevolucion, useRechazarDevolucion } from "./use-devoluciones";
import { NuevaDevolucionModal } from "./components/nueva-devolucion-modal";
import { cn } from "@/lib/utils";

const TIPO_LABEL: Record<string, string> = {
  CAMBIO_TALLA: "Cambio de talla",
  CAMBIO_COLOR: "Cambio de color",
  DINERO: "Dinero",
  BONO: "Bono",
  CREDITO: "Crédito",
  REPOSICION: "Reposición",
};

const ESTADO_LABEL: Record<string, { label: string; className: string }> = {
  SOLICITADA: { label: "Solicitada", className: "bg-warning/10 text-warning" },
  APROBADA: { label: "Aprobada", className: "bg-primary/10 text-primary" },
  RECHAZADA: { label: "Rechazada", className: "bg-destructive/10 text-destructive" },
  COMPLETADA: { label: "Completada", className: "bg-success/10 text-success" },
};

export default function DevolucionesPage() {
  const { data, isLoading } = useDevoluciones({ page: 1, limit: 30 });
  const procesar = useProcesarDevolucion();
  const rechazar = useRechazarDevolucion();
  const [modalOpen, setModalOpen] = useState(false);

  const handleRechazar = (id: string) => {
    const motivo = window.prompt("Motivo de rechazo:");
    if (!motivo) return;
    rechazar.mutate({ id, motivo });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Devoluciones</h1>
          <p className="text-sm text-muted-foreground">Cambios, reembolsos y reposiciones.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} /> Nueva devolución
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
              <th className="px-4 py-2.5 text-left font-medium">Tipo</th>
              <th className="px-4 py-2.5 text-left font-medium">Motivo</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando devoluciones...
                </td>
              </tr>
            )}
            {data?.data.map((d) => (
              <tr key={d.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 text-muted-foreground">
                  {new Date(d.createdAt).toLocaleDateString("es-CO", { dateStyle: "short" })}
                </td>
                <td className="px-4 py-2.5 font-medium">{TIPO_LABEL[d.tipo]}</td>
                <td className="px-4 py-2.5 text-muted-foreground line-clamp-1">{d.motivo}</td>
                <td className="px-4 py-2.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ESTADO_LABEL[d.estado]?.className)}>
                    {ESTADO_LABEL[d.estado]?.label}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  {d.estado === "SOLICITADA" && (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => handleRechazar(d.id)} className="flex items-center gap-1 text-xs text-destructive hover:opacity-80">
                        <XIcon size={13} /> Rechazar
                      </button>
                      <button onClick={() => procesar.mutate(d.id)} className="flex items-center gap-1 text-xs text-success hover:opacity-80">
                        <Check size={13} /> Procesar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NuevaDevolucionModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
