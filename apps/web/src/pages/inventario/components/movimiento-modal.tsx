import { useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRegistrarEntrada, useRegistrarSalida, useAjustar } from "../use-inventario";

interface FormValues {
  varianteId: string;
  cantidad: number;
  motivo: string;
  costoUnitario?: number;
}

type Tipo = "entrada" | "salida" | "ajuste";

export function MovimientoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tipo, setTipo] = useState<Tipo>("entrada");
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  const entrada = useRegistrarEntrada();
  const salida = useRegistrarSalida();
  const ajuste = useAjustar();

  const onSubmit = async (data: FormValues) => {
    if (tipo === "entrada") {
      await entrada.mutateAsync({
        varianteId: data.varianteId,
        cantidad: Number(data.cantidad),
        costoUnitario: data.costoUnitario ? Number(data.costoUnitario) : undefined,
        origen: "COMPRA",
        motivo: data.motivo,
      });
    } else if (tipo === "salida") {
      await salida.mutateAsync({
        varianteId: data.varianteId,
        cantidad: Number(data.cantidad),
        origen: "AJUSTE_MANUAL",
        motivo: data.motivo,
      });
    } else {
      await ajuste.mutateAsync({
        varianteId: data.varianteId,
        cantidad: Number(data.cantidad),
        motivo: data.motivo,
      });
    }
    reset();
    onClose();
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
            className="fixed inset-0 z-40 bg-black/30"
          />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Movimiento de inventario</h2>
              <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="mb-4 flex gap-1 rounded-md bg-muted p-1">
              {(["entrada", "salida", "ajuste"] as Tipo[]).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`flex-1 rounded-md py-1.5 text-xs font-medium capitalize transition-colors ${
                    tipo === t ? "bg-card shadow-sm" : "text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium">ID de variante (SKU)</label>
                <input
                  {...register("varianteId", { required: true })}
                  placeholder="UUID de la variante"
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium">
                  Cantidad {tipo === "ajuste" && "(negativo para restar)"}
                </label>
                <input
                  type="number"
                  {...register("cantidad", { required: true, valueAsNumber: true })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              {tipo === "entrada" && (
                <div className="space-y-1">
                  <label className="text-xs font-medium">Costo unitario (opcional)</label>
                  <input
                    type="number"
                    {...register("costoUnitario", { valueAsNumber: true })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-medium">Motivo {tipo === "ajuste" && "(obligatorio)"}</label>
                <input
                  {...register("motivo", { required: tipo === "ajuste" })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {isSubmitting ? "Guardando..." : "Registrar movimiento"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
