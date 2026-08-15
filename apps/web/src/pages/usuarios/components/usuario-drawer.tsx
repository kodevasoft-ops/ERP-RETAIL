import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { X, KeyRound } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCrearUsuario, useActualizarUsuario, useResetPassword, type Usuario } from "../use-usuarios";
import { useRoles } from "@/pages/roles/use-roles";

interface FormValues {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
}

export function UsuarioDrawer({ open, onClose, usuario }: { open: boolean; onClose: () => void; usuario?: Usuario | null }) {
  const { data: roles } = useRoles();
  const [rolesSeleccionados, setRolesSeleccionados] = useState<string[]>([]);
  const crear = useCrearUsuario();
  const actualizar = useActualizarUsuario();
  const resetPassword = useResetPassword();

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>();

  useEffect(() => {
    if (usuario) {
      reset({ email: usuario.email, nombre: usuario.nombre, apellido: usuario.apellido });
      setRolesSeleccionados(usuario.roles.map((r) => r.rol.id));
    } else {
      reset({ email: "", password: "", nombre: "", apellido: "" });
      setRolesSeleccionados([]);
    }
  }, [usuario, reset]);

  const onSubmit = async (data: FormValues) => {
    if (usuario) {
      await actualizar.mutateAsync({
        id: usuario.id,
        version: usuario.version,
        nombre: data.nombre,
        apellido: data.apellido,
        rolIds: rolesSeleccionados,
      });
    } else {
      await crear.mutateAsync({ ...data, rolIds: rolesSeleccionados });
    }
    onClose();
  };

  const handleReset = async () => {
    if (!usuario) return;
    const nueva = window.prompt("Nueva contraseña temporal (mín. 8 caracteres):");
    if (!nueva || nueva.length < 8) return;
    await resetPassword.mutateAsync({ id: usuario.id, nuevaPassword: nueva });
    window.alert("Contraseña actualizada. Todas las sesiones activas del usuario fueron cerradas.");
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
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">{usuario ? "Editar usuario" : "Nuevo usuario"}</h2>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Nombre</label>
                    <input {...register("nombre", { required: true })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Apellido</label>
                    <input {...register("apellido", { required: true })} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Correo</label>
                  <input
                    type="email"
                    disabled={!!usuario}
                    {...register("email", { required: true })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-60"
                  />
                  {errors.email && <p className="text-xs text-destructive">Requerido</p>}
                </div>

                {!usuario && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Contraseña temporal</label>
                    <input
                      type="password"
                      {...register("password", { required: !usuario, minLength: 8 })}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.password && <p className="text-xs text-destructive">Mínimo 8 caracteres</p>}
                  </div>
                )}

                {usuario && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs font-medium text-primary hover:opacity-80"
                  >
                    <KeyRound size={13} /> Restablecer contraseña
                  </button>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-medium">Roles</label>
                  <div className="space-y-1.5">
                    {roles?.map((rol) => (
                      <label key={rol.id} className="flex items-center gap-2 rounded-md border border-border p-2 text-sm">
                        <input
                          type="checkbox"
                          checked={rolesSeleccionados.includes(rol.id)}
                          onChange={(e) =>
                            setRolesSeleccionados((prev) =>
                              e.target.checked ? [...prev, rol.id] : prev.filter((id) => id !== rol.id),
                            )
                          }
                        />
                        <span>{rol.nombre}</span>
                        {rol.esSistema && <span className="text-xs text-muted-foreground">(sistema)</span>}
                      </label>
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
                  disabled={isSubmitting || rolesSeleccionados.length === 0}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : usuario ? "Guardar cambios" : "Crear usuario"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
