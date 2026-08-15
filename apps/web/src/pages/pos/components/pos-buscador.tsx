import { useState } from "react";
import { Search } from "lucide-react";
import { useProductos } from "@/pages/productos/use-productos";
import type { CarritoItem } from "../use-pos";

export function PosBuscador({ onAgregar }: { onAgregar: (item: CarritoItem) => void }) {
  const [search, setSearch] = useState("");

  const { data, isLoading } = useProductos({
    page: 1,
    limit: 24,
    search: search || undefined,
    activo: true,
  });

  return (
    <div className="flex h-full flex-col">
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          autoFocus
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, código o escanear código de barras..."
          className="w-full rounded-md border border-border bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading && <p className="text-sm text-muted-foreground">Buscando...</p>}

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {data?.data.map((producto) =>
            producto.variantes
              .filter((v) => v.activo)
              .map((v) => (
                <button
                  key={v.id}
                  disabled={v.stock <= 0}
                  onClick={() =>
                    onAgregar({
                      varianteId: v.id,
                      productoNombre: producto.nombre,
                      talla: v.talla,
                      color: v.color,
                      sku: v.sku,
                      precioUnitario: Number(v.precioVenta),
                      ivaPorcentaje: Number(v.iva),
                      descuentoMax: Number(v.descuentoMax),
                      stockDisponible: v.stock,
                      cantidad: 1,
                      descuentoPorcentaje: 0,
                    })
                  }
                  className="rounded-md border border-border bg-card p-3 text-left text-sm transition-colors hover:border-primary hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <p className="line-clamp-1 font-medium">{producto.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    {v.talla} / {v.color}
                  </p>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="text-sm font-semibold">
                      {Number(v.precioVenta).toLocaleString("es-CO", {
                        style: "currency",
                        currency: "COP",
                        maximumFractionDigits: 0,
                      })}
                    </span>
                    <span className="text-xs text-muted-foreground">Stock: {v.stock}</span>
                  </div>
                </button>
              )),
          )}
        </div>
      </div>
    </div>
  );
}
