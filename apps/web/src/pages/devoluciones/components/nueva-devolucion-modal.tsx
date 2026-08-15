import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { X, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrearDevolucion, type TipoDevolucion } from "../use-devoluciones";

interface FormValues {
  ventaId: string;
  motivo: string;
  montoReembolso?: number;
  items: { varianteId: string; cantidad: number; varianteNuevaId?: string }[];
}

const TIPOS: { value: TipoDevolucion; label: string }[] = [
  { value: "CAMBIO_TALLA", label: "Cambio de talla" },
  { value: "CAMBIO_COLOR", label: "Cambio de color" },
  { value: "DINERO", label: "Devolución de dinero" },
  { value: "BONO", label: "Bono" },
  { value: "CREDITO", label: "Crédito al cliente" },
  { value: "REPOSICION", label: "Reposición" },
];

export function NuevaDevolucionModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tipo, setTipo] = useState<TipoDevolucion>("CAMBIO_TALLA");
  const esCambio = tipo === "CAMBIO_TALLA" || tipo === "CAMBIO_COLOR";
  const crear = useCrearDevolucion();

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { items: [{ varianteId: "", cantidad: 1, varianteNuevaId: "" }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onSubmit = async (data: FormValues) => {
    await crear.mutateAsync({
      ventaId: data.ventaId,
      tipo,
      motivo: data.motivo,
      montoReembolso: data.montoReembolso,
      items: data.items.map((i) => ({
        varianteId: i.varianteId,
        cantidad: Number(i.cantidad),
        varianteNuevaId: esCambio ? i.varianteNuevaId : undefined,
      })),
    });
    reset();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
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
              <h2 className="text-sm font-semibold">Nueva devolución</h2>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">ID de venta (UUID)</label>
                  <input {...register("ventaId", { required: true })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Tipo de devolución</label>
                  <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoDevolucion)} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                    {TIPOS.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                {(tipo === "DINERO" || tipo === "BONO" || tipo === "CREDITO") && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Monto a reembolsar</label>
                    <input type="number" {...register("montoReembolso", { valueAsNumber: true })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-medium">Motivo</label>
                  <textarea {...register("motivo", { required: true })} rows={2} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium">Productos a devolver</label>
                    <button type="button" onClick={() => append({ varianteId: "", cantidad: 1, varianteNuevaId: "" })} className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80">
                      <Plus size={13} /> Agregar línea
                    </button>
                  </div>
                  <div className="space-y-2">
                    {fields.map((field, i) => (
                      <div key={field.id} className="space-y-1 rounded-md border border-border p-2">
                        <div className="flex items-center gap-2">
                          <input placeholder="Variante devuelta (UUID)" {...register(`items.${i}.varianteId`, { required: true })} className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary" />
                          <input type="number" placeholder="Cant." {...register(`items.${i}.cantidad`, { required: true, valueAsNumber: true })} className="w-16 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary" />
                          {fields.length > 1 && (
                            <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                        {esCambio && (
                          <input placeholder="Variante nueva a entregar (UUID)" {...register(`items.${i}.varianteNuevaId`)} className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                  {isSubmitting ? "Creando..." : "Solicitar devolución"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
