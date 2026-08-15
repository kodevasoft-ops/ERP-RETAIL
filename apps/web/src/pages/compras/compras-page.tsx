import { useState } from "react";
import { Plus } from "lucide-react";
import { useOrdenesCompra } from "./use-compras";
import { OrdenCompraDrawer } from "./components/orden-compra-drawer";
import { NuevaOrdenModal } from "./components/nueva-orden-modal";
import { cn } from "@/lib/utils";

const ESTADO_LABEL: Record<string, { label: string; className: string }> = {
  BORRADOR: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  ENVIADA: { label: "Enviada", className: "bg-primary/10 text-primary" },
  RECIBIDA_PARCIAL: { label: "Parcial", className: "bg-warning/10 text-warning" },
  RECIBIDA_TOTAL: { label: "Completa", className: "bg-success/10 text-success" },
  CANCELADA: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

export default function ComprasPage() {
  const { data, isLoading } = useOrdenesCompra({ page: 1, limit: 30 });
  const [ordenSeleccionada, setOrdenSeleccionada] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Compras</h1>
          <p className="text-sm text-muted-foreground">Órdenes de compra y recepción de mercancía.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} /> Nueva orden
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Número</th>
              <th className="px-4 py-2.5 text-left font-medium">Proveedor</th>
              <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando órdenes...
                </td>
              </tr>
            )}
            {data?.data.map((orden) => (
              <tr key={orden.id} onClick={() => setOrdenSeleccionada(orden.id)} className="cursor-pointer hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">#{orden.numero}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{orden.proveedor?.nombre}</td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {new Date(orden.createdAt).toLocaleDateString("es-CO", { dateStyle: "short" })}
                </td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ESTADO_LABEL[orden.estado]?.className)}>
                    {ESTADO_LABEL[orden.estado]?.label}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <OrdenCompraDrawer ordenId={ordenSeleccionada} onClose={() => setOrdenSeleccionada(null)} />
      <NuevaOrdenModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
