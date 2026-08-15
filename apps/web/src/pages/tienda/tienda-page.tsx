import { useState } from "react";
import { useParams } from "react-router-dom";
import { Search, ShoppingBag } from "lucide-react";
import { useTiendaInfo, useTiendaProductos } from "./use-tienda";
import { ProductoCard } from "./components/producto-card";
import { CarritoDrawer } from "./components/carrito-drawer";
import { useCartStore } from "./cart.store";

export default function TiendaPage() {
  const { empresaId = "" } = useParams();
  const [search, setSearch] = useState("");
  const [carritoAbierto, setCarritoAbierto] = useState(false);

  const { data: info, isLoading: cargandoInfo, isError } = useTiendaInfo(empresaId);
  const { data: productos, isLoading: cargandoProductos } = useTiendaProductos(empresaId, search);
  const totalItems = useCartStore((s) => s.items.reduce((sum, i) => sum + i.cantidad, 0));

  if (cargandoInfo) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Cargando tienda...</div>;
  }

  if (isError || !info) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="font-serif text-lg">Esta tienda no está disponible</p>
        <p className="text-sm text-muted-foreground">Verifica el enlace o contacta al negocio directamente.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      {/* Header editorial: distinto a propósito del header del admin —
          logo/nombre centrado, tipografía serif, sin sidebar ni navegación
          corporativa. Se siente a tienda, no a panel de control. */}
      <header className="border-b border-border">
        <div className="mx-auto max-w-5xl px-4 py-6 text-center sm:px-6">
          {info.logoUrl && <img src={info.logoUrl} alt={info.nombre} className="mx-auto mb-3 h-12 w-12 rounded-full object-cover" />}
          <h1 className="font-serif text-2xl sm:text-3xl">{info.nombre}</h1>
          {info.descripcionTienda && <p className="mt-1 text-sm text-muted-foreground">{info.descripcionTienda}</p>}
        </div>
      </header>

      <div className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3 sm:px-6">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar productos..."
              className="w-full rounded-full border border-border bg-muted/40 py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-foreground/20"
            />
          </div>
          <button
            onClick={() => setCarritoAbierto(true)}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border hover:bg-muted"
            aria-label="Ver carrito"
          >
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-[10px] font-medium text-background">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
        {cargandoProductos && <p className="text-sm text-muted-foreground">Cargando catálogo...</p>}

        {!cargandoProductos && productos?.length === 0 && (
          <p className="py-16 text-center text-sm text-muted-foreground">No hay productos disponibles por ahora.</p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
          {productos?.map((p) => (
            <ProductoCard key={p.id} producto={p} />
          ))}
        </div>
      </main>

      <CarritoDrawer
        open={carritoAbierto}
        onClose={() => setCarritoAbierto(false)}
        nombreTienda={info.nombre}
        whatsapp={info.whatsappVentas}
      />
    </div>
  );
}
