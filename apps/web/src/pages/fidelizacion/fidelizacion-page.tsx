import { useState } from "react";
import { Search } from "lucide-react";
import { useClientes } from "@/pages/clientes/use-clientes";
import type { Cliente } from "@/pages/clientes/clientes.types";
import { PuntosPanel } from "./components/puntos-panel";

export default function FidelizacionPage() {
  const [search, setSearch] = useState("");
  const [seleccionado, setSeleccionado] = useState<Cliente | null>(null);
  const { data } = useClientes({ page: 1, limit: 10, search: search || undefined });

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Fidelización</h1>
        <p className="text-sm text-muted-foreground">Busca un cliente para ver o ajustar sus puntos.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <div className="relative w-full max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente por nombre o documento..."
              className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1.5">
            {data?.data.map((c) => (
              <button
                key={c.id}
                onClick={() => setSeleccionado(c)}
                className={`flex w-full items-center justify-between rounded-md border p-3 text-left text-sm transition-colors ${
                  seleccionado?.id === c.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40"
                }`}
              >
                <span>
                  {c.nombre} {c.apellido}
                </span>
                <span className="text-xs text-muted-foreground">{c.puntosFidelizacion} pts</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          {seleccionado ? (
            <PuntosPanel cliente={seleccionado} />
          ) : (
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
              Selecciona un cliente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
