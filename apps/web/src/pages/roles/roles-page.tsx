import { useState } from "react";
import { Plus, Trash2, Shield } from "lucide-react";
import { useRoles, useEliminarRol, type Rol } from "./use-roles";
import { RolDrawer } from "./components/rol-drawer";

export default function RolesPage() {
  const { data: roles, isLoading } = useRoles();
  const eliminar = useEliminarRol();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [rolEditando, setRolEditando] = useState<Rol | null>(null);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Roles y permisos</h1>
          <p className="text-sm text-muted-foreground">Define qué puede hacer cada rol en cada módulo.</p>
        </div>
        <button
          onClick={() => {
            setRolEditando(null);
            setDrawerOpen(true);
          }}
          className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Plus size={15} /> Nuevo rol
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading && <p className="text-sm text-muted-foreground">Cargando roles...</p>}
        {roles?.map((rol) => (
          <div
            key={rol.id}
            onClick={() => {
              setRolEditando(rol);
              setDrawerOpen(true);
            }}
            className="cursor-pointer rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <Shield size={16} className="text-primary" />
                <span className="font-medium">{rol.nombre}</span>
              </div>
              {!rol.esSistema && rol._count.usuarios === 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm(`¿Eliminar el rol "${rol.nombre}"?`)) eliminar.mutate(rol.id);
                  }}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
            {rol.descripcion && <p className="mt-1 text-xs text-muted-foreground">{rol.descripcion}</p>}
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>{rol.permisos.length} permisos</span>
              <span>{rol._count.usuarios} usuarios</span>
            </div>
          </div>
        ))}
      </div>

      <RolDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} rol={rolEditando} />
    </div>
  );
}
