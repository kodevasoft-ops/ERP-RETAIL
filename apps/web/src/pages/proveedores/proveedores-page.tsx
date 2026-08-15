import { useState } from "react";
import { Search, Plus } from "lucide-react";
import { useProveedores } from "./use-proveedores";
import { NuevoProveedorModal } from "./components/nuevo-proveedor-modal";

export default function ProveedoresPage() {
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const { data, isLoading } = useProveedores({ page: 1, limit: 50, search: search || undefined });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Proveedores</h1>
          <p className="text-sm text-muted-foreground">Directorio de proveedores y contactos.</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} /> Nuevo proveedor
        </button>
      </div>

      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o NIT..."
          className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Proveedor</th>
              <th className="px-4 py-2.5 text-left font-medium">NIT</th>
              <th className="px-4 py-2.5 text-left font-medium">Contacto</th>
              <th className="px-4 py-2.5 text-left font-medium">Teléfono</th>
              <th className="px-4 py-2.5 text-left font-medium">Ciudad</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando proveedores...
                </td>
              </tr>
            )}
            {data?.data.map((p) => (
              <tr key={p.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">{p.nombre}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.nit}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.contacto ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.telefono ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{p.ciudad ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <NuevoProveedorModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
