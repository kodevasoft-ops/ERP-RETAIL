import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrearCliente, useActualizarCliente } from "../use-clientes";
import type { Cliente } from "../clientes.types";

const schema = z.object({
  tipoDocumento: z.enum(["CC", "CE", "NIT", "PASAPORTE", "TI"]),
  numeroDocumento: z.string().min(1, "Requerido"),
  nombre: z.string().min(1, "Requerido"),
  apellido: z.string().optional(),
  email: z.string().email("Correo inválido").optional().or(z.literal("")),
  telefono: z.string().optional(),
  whatsapp: z.string().optional(),
  direccion: z.string().optional(),
  ciudad: z.string().optional(),
  notas: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  cliente?: Cliente | null;
}

export function ClienteDrawer({ open, onClose, cliente }: Props) {
  const crear = useCrearCliente();
  const actualizar = useActualizarCliente();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { tipoDocumento: "CC" },
  });

  useEffect(() => {
    if (cliente) {
      reset({
        tipoDocumento: cliente.tipoDocumento,
        numeroDocumento: cliente.numeroDocumento,
        nombre: cliente.nombre,
        apellido: cliente.apellido ?? "",
        email: cliente.email ?? "",
        telefono: cliente.telefono ?? "",
        whatsapp: cliente.whatsapp ?? "",
        direccion: cliente.direccion ?? "",
        ciudad: cliente.ciudad ?? "",
        notas: cliente.notas ?? "",
      });
    } else {
      reset({ tipoDocumento: "CC", numeroDocumento: "", nombre: "" });
    }
  }, [cliente, reset]);

  const onSubmit = async (data: FormValues) => {
    if (cliente) {
      await actualizar.mutateAsync({ id: cliente.id, version: cliente.version, ...data });
    } else {
      await crear.mutateAsync(data);
    }
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
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">{cliente ? "Editar cliente" : "Nuevo cliente"}</h2>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Tipo doc.</label>
                    <select
                      {...register("tipoDocumento")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="CC">Cédula</option>
                      <option value="CE">Cédula extranjería</option>
                      <option value="NIT">NIT</option>
                      <option value="PASAPORTE">Pasaporte</option>
                      <option value="TI">Tarjeta identidad</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Número</label>
                    <input
                      {...register("numeroDocumento")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.numeroDocumento && (
                      <p className="text-xs text-destructive">{errors.numeroDocumento.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Nombre</label>
                    <input
                      {...register("nombre")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Apellido</label>
                    <input
                      {...register("apellido")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Email</label>
                  <input
                    {...register("email")}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Teléfono</label>
                    <input
                      {...register("telefono")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">WhatsApp</label>
                    <input
                      {...register("whatsapp")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Dirección</label>
                    <input
                      {...register("direccion")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Ciudad</label>
                    <input
                      {...register("ciudad")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Notas</label>
                  <textarea
                    {...register("notas")}
                    rows={3}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
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
                  {isSubmitting ? "Guardando..." : cliente ? "Guardar cambios" : "Crear cliente"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
