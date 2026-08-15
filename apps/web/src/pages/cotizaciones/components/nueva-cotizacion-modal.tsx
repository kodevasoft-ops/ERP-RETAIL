import { useState } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrearCotizacion } from "../use-cotizaciones";

interface Linea {
  varianteId: string;
  cantidad: number;
  descuentoPorcentaje: number;
}

const SUCURSAL_DEFAULT = "00000000-0000-0000-0000-000000000000";

export function NuevaCotizacionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [lineas, setLineas] = useState<Linea[]>([{ varianteId: "", cantidad: 1, descuentoPorcentaje: 0 }]);
  const crear = useCrearCotizacion();

  const handleSubmit = async () => {
    const items = lineas.filter((l) => l.varianteId);
    if (items.length === 0) return;
    await crear.mutateAsync({ sucursalId: SUCURSAL_DEFAULT, items });
    setLineas([{ varianteId: "", cantidad: 1, descuentoPorcentaje: 0 }]);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-40 bg-black/30" />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Nueva cotización</h2>
              <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-2">
              {lineas.map((linea, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    placeholder="ID de variante (UUID)"
                    value={linea.varianteId}
                    onChange={(e) => {
                      const next = [...lineas];
                      next[i] = { ...next[i], varianteId: e.target.value };
                      setLineas(next);
                    }}
                    className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                  <input
                    type="number"
                    value={linea.cantidad}
                    onChange={(e) => {
                      const next = [...lineas];
                      next[i] = { ...next[i], cantidad: Number(e.target.value) };
                      setLineas(next);
                    }}
                    className="w-16 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                  />
                  {lineas.length > 1 && (
                    <button onClick={() => setLineas(lineas.filter((_, idx) => idx !== i))} className="text-muted-foreground hover:text-destructive">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={() => setLineas([...lineas, { varianteId: "", cantidad: 1, descuentoPorcentaje: 0 }])}
                className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
              >
                <Plus size={13} /> Agregar línea
              </button>
            </div>

            <button
              onClick={handleSubmit}
              disabled={crear.isPending}
              className="mt-4 w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {crear.isPending ? "Creando..." : "Crear cotización"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
