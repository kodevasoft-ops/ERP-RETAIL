import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrearGasto, type CategoriaGasto } from "../use-gastos";

interface FormValues {
  categoria: CategoriaGasto;
  descripcion: string;
  monto: number;
  fecha: string;
}

const CATEGORIAS: { value: CategoriaGasto; label: string }[] = [
  { value: "ARRIENDO", label: "Arriendo" },
  { value: "SERVICIOS", label: "Servicios públicos" },
  { value: "INTERNET", label: "Internet" },
  { value: "PUBLICIDAD", label: "Publicidad" },
  { value: "NOMINA", label: "Nómina" },
  { value: "TRANSPORTE", label: "Transporte" },
  { value: "PAPELERIA", label: "Papelería" },
  { value: "IMPREVISTOS", label: "Imprevistos" },
  { value: "OTRO", label: "Otro" },
];

export function NuevoGastoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>({
    defaultValues: { categoria: "OTRO", fecha: new Date().toISOString().slice(0, 10) },
  });
  const crear = useCrearGasto();

  const onSubmit = async (data: FormValues) => {
    await crear.mutateAsync({ ...data, monto: Number(data.monto) });
    reset();
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
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold">Nuevo gasto</h2>
              <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <select {...register("categoria")} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary">
                {CATEGORIAS.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <input {...register("descripcion", { required: true })} placeholder="Descripción" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <input type="number" {...register("monto", { required: true, valueAsNumber: true })} placeholder="Monto" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <input type="date" {...register("fecha", { required: true })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {isSubmitting ? "Guardando..." : "Registrar gasto"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
