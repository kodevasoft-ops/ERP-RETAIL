import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrearProveedor } from "../use-proveedores";

interface FormValues {
  nombre: string;
  nit: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  ciudad?: string;
}

export function NuevoProveedorModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();
  const crear = useCrearProveedor();

  const onSubmit = async (data: FormValues) => {
    await crear.mutateAsync(data as never);
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
              <h2 className="text-sm font-semibold">Nuevo proveedor</h2>
              <button onClick={onClose} className="rounded-md p-1 hover:bg-muted">
                <X size={16} />
              </button>
            </div>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
              <input {...register("nombre", { required: true })} placeholder="Nombre / Razón social" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <input {...register("nit", { required: true })} placeholder="NIT" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <input {...register("contacto")} placeholder="Persona de contacto" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <input {...register("telefono")} placeholder="Teléfono" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <input {...register("email")} placeholder="Correo" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <input {...register("ciudad")} placeholder="Ciudad" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
              <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">
                {isSubmitting ? "Creando..." : "Crear proveedor"}
              </button>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
