import { useState } from "react";
import { X, DollarSign } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useHistorialAbonos, useRegistrarAbono, type CuentaPorCobrar } from "../use-cartera";

function money(n: number | string) {
  return Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export function CuentaDrawer({ cuenta, onClose }: { cuenta: CuentaPorCobrar | null; onClose: () => void }) {
  const { data: abonos } = useHistorialAbonos(cuenta?.id ?? null);
  const registrarAbono = useRegistrarAbono();
  const [monto, setMonto] = useState(0);
  const [metodoPago, setMetodoPago] = useState("EFECTIVO");

  const handleRegistrar = async () => {
    if (!cuenta || monto <= 0) return;
    await registrarAbono.mutateAsync({ cuentaId: cuenta.id, monto, metodoPago });
    setMonto(0);
  };

  return (
    <AnimatePresence>
      {cuenta && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-black/30" />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h2 className="text-sm font-semibold">
                  {cuenta.cliente ? `${cuenta.cliente.nombre} ${cuenta.cliente.apellido ?? ""}` : "Cliente"}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Venta #{cuenta.venta.prefijo}{cuenta.venta.numero}
                </p>
              </div>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="border-b border-border px-6 py-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Monto original</p>
                  <p className="font-semibold">{money(cuenta.monto)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo pendiente</p>
                  <p className="font-semibold text-warning">{money(cuenta.saldo)}</p>
                </div>
              </div>
              {cuenta.fechaVencimiento && (
                <p className="mt-2 text-xs text-muted-foreground">
                  Vence: {new Date(cuenta.fechaVencimiento).toLocaleDateString("es-CO", { dateStyle: "long" })}
                </p>
              )}
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
              <h3 className="text-xs font-medium text-muted-foreground">Historial de abonos</h3>
              {abonos?.length === 0 && <p className="text-xs text-muted-foreground">Sin abonos registrados aún.</p>}
              {abonos?.map((a) => (
                <div key={a.id} className="flex items-center justify-between rounded-md border border-border p-2.5 text-sm">
                  <div>
                    <p className="font-medium">{money(a.monto)}</p>
                    <p className="text-xs text-muted-foreground">{a.metodoPago}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {new Date(a.createdAt).toLocaleDateString("es-CO", { dateStyle: "short" })}
                  </span>
                </div>
              ))}
            </div>

            {Number(cuenta.saldo) > 0 && (
              <div className="space-y-2 border-t border-border px-6 py-4">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={monto || ""}
                    onChange={(e) => setMonto(Math.min(Number(cuenta.saldo), Number(e.target.value)))}
                    placeholder="Monto del abono"
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  <select
                    value={metodoPago}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    className="rounded-md border border-border bg-background px-2 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="EFECTIVO">Efectivo</option>
                    <option value="TRANSFERENCIA">Transferencia</option>
                    <option value="TARJETA_DEBITO">Tarjeta débito</option>
                    <option value="TARJETA_CREDITO">Tarjeta crédito</option>
                  </select>
                </div>
                <button
                  onClick={handleRegistrar}
                  disabled={registrarAbono.isPending || monto <= 0}
                  className="flex w-full items-center justify-center gap-1.5 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <DollarSign size={14} /> Registrar abono
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
