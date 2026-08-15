import { useState } from "react";
import { ChevronLeft, ChevronRight, ArrowDown, ArrowUp, ArrowLeftRight, Wrench } from "lucide-react";
import { useKardex } from "../use-inventario";
import { cn } from "@/lib/utils";

const TIPO_CONFIG: Record<string, { label: string; icon: typeof ArrowDown; color: string }> = {
  ENTRADA: { label: "Entrada", icon: ArrowDown, color: "text-success" },
  SALIDA: { label: "Salida", icon: ArrowUp, color: "text-destructive" },
  TRANSFERENCIA_SALIDA: { label: "Transferencia (salida)", icon: ArrowLeftRight, color: "text-primary" },
  TRANSFERENCIA_ENTRADA: { label: "Transferencia (entrada)", icon: ArrowLeftRight, color: "text-primary" },
  AJUSTE_POSITIVO: { label: "Ajuste +", icon: Wrench, color: "text-success" },
  AJUSTE_NEGATIVO: { label: "Ajuste -", icon: Wrench, color: "text-destructive" },
  MERMA: { label: "Merma", icon: ArrowUp, color: "text-destructive" },
  DEVOLUCION: { label: "Devolución", icon: ArrowDown, color: "text-success" },
};

export function KardexTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useKardex({ page, limit: 25 });

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
              <th className="px-4 py-2.5 text-left font-medium">Movimiento</th>
              <th className="px-4 py-2.5 text-left font-medium">Producto</th>
              <th className="px-4 py-2.5 text-right font-medium">Cantidad</th>
              <th className="px-4 py-2.5 text-right font-medium">Stock resultante</th>
              <th className="px-4 py-2.5 text-left font-medium">Motivo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando movimientos...
                </td>
              </tr>
            )}
            {data?.data.map((mov) => {
              const config = TIPO_CONFIG[mov.tipo] ?? { label: mov.tipo, icon: ArrowDown, color: "" };
              const Icon = config.icon;
              return (
                <tr key={mov.id} className="hover:bg-muted/30">
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(mov.createdAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-2.5">
                    <span className={cn("flex items-center gap-1.5", config.color)}>
                      <Icon size={14} /> {config.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    {mov.variante.producto.nombre}{" "}
                    <span className="text-xs text-muted-foreground">
                      ({mov.variante.talla}/{mov.variante.color})
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium">{mov.cantidad}</td>
                  <td className="px-4 py-2.5 text-right text-muted-foreground">
                    {mov.stockAnterior} → {mov.stockNuevo}
                  </td>
                  <td className="px-4 py-2.5 text-muted-foreground">{mov.motivo ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.meta.total} movimientos · página {page} de {data.meta.totalPages}
          </span>
          <div className="flex gap-1">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-md border border-border p-1.5 disabled:opacity-40"
            >
              <ChevronLeft size={15} />
            </button>
            <button
              disabled={page >= data.meta.totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-md border border-border p-1.5 disabled:opacity-40"
            >
              <ChevronRight size={15} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
