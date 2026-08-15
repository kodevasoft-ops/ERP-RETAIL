import { useState } from "react";
import { Search, Plus, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";
import { useProductos } from "../use-productos";
import { cn } from "@/lib/utils";
import type { Producto } from "../productos.types";

interface Props {
  onNuevo: () => void;
  onEditar: (producto: Producto) => void;
}

export function ProductosTable({ onNuevo, onEditar }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [stockBajo, setStockBajo] = useState(false);

  const { data, isLoading, isPlaceholderData } = useProductos({
    page,
    limit: 20,
    search: search || undefined,
    stockBajo: stockBajo || undefined,
    sortBy: "updatedAt",
    sortOrder: "desc",
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-72">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nombre, código o SKU..."
              className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            onClick={() => {
              setStockBajo((v) => !v);
              setPage(1);
            }}
            className={cn(
              "flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
              stockBajo
                ? "border-warning bg-warning/10 text-warning"
                : "border-border text-muted-foreground hover:bg-muted",
            )}
          >
            <AlertTriangle size={14} />
            Stock bajo
          </button>
        </div>

        <button
          onClick={onNuevo}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} />
          Nuevo producto
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Producto</th>
                <th className="px-4 py-2.5 text-left font-medium">Código</th>
                <th className="px-4 py-2.5 text-left font-medium">Categoría</th>
                <th className="px-4 py-2.5 text-left font-medium">Variantes</th>
                <th className="px-4 py-2.5 text-right font-medium">Stock total</th>
                <th className="px-4 py-2.5 text-right font-medium">Precio desde</th>
                <th className="px-4 py-2.5 text-left font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className={cn("divide-y divide-border", isPlaceholderData && "opacity-60")}>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Cargando productos...
                  </td>
                </tr>
              )}

              {!isLoading && data?.data.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium">No hay productos que coincidan</p>
                    <p className="text-xs text-muted-foreground">Ajusta los filtros o crea un nuevo producto.</p>
                  </td>
                </tr>
              )}

              {data?.data.map((producto) => {
                const stockTotal = producto.variantes.reduce((sum, v) => sum + v.stock, 0);
                const precioMin = Math.min(
                  ...producto.variantes.map((v) => Number(v.precioVenta)),
                  Infinity,
                );
                const tieneStockBajo = producto.variantes.some((v) => v.stock <= v.stockMinimo);

                return (
                  <tr
                    key={producto.id}
                    onClick={() => onEditar(producto)}
                    className="cursor-pointer transition-colors hover:bg-muted/40"
                  >
                    <td className="px-4 py-2.5 font-medium">{producto.nombre}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{producto.codigo}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {producto.categoria?.nombre ?? "—"}
                    </td>
                    <td className="px-4 py-2.5 text-muted-foreground">{producto.variantes.length}</td>
                    <td className="px-4 py-2.5 text-right">
                      <span className={tieneStockBajo ? "font-medium text-warning" : ""}>
                        {stockTotal}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {Number.isFinite(precioMin)
                        ? precioMin.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })
                        : "—"}
                    </td>
                    <td className="px-4 py-2.5">
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-xs font-medium",
                          producto.activo
                            ? "bg-success/10 text-success"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {producto.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.meta.total} productos · página {data.meta.page} de {data.meta.totalPages}
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
