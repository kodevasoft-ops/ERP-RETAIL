import { useState } from "react";
import { Plus } from "lucide-react";
import { useKanban, useMoverLead, type EstadoLead, type Lead } from "../use-crm";
import { LeadCard } from "./lead-card";
import { cn } from "@/lib/utils";

const COLUMNAS: { estado: EstadoLead; label: string; color: string }[] = [
  { estado: "NUEVO", label: "Nuevo", color: "bg-muted-foreground" },
  { estado: "CONTACTADO", label: "Contactado", color: "bg-primary" },
  { estado: "INTERESADO", label: "Interesado", color: "bg-primary" },
  { estado: "COTIZACION_ENVIADA", label: "Cotización", color: "bg-warning" },
  { estado: "NEGOCIACION", label: "Negociación", color: "bg-warning" },
  { estado: "APARTADO", label: "Apartado", color: "bg-warning" },
  { estado: "GANADO", label: "Ganado", color: "bg-success" },
  { estado: "PERDIDO", label: "Perdido", color: "bg-destructive" },
];

interface Props {
  onSelectLead: (lead: Lead) => void;
  onNuevoLead: () => void;
}

export function KanbanBoard({ onSelectLead, onNuevoLead }: Props) {
  const { data, isLoading } = useKanban();
  const mover = useMoverLead();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<EstadoLead | null>(null);

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Cargando embudo...</div>;
  }

  const handleDrop = (estado: EstadoLead) => {
    if (!draggingId) return;
    const lead = Object.values(data).flat().find((l) => l.id === draggingId);
    if (!lead || lead.estado === estado) {
      setDraggingId(null);
      setDragOverCol(null);
      return;
    }

    if (estado === "PERDIDO") {
      const motivo = window.prompt("Motivo de pérdida (obligatorio):");
      if (!motivo) {
        setDraggingId(null);
        setDragOverCol(null);
        return;
      }
      mover.mutate({ id: lead.id, estado, orden: data[estado].length, version: lead.version, motivoPerdida: motivo });
    } else {
      mover.mutate({ id: lead.id, estado, orden: data[estado].length, version: lead.version });
    }

    setDraggingId(null);
    setDragOverCol(null);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {COLUMNAS.map((col) => (
        <div
          key={col.estado}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverCol(col.estado);
          }}
          onDragLeave={() => setDragOverCol((c) => (c === col.estado ? null : c))}
          onDrop={() => handleDrop(col.estado)}
          className={cn(
            "flex w-64 shrink-0 flex-col rounded-lg border border-border bg-muted/30 transition-colors",
            dragOverCol === col.estado && "border-primary bg-primary/5",
          )}
        >
          <div className="flex items-center justify-between px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className={cn("h-1.5 w-1.5 rounded-full", col.color)} />
              <span className="text-xs font-medium">{col.label}</span>
              <span className="text-xs text-muted-foreground">{data[col.estado]?.length ?? 0}</span>
            </div>
            {col.estado === "NUEVO" && (
              <button onClick={onNuevoLead} className="rounded p-0.5 hover:bg-muted" aria-label="Nuevo lead">
                <Plus size={13} />
              </button>
            )}
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto px-2 pb-2">
            {data[col.estado]?.map((lead) => (
              <LeadCard
                key={lead.id}
                lead={lead}
                onClick={() => onSelectLead(lead)}
                onDragStart={() => setDraggingId(lead.id)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
