import { useState } from "react";
import { Upload } from "lucide-react";
import { ProductosTable } from "./components/productos-table";
import { ProductoDrawer } from "./components/producto-drawer";
import { ImportarProductosModal } from "./components/importar-productos-modal";
import type { Producto } from "./productos.types";

// TODO: reemplazar por la sucursal activa del usuario (contexto de sesión)
const SUCURSAL_DEFAULT = "00000000-0000-0000-0000-000000000000";

export default function ProductosPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [importarOpen, setImportarOpen] = useState(false);
  const [productoEditando, setProductoEditando] = useState<Producto | null>(null);

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Productos</h1>
          <p className="text-sm text-muted-foreground">
            Catálogo con variantes por talla y color. Cada variante gestiona su propio stock y precio.
          </p>
        </div>
        <button
          onClick={() => setImportarOpen(true)}
          className="flex shrink-0 items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
        >
          <Upload size={14} /> Importar Excel
        </button>
      </div>

      <ProductosTable
        onNuevo={() => {
          setProductoEditando(null);
          setDrawerOpen(true);
        }}
        onEditar={(producto) => {
          setProductoEditando(producto);
          setDrawerOpen(true);
        }}
      />

      <ProductoDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        producto={productoEditando}
        sucursalIdDefault={SUCURSAL_DEFAULT}
      />

      <ImportarProductosModal open={importarOpen} onClose={() => setImportarOpen(false)} sucursalId={SUCURSAL_DEFAULT} />
    </div>
  );
}
