import { useState } from "react";
import { X, Truck, Send, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useOrdenCompra, useEnviarOrden, useRecibirOrden, useCancelarOrden } from "../use-compras";
import { cn } from "@/lib/utils";

const ESTADO_LABEL: Record<string, { label: string; className: string }> = {
  BORRADOR: { label: "Borrador", className: "bg-muted text-muted-foreground" },
  ENVIADA: { label: "Enviada", className: "bg-primary/10 text-primary" },
  RECIBIDA_PARCIAL: { label: "Recepción parcial", className: "bg-warning/10 text-warning" },
  RECIBIDA_TOTAL: { label: "Recibida completa", className: "bg-success/10 text-success" },
  CANCELADA: { label: "Cancelada", className: "bg-destructive/10 text-destructive" },
};

export function OrdenCompraDrawer({ ordenId, onClose }: { ordenId: string | null; onClose: () => void }) {
  const { data: orden } = useOrdenCompra(ordenId);
  const enviar = useEnviarOrden();
  const recibir = useRecibirOrden();
  const cancelar = useCancelarOrden();
  const [cantidades, setCantidades] = useState<Record<string, number>>({});

  const handleRecibir = async () => {
    if (!orden) return;
    const items = Object.entries(cantidades)
      .filter(([, cantidad]) => cantidad > 0)
      .map(([ordenCompraItemId, cantidadRecibida]) => ({ ordenCompraItemId, cantidadRecibida }));
    if (items.length === 0) return;

    await recibir.mutateAsync({ id: orden.id, version: orden.version, items });
    setCantidades({});
  };

  const handleCancelar = async () => {
    if (!orden) return;
    const motivo = window.prompt("Motivo de cancelación:");
    if (!motivo) return;
    await cancelar.mutateAsync({ id: orden.id, version: orden.version, motivo });
  };

  return (
    <AnimatePresence>
      {orden && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-black/30" />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold">Orden de compra #{orden.numero}</h2>
                <p className="text-xs text-muted-foreground">{orden.proveedor?.nombre}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ESTADO_LABEL[orden.estado]?.className)}>
                  {ESTADO_LABEL[orden.estado]?.label}
                </span>
                <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              <div className="space-y-2">
                {orden.items.map((item) => {
                  const pendiente = item.cantidad - item.cantidadRecibida;
                  return (
                    <div key={item.id} className="rounded-md border border-border p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">{item.variante?.producto.nombre ?? item.varianteId}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.variante?.talla}/{item.variante?.color} · {item.variante?.sku}
                          </p>
                        </div>
                        <div className="text-right text-xs text-muted-foreground">
                          <p>Ordenado: {item.cantidad}</p>
                          <p>Recibido: {item.cantidadRecibida}</p>
                        </div>
                      </div>

                      {["ENVIADA", "RECIBIDA_PARCIAL"].includes(orden.estado) && pendiente > 0 && (
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-xs text-muted-foreground">Recibir ahora:</label>
                          <input
                            type="number"
                            min={0}
                            max={pendiente}
                            value={cantidades[item.id] ?? 0}
                            onChange={(e) =>
                              setCantidades((prev) => ({
                                ...prev,
                                [item.id]: Math.min(pendiente, Math.max(0, Number(e.target.value))),
                              }))
                            }
                            className="w-20 rounded-md border border-border bg-background px-2 py-1 text-sm outline-none focus:ring-2 focus:ring-primary"
                          />
                          <span className="text-xs text-muted-foreground">/ {pendiente} pendientes</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="space-y-1 border-t border-border pt-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{Number(orden.subtotal).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA</span>
                  <span>{Number(orden.ivaTotal).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{Number(orden.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
              {orden.estado === "BORRADOR" && (
                <>
                  <button onClick={handleCancelar} className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-destructive hover:bg-muted">
                    <Ban size={14} /> Cancelar
                  </button>
                  <button
                    onClick={() => enviar.mutate({ id: orden.id, version: orden.version })}
                    className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
                  >
                    <Send size={14} /> Enviar al proveedor
                  </button>
                </>
              )}
              {["ENVIADA", "RECIBIDA_PARCIAL"].includes(orden.estado) && (
                <>
                  <button onClick={handleCancelar} className="flex items-center gap-1 rounded-md border border-border px-3 py-2 text-sm text-destructive hover:bg-muted">
                    <Ban size={14} /> Cancelar
                  </button>
                  <button
                    onClick={handleRecibir}
                    disabled={recibir.isPending}
                    className="flex items-center gap-1 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    <Truck size={14} /> Registrar recepción
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
