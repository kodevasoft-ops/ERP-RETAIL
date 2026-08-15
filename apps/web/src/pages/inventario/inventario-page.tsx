import { useState } from "react";
import { Plus } from "lucide-react";
import { AlertasStockBajo } from "./components/alertas-stock-bajo";
import { KardexTable } from "./components/kardex-table";
import { MovimientoModal } from "./components/movimiento-modal";

export default function InventarioPage() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Inventario</h1>
          <p className="text-sm text-muted-foreground">Kardex, movimientos y alertas de stock.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} />
          Registrar movimiento
        </button>
      </div>

      <AlertasStockBajo />
      <KardexTable />
      <MovimientoModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
