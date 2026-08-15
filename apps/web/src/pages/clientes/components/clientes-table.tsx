import { useState } from "react";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useClientes } from "../use-clientes";
import { cn } from "@/lib/utils";
import type { Cliente, EtiquetaCliente } from "../clientes.types";

const ETIQUETAS: { value: EtiquetaCliente; label: string; className: string }[] = [
  { value: "VIP", label: "VIP", className: "bg-primary/10 text-primary" },
  { value: "MAYORISTA", label: "Mayorista", className: "bg-warning/10 text-warning" },
  { value: "FRECUENTE", label: "Frecuente", className: "bg-success/10 text-success" },
  { value: "NUEVO", label: "Nuevo", className: "bg-muted text-muted-foreground" },
];

interface Props {
  onNuevo: () => void;
  onEditar: (cliente: Cliente) => void;
}

export function ClientesTable({ onNuevo, onEditar }: Props) {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [etiqueta, setEtiqueta] = useState<EtiquetaCliente | undefined>();

  const { data, isLoading } = useClientes({
    page,
    limit: 20,
    search: search || undefined,
    etiquetas: etiqueta ? [etiqueta] : undefined,
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
              placeholder="Buscar por nombre, documento, teléfono..."
              className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="flex gap-1">
            {ETIQUETAS.map((et) => (
              <button
                key={et.value}
                onClick={() => {
                  setEtiqueta(etiqueta === et.value ? undefined : et.value);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full px-2.5 py-1 text-xs font-medium transition-opacity",
                  et.className,
                  etiqueta && etiqueta !== et.value && "opacity-40",
                )}
              >
                {et.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={onNuevo}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} />
          Nuevo cliente
        </button>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Cliente</th>
              <th className="px-4 py-2.5 text-left font-medium">Documento</th>
              <th className="px-4 py-2.5 text-left font-medium">Contacto</th>
              <th className="px-4 py-2.5 text-left font-medium">Etiquetas</th>
              <th className="px-4 py-2.5 text-right font-medium">Puntos</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando clientes...
                </td>
              </tr>
            )}
            {!isLoading && data?.data.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center">
                  <p className="text-sm font-medium">No hay clientes que coincidan</p>
                  <p className="text-xs text-muted-foreground">Ajusta los filtros o crea uno nuevo.</p>
                </td>
              </tr>
            )}
            {data?.data.map((cliente) => (
              <tr
                key={cliente.id}
                onClick={() => onEditar(cliente)}
                className="cursor-pointer transition-colors hover:bg-muted/40"
              >
                <td className="px-4 py-2.5 font-medium">
                  {cliente.nombre} {cliente.apellido ?? ""}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {cliente.tipoDocumento} {cliente.numeroDocumento}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {cliente.telefono ?? cliente.email ?? "—"}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex gap-1">
                    {cliente.etiquetas.map((et) => {
                      const config = ETIQUETAS.find((e) => e.value === et);
                      return (
                        <span key={et} className={cn("rounded-full px-2 py-0.5 text-xs", config?.className)}>
                          {config?.label}
                        </span>
                      );
                    })}
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right">{cliente.puntosFidelizacion}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.meta.total} clientes · página {page} de {data.meta.totalPages}
          </span>
          <div className="flex gap-1">
            <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border p-1.5 disabled:opacity-40">
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
