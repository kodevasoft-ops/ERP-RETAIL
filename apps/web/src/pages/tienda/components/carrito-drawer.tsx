import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCartStore } from "../cart.store";
import { abrirPedidoPorWhatsApp } from "../whatsapp-checkout";

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

interface Props {
  open: boolean;
  onClose: () => void;
  nombreTienda: string;
  whatsapp?: string | null;
}

export function CarritoDrawer({ open, onClose, nombreTienda, whatsapp }: Props) {
  const { items, cambiarCantidad, quitar } = useCartStore();
  const total = items.reduce((sum, i) => sum + i.precioVenta * i.cantidad, 0);

  const handleComprar = () => {
    if (!whatsapp) return;
    abrirPedidoPorWhatsApp(whatsapp, items, nombreTienda);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-background"
          >
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="flex items-center gap-2 font-serif text-lg">
                <ShoppingBag size={18} /> Tu pedido
              </h2>
              <button onClick={onClose} className="rounded-full p-1.5 hover:bg-muted" aria-label="Cerrar">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
              {items.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                  <ShoppingBag size={32} className="opacity-40" />
                  <p className="text-sm">Tu carrito está vacío.</p>
                </div>
              )}

              {items.map((item) => (
                <div key={item.varianteId} className="flex gap-3 rounded-xl border border-border p-3">
                  {item.imagenUrl ? (
                    <img src={item.imagenUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
                  ) : (
                    <div className="h-16 w-16 shrink-0 rounded-lg bg-muted" />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium leading-tight">{item.productoNombre}</p>
                      <button onClick={() => quitar(item.varianteId)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {item.talla} / {item.color}
                    </p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => cambiarCantidad(item.varianteId, item.cantidad - 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-muted"
                        >
                          <Minus size={11} />
                        </button>
                        <span className="w-5 text-center text-sm">{item.cantidad}</span>
                        <button
                          onClick={() => cambiarCantidad(item.varianteId, item.cantidad + 1)}
                          className="flex h-6 w-6 items-center justify-center rounded-full border border-border hover:bg-muted"
                        >
                          <Plus size={11} />
                        </button>
                      </div>
                      <span className="text-sm font-semibold">{money(item.precioVenta * item.cantidad)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {items.length > 0 && (
              <div className="space-y-3 border-t border-border px-5 py-4">
                <div className="flex justify-between text-base font-semibold">
                  <span>Total</span>
                  <span>{money(total)}</span>
                </div>
                <button
                  onClick={handleComprar}
                  disabled={!whatsapp}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                >
                  <WhatsAppIcon />
                  Comprar por WhatsApp
                </button>
                {!whatsapp && (
                  <p className="text-center text-xs text-muted-foreground">
                    Esta tienda aún no configuró su número de WhatsApp.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Ícono oficial de WhatsApp en SVG — no es un emoji, es un ícono vectorial
// igual que el resto del sistema (Lucide para todo lo demás; este es el
// único caso justificado de un ícono de marca fuera de Lucide).
function WhatsAppIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.48 1.32 5L2 22l5.25-1.38c1.45.79 3.08 1.21 4.79 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2Zm5.83 14.06c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.12.11-1.81-.11-.42-.13-.95-.31-1.65-.6-2.9-1.25-4.8-4.16-4.94-4.35-.14-.19-1.18-1.57-1.18-3 0-1.43.75-2.13 1.02-2.42.27-.29.58-.36.78-.36.19 0 .39 0 .56.01.18.01.42-.07.66.5.24.58.82 2 .89 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.52 1.9 1.05.94 1.93 1.23 2.21 1.37.28.14.44.12.6-.07.16-.19.68-.79.87-1.06.19-.27.37-.22.62-.13.25.09 1.6.75 1.87.89.28.14.46.21.53.32.07.12.07.68-.17 1.36Z" />
    </svg>
  );
}
