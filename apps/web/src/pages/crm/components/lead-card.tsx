import { Phone, Clock } from "lucide-react";
import type { Lead } from "../use-crm";

const FUENTE_LABEL: Record<string, string> = {
  INSTAGRAM: "Instagram",
  FACEBOOK: "Facebook",
  TIKTOK: "TikTok",
  WEB: "Web",
  REFERIDO: "Referido",
  VISITA_LOCAL: "Visita local",
  OTRO: "Otro",
};

interface Props {
  lead: Lead;
  onClick: () => void;
  onDragStart: (e: React.DragEvent) => void;
}

export function LeadCard({ lead, onClick, onDragStart }: Props) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="cursor-grab rounded-md border border-border bg-card p-3 text-sm shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing"
    >
      <p className="font-medium">{lead.nombre}</p>
      {lead.telefono && (
        <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
          <Phone size={11} /> {lead.telefono}
        </p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
          {FUENTE_LABEL[lead.fuente] ?? lead.fuente}
        </span>
        {lead.proximoContacto && (
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Clock size={10} />
            {new Date(lead.proximoContacto).toLocaleDateString("es-CO", { day: "2-digit", month: "short" })}
          </span>
        )}
      </div>
    </div>
  );
}
