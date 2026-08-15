import { useState } from "react";
import { Search, Plus, UserX } from "lucide-react";
import { useUsuarios, useDesactivarUsuario, type Usuario } from "./use-usuarios";
import { UsuarioDrawer } from "./components/usuario-drawer";
import { cn } from "@/lib/utils";

export default function UsuariosPage() {
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const { data, isLoading } = useUsuarios({ page: 1, limit: 50, search: search || undefined });
  const desactivar = useDesactivarUsuario();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Usuarios</h1>
          <p className="text-sm text-muted-foreground">Gestión de acceso al sistema.</p>
        </div>
        <button
          onClick={() => {
            setUsuarioEditando(null);
            setDrawerOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} /> Nuevo usuario
        </button>
      </div>

      <div className="relative w-72">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre o correo..."
          className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Usuario</th>
              <th className="px-4 py-2.5 text-left font-medium">Correo</th>
              <th className="px-4 py-2.5 text-left font-medium">Roles</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando usuarios...
                </td>
              </tr>
            )}
            {data?.data.map((u) => (
              <tr key={u.id} className="hover:bg-muted/30">
                <td
                  onClick={() => {
                    setUsuarioEditando(u);
                    setDrawerOpen(true);
                  }}
                  className="cursor-pointer px-4 py-2.5 font-medium"
                >
                  {u.nombre} {u.apellido}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{u.email}</td>
                <td className="px-4 py-2.5">
                  <div className="flex flex-wrap gap-1">
                    {u.roles.map((r) => (
                      <span key={r.rol.id} className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {r.rol.nombre}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", u.activo ? "bg-success/10 text-success" : "bg-muted text-muted-foreground")}>
                    {u.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {u.activo && (
                    <button
                      onClick={() => desactivar.mutate(u.id)}
                      className="flex items-center gap-1 text-xs text-destructive hover:opacity-80"
                    >
                      <UserX size={13} /> Desactivar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <UsuarioDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} usuario={usuarioEditando} />
    </div>
  );
}
