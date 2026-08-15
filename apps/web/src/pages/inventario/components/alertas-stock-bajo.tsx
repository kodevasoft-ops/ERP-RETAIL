import { AlertTriangle } from "lucide-react";
import { useAlertasStockBajo } from "../use-inventario";

export function AlertasStockBajo() {
  const { data: alertas, isLoading } = useAlertasStockBajo();

  if (isLoading) return null;
  if (!alertas || alertas.length === 0) return null;

  return (
    <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
      <div className="mb-3 flex items-center gap-2">
        <AlertTriangle size={16} className="text-warning" />
        <h3 className="text-sm font-medium">{alertas.length} variantes con stock bajo</h3>
      </div>
      <div className="max-h-48 space-y-1.5 overflow-y-auto">
        {alertas.map((a) => (
          <div key={a.id} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {a.producto_nombre} — {a.talla} / {a.color}{" "}
              <span className="text-xs">({a.sku})</span>
            </span>
            <span className="font-medium text-warning">
              {a.stock} / mín. {a.stock_minimo}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
