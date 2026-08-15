import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface CartItem {
  varianteId: string;
  productoNombre: string;
  talla: string;
  color: string;
  precioVenta: number;
  imagenUrl?: string;
  cantidad: number;
}

interface CartState {
  items: CartItem[];
  agregar: (item: Omit<CartItem, "cantidad">) => void;
  cambiarCantidad: (varianteId: string, cantidad: number) => void;
  quitar: (varianteId: string) => void;
  vaciar: () => void;
}

/**
 * A diferencia del resto de la app (donde el estado vive en el backend),
 * el carrito de la tienda pública es de un visitante SIN cuenta — vive
 * enteramente en el navegador. persist() lo guarda en localStorage para
 * que sobreviva un refresh de página sin perder la selección.
 */
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      agregar: (item) => {
        const existente = get().items.find((i) => i.varianteId === item.varianteId);
        if (existente) {
          set({
            items: get().items.map((i) =>
              i.varianteId === item.varianteId ? { ...i, cantidad: i.cantidad + 1 } : i,
            ),
          });
        } else {
          set({ items: [...get().items, { ...item, cantidad: 1 }] });
        }
      },
      cambiarCantidad: (varianteId, cantidad) => {
        if (cantidad <= 0) {
          set({ items: get().items.filter((i) => i.varianteId !== varianteId) });
          return;
        }
        set({ items: get().items.map((i) => (i.varianteId === varianteId ? { ...i, cantidad } : i)) });
      },
      quitar: (varianteId) => set({ items: get().items.filter((i) => i.varianteId !== varianteId) }),
      vaciar: () => set({ items: [] }),
    }),
    { name: "tienda-carrito" },
  ),
);
