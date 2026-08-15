import { useForm, useFieldArray } from "react-hook-form";
import { X, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrearOrdenCompra } from "../use-compras";
import { useTodosLosProveedores } from "@/pages/proveedores/use-proveedores";

interface FormValues {
  sucursalId: string;
  proveedorId: string;
  items: { varianteId: string; cantidad: number; costoUnitario: number }[];
}

const SUCURSAL_DEFAULT = "00000000-0000-0000-0000-000000000000";

export function NuevaOrdenModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: proveedores } = useTodosLosProveedores();
  const crear = useCrearOrdenCompra();

  const { register, control, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { sucursalId: SUCURSAL_DEFAULT, items: [{ varianteId: "", cantidad: 1, costoUnitario: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });

  const onSubmit = async (data: FormValues) => {
    await crear.mutateAsync(data);
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
              <h2 className="text-sm font-semibold">Nueva orden de compra</h2>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium">Proveedor</label>
                  <select
                    {...register("proveedorId", { required: true })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Selecciona un proveedor</option>
                    {proveedores?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium">Productos</label>
                    <button
                      type="button"
                      onClick={() => append({ varianteId: "", cantidad: 1, costoUnitario: 0 })}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
                    >
                      <Plus size={13} /> Agregar línea
                    </button>
                  </div>
                  <div className="space-y-2">
                    {fields.map((field, i) => (
                      <div key={field.id} className="flex items-center gap-2 rounded-md border border-border p-2">
                        <input
                          placeholder="ID de variante (UUID)"
                          {...register(`items.${i}.varianteId`, { required: true })}
                          className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="number"
                          placeholder="Cant."
                          {...register(`items.${i}.cantidad`, { required: true, valueAsNumber: true })}
                          className="w-16 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                        />
                        <input
                          type="number"
                          placeholder="Costo"
                          {...register(`items.${i}.costoUnitario`, { required: true, valueAsNumber: true })}
                          className="w-20 rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                        />
                        {fields.length > 1 && (
                          <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive">
                            <Trash2 size={14} />
                          </button>
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
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Creando..." : "Crear orden"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
