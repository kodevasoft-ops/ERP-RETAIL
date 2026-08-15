import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useGastos, useEliminarGasto } from "./use-gastos";
import { NuevoGastoModal } from "./components/nuevo-gasto-modal";

const CATEGORIA_LABEL: Record<string, string> = {
  ARRIENDO: "Arriendo",
  SERVICIOS: "Servicios",
  INTERNET: "Internet",
  PUBLICIDAD: "Publicidad",
  NOMINA: "Nómina",
  TRANSPORTE: "Transporte",
  PAPELERIA: "Papelería",
  IMPREVISTOS: "Imprevistos",
  OTRO: "Otro",
};

export default function GastosPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useGastos({ page: 1, limit: 50 });
  const eliminar = useEliminarGasto();

  const totalPeriodo = data?.data.reduce((s, g) => s + Number(g.monto), 0) ?? 0;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Gastos</h1>
          <p className="text-sm text-muted-foreground">
            Total mostrado: {totalPeriodo.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
          </p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} /> Nuevo gasto
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
              <th className="px-4 py-2.5 text-left font-medium">Categoría</th>
              <th className="px-4 py-2.5 text-left font-medium">Descripción</th>
              <th className="px-4 py-2.5 text-right font-medium">Monto</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando gastos...
                </td>
              </tr>
            )}
            {data?.data.map((g) => (
              <tr key={g.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 text-muted-foreground">
                  {new Date(g.fecha).toLocaleDateString("es-CO", { dateStyle: "short" })}
                </td>
                <td className="px-4 py-2.5">
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs">{CATEGORIA_LABEL[g.categoria]}</span>
                </td>
                <td className="px-4 py-2.5 font-medium">{g.descripcion}</td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {Number(g.monto).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button onClick={() => eliminar.mutate(g.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NuevoGastoModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
