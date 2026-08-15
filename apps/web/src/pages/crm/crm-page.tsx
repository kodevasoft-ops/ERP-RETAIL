import { useState } from "react";
import { KanbanBoard } from "./components/kanban-board";
import { LeadDrawer } from "./components/lead-drawer";
import { NuevoLeadModal } from "./components/nuevo-lead-modal";
import type { Lead } from "./use-crm";

export default function CrmPage() {
  const [leadSeleccionado, setLeadSeleccionado] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">CRM</h1>
        <p className="text-sm text-muted-foreground">
          Arrastra las tarjetas entre columnas para mover el lead por el embudo.
        </p>
      </div>

      <KanbanBoard onSelectLead={setLeadSeleccionado} onNuevoLead={() => setModalOpen(true)} />

      <LeadDrawer lead={leadSeleccionado} onClose={() => setLeadSeleccionado(null)} />
      <NuevoLeadModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
