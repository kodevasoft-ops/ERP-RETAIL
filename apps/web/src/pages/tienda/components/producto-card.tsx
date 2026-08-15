import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, ImageOff } from "lucide-react";
import type { ProductoTienda } from "../use-tienda";
import { useCartStore } from "../cart.store";

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export function ProductoCard({ producto }: { producto: ProductoTienda }) {
  const agregar = useCartStore((s) => s.agregar);
  const [varianteSeleccionada, setVarianteSeleccionada] = useState(producto.variantes[0]?.id);

  const variante = producto.variantes.find((v) => v.id === varianteSeleccionada) ?? producto.variantes[0];
  const tallas = [...new Set(producto.variantes.map((v) => v.talla))];
  const imagenPrincipal = producto.imagenes.find((i) => i.esPrincipal) ?? producto.imagenes[0];

  if (!variante) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.3 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-muted">
        {imagenPrincipal ? (
          <img
            src={imagenPrincipal.url}
            alt={producto.nombre}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <ImageOff size={28} />
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        {producto.categoria && (
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            {producto.categoria.nombre}
          </span>
        )}
        <h3 className="mt-0.5 font-serif text-base leading-snug">{producto.nombre}</h3>

        {tallas.length > 1 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tallas.map((talla) => {
              const v = producto.variantes.find((x) => x.talla === talla);
              const seleccionada = v?.id === varianteSeleccionada;
              return (
                <button
                  key={talla}
                  onClick={() => v && setVarianteSeleccionada(v.id)}
                  className={`rounded-full border px-2.5 py-0.5 text-xs transition-colors ${
                    seleccionada
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground hover:border-foreground"
                  }`}
                >
                  {talla}
                </button>
              );
            })}
          </div>
        )}

        <div className="mt-auto flex items-center justify-between pt-3">
          <span className="text-lg font-semibold">{money(Number(variante.precioVenta))}</span>
          <button
            onClick={() =>
              agregar({
                varianteId: variante.id,
                productoNombre: producto.nombre,
                talla: variante.talla,
                color: variante.color,
                precioVenta: Number(variante.precioVenta),
                imagenUrl: imagenPrincipal?.url,
              })
            }
            className="flex h-9 w-9 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105 active:scale-95"
            aria-label="Agregar al carrito"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
