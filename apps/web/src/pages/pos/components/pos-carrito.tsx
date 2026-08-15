import { Minus, Plus, Trash2 } from "lucide-react";
import type { CarritoItem } from "../use-pos";

interface Props {
  items: CarritoItem[];
  onCambiarCantidad: (varianteId: string, cantidad: number) => void;
  onCambiarDescuento: (varianteId: string, descuento: number) => void;
  onQuitar: (varianteId: string) => void;
}

function totalItem(item: CarritoItem) {
  const bruto = item.precioUnitario * item.cantidad;
  const descuento = bruto * (item.descuentoPorcentaje / 100);
  const subtotal = bruto - descuento;
  return subtotal * (1 + item.ivaPorcentaje / 100);
}

export function PosCarrito({ items, onCambiarCantidad, onCambiarDescuento, onQuitar }: Props) {
  if (items.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        El carrito está vacío. Busca un producto para empezar.
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-2 overflow-y-auto">
      {items.map((item) => (
        <div key={item.varianteId} className="rounded-md border border-border p-2.5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium">{item.productoNombre}</p>
              <p className="text-xs text-muted-foreground">
                {item.talla} / {item.color} · {item.sku}
              </p>
            </div>
            <button onClick={() => onQuitar(item.varianteId)} className="text-muted-foreground hover:text-destructive">
              <Trash2 size={14} />
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1">
              <button
                onClick={() => onCambiarCantidad(item.varianteId, Math.max(1, item.cantidad - 1))}
                className="rounded-md border border-border p-1 hover:bg-muted"
              >
                <Minus size={12} />
              </button>
              <span className="w-8 text-center text-sm">{item.cantidad}</span>
              <button
                onClick={() => onCambiarCantidad(item.varianteId, Math.min(item.stockDisponible, item.cantidad + 1))}
                disabled={item.cantidad >= item.stockDisponible}
                className="rounded-md border border-border p-1 hover:bg-muted disabled:opacity-40"
              >
                <Plus size={12} />
              </button>
            </div>

            {item.descuentoMax > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <span className="text-muted-foreground">Desc.</span>
                <input
                  type="number"
                  min={0}
                  max={item.descuentoMax}
                  value={item.descuentoPorcentaje}
                  onChange={(e) =>
                    onCambiarDescuento(
                      item.varianteId,
                      Math.min(item.descuentoMax, Math.max(0, Number(e.target.value))),
                    )
                  }
                  className="w-12 rounded border border-border bg-background px-1 py-0.5 text-center"
                />
                <span className="text-muted-foreground">%</span>
              </div>
            )}

            <span className="text-sm font-semibold">
              {totalItem(item).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
