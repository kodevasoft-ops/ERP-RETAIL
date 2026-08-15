import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

interface Props<T extends { id: string; nombre: string }> {
  titulo: string;
  descripcion: string;
  items?: T[];
  isLoading?: boolean;
  onCrear: (nombre: string) => void;
  onEliminar?: (id: string) => void;
  creando?: boolean;
}

export function CatalogoPanel<T extends { id: string; nombre: string }>({
  titulo,
  descripcion,
  items,
  isLoading,
  onCrear,
  onEliminar,
  creando,
}: Props<T>) {
  const [nombre, setNombre] = useState("");

  const handleSubmit = () => {
    if (!nombre.trim()) return;
    onCrear(nombre.trim());
    setNombre("");
  };

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h3 className="text-sm font-medium">{titulo}</h3>
      <p className="mb-3 text-xs text-muted-foreground">{descripcion}</p>

      <div className="mb-3 flex gap-2">
        <input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          placeholder="Nombre..."
          className="flex-1 rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={handleSubmit}
          disabled={creando}
          className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          <Plus size={14} /> Agregar
        </button>
      </div>

      <div className="space-y-1">
        {isLoading && <p className="text-xs text-muted-foreground">Cargando...</p>}
        {items?.map((item) => (
          <div key={item.id} className="flex items-center justify-between rounded-md border border-border px-3 py-1.5 text-sm">
            <span>{item.nombre}</span>
            {onEliminar && (
              <button onClick={() => onEliminar(item.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 size={13} />
              </button>
            )}
          </div>
        ))}
        {items?.length === 0 && <p className="text-xs text-muted-foreground">Sin registros aún.</p>}
      </div>
    </div>
  );
}
