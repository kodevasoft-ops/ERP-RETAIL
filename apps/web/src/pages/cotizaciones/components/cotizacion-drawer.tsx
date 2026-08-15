import { X, Send, ThumbsUp, ThumbsDown, ShoppingCart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useCotizacion, useEnviarCotizacion, useAceptarCotizacion, useRechazarCotizacion } from "../use-cotizaciones";
import { cn } from "@/lib/utils";

const ESTADO_LABEL: Record<string, { label: string; className: string }> = {
  BORRADOR: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  ENVIADA: { label: "Enviada", className: "bg-primary/10 text-primary" },
  ACEPTADA: { label: "Aceptada", className: "bg-success/10 text-success" },
  RECHAZADA: { label: "Rechazada", className: "bg-destructive/10 text-destructive" },
  VENCIDA: { label: "Vencida", className: "bg-warning/10 text-warning" },
  CONVERTIDA: { label: "Convertida en venta", className: "bg-success/10 text-success" },
};

export function CotizacionDrawer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const { data: cotizacion } = useCotizacion(id);
  const enviar = useEnviarCotizacion();
  const aceptar = useAceptarCotizacion();
  const rechazar = useRechazarCotizacion();
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {cotizacion && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-black/30" />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">Cotización #{cotizacion.numero}</h2>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ESTADO_LABEL[cotizacion.estado]?.className)}>
                  {ESTADO_LABEL[cotizacion.estado]?.label}
                </span>
                <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
              {cotizacion.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                  <div>
                    <p className="font-medium">{item.variante?.producto.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.variante?.talla}/{item.variante?.color} · {item.cantidad} unidades
                    </p>
                  </div>
                  <span className="font-medium">
                    {Number(item.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                  </span>
                </div>
              ))}

              <div className="flex justify-between border-t border-border pt-3 text-base font-semibold">
                <span>Total</span>
                <span>{Number(cotizacion.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              {cotizacion.estado === "BORRADOR" && (
                <button
                  onClick={() => enviar.mutate(cotizacion.id)}
                  className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <Send size={14} /> Marcar como enviada
                </button>
              )}
              {cotizacion.estado === "ENVIADA" && (
                <>
                  <button
                    onClick={() => rechazar.mutate(cotizacion.id)}
                    className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-destructive hover:bg-muted"
                  >
                    <ThumbsDown size={14} /> Rechazada
                  </button>
                  <button
                    onClick={() => aceptar.mutate(cotizacion.id)}
                    className="flex items-center gap-1 rounded-md bg-success px-3 py-2 text-sm font-medium text-white hover:opacity-90"
                  >
                    <ThumbsUp size={14} /> Aceptada
                  </button>
                </>
              )}
              {cotizacion.estado === "ACEPTADA" && (
                <button
                  onClick={() => navigate(`/pos?cotizacionId=${cotizacion.id}`)}
                  className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  <ShoppingCart size={14} /> Convertir en venta (POS)
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
