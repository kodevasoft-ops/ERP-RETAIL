import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrearRol, useActualizarRol, type Rol } from "../use-roles";
import { PermisosMatrix } from "./permisos-matrix";

interface FormValues {
  nombre: string;
  descripcion?: string;
}

export function RolDrawer({ open, onClose, rol }: { open: boolean; onClose: () => void; rol?: Rol | null }) {
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set());
  const crear = useCrearRol();
  const actualizar = useActualizarRol();
  const esSistema = rol?.esSistema ?? false;

  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    if (rol) {
      reset({ nombre: rol.nombre, descripcion: rol.descripcion ?? "" });
      setSeleccionados(new Set(rol.permisos.map((p) => `${p.permiso.modulo}:${p.permiso.accion}`)));
    } else {
      reset({ nombre: "", descripcion: "" });
      setSeleccionados(new Set());
    }
  }, [rol, reset]);

  const toggle = (modulo: string, accion: string) => {
    const key = `${modulo}:${accion}`;
    setSeleccionados((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const onSubmit = async (data: FormValues) => {
    const permisos = Array.from(seleccionados).map((key) => {
      const [modulo, accion] = key.split(":");
      return { modulo, accion };
    });

    if (rol) {
      await actualizar.mutateAsync({ id: rol.id, version: rol.version, ...data, permisos });
    } else {
      await crear.mutateAsync({ ...data, permisos });
    }
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
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-2xl flex-col border-l border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">{rol ? "Editar rol" : "Nuevo rol"}</h2>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                {esSistema && (
                  <p className="rounded-md bg-warning/10 px-3 py-2 text-xs text-warning">
                    Este es un rol del sistema y no se puede modificar.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Nombre</label>
                    <input
                      disabled={esSistema}
                      {...register("nombre", { required: true })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Descripción</label>
                    <input
                      disabled={esSistema}
                      {...register("descripcion")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-medium">
                    Permisos ({seleccionados.size} seleccionados)
                  </label>
                  <PermisosMatrix seleccionados={seleccionados} onToggle={toggle} disabled={esSistema} />
                </div>
              </div>

              {!esSistema && (
                <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                  <button type="button" onClick={onClose} className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted">
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || seleccionados.size === 0}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {isSubmitting ? "Guardando..." : rol ? "Guardar cambios" : "Crear rol"}
                  </button>
                </div>
              )}
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
