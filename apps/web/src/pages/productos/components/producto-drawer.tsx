import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { X, Plus, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { useCrearProducto, useActualizarProducto } from "../use-productos";
import type { Producto } from "../productos.types";
import { ImageUploader, type ImagenSubida } from "@/components/shared/image-uploader";
import { apiClient } from "@/lib/api-client";

const varianteSchema = z.object({
  sucursalId: z.string().uuid("Selecciona una sucursal"),
  talla: z.string().min(1, "Requerido"),
  color: z.string().min(1, "Requerido"),
  sku: z.string().min(1, "Requerido"),
  codigoBarras: z.string().optional(),
  stock: z.coerce.number().min(0),
  stockMinimo: z.coerce.number().min(0),
  costoCompra: z.coerce.number().min(0),
  precioVenta: z.coerce.number().min(0),
  precioMayorista: z.coerce.number().min(0).optional(),
  precioVip: z.coerce.number().min(0).optional(),
});

const productoSchema = z.object({
  codigo: z.string().min(1, "Requerido"),
  nombre: z.string().min(1, "Requerido"),
  descripcion: z.string().optional(),
  variantes: z.array(varianteSchema).min(1, "Agrega al menos una variante"),
});

type ProductoForm = z.infer<typeof productoSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  producto?: Producto | null;
  sucursalIdDefault: string;
}

export function ProductoDrawer({ open, onClose, producto, sucursalIdDefault }: Props) {
  const crear = useCrearProducto();
  const actualizar = useActualizarProducto();
  const [imagenes, setImagenes] = useState<ImagenSubida[]>([]);

  // Sincroniza contra el backend cada vez que la selección de imágenes
  // cambia: agrega la nueva o refleja el cambio de "principal". No espera
  // al submit del formulario — las fotos se guardan en vivo.
  const handleCambiarImagenes = async (nuevas: ImagenSubida[]) => {
    if (!producto) return;
    const anteriores = imagenes;
    setImagenes(nuevas);

    const agregada = nuevas.find((n) => !anteriores.some((a) => a.url === n.url));
    if (agregada) {
      await apiClient.post(`/productos/${producto.id}/imagenes`, { url: agregada.url, esPrincipal: agregada.esPrincipal });
      return;
    }

    const quitada = anteriores.find((a) => !nuevas.some((n) => n.url === a.url));
    if (quitada) {
      const imagenOriginal = producto.imagenes.find((i) => i.url === quitada.url);
      if (imagenOriginal) await apiClient.delete(`/productos/${producto.id}/imagenes/${imagenOriginal.id}`);
      return;
    }

    // Solo cambió cuál es la principal: usa el endpoint dedicado (nunca
    // reenvía la URL como si fuera nueva, o crearía un duplicado).
    const nuevaPrincipal = nuevas.find((n) => n.esPrincipal);
    const anteriorPrincipal = anteriores.find((a) => a.esPrincipal);
    if (nuevaPrincipal && nuevaPrincipal.url !== anteriorPrincipal?.url) {
      const imagenOriginal = producto.imagenes.find((i) => i.url === nuevaPrincipal.url);
      if (imagenOriginal) await apiClient.patch(`/productos/${producto.id}/imagenes/${imagenOriginal.id}/principal`);
    }
  };

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductoForm>({
    resolver: zodResolver(productoSchema),
    defaultValues: {
      codigo: "",
      nombre: "",
      variantes: [
        {
          sucursalId: sucursalIdDefault,
          talla: "",
          color: "",
          sku: "",
          stock: 0,
          stockMinimo: 5,
          costoCompra: 0,
          precioVenta: 0,
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "variantes" });

  useEffect(() => {
    setImagenes(producto?.imagenes.map((i) => ({ url: i.url, esPrincipal: i.esPrincipal })) ?? []);

    if (producto) {
      reset({
        codigo: producto.codigo,
        nombre: producto.nombre,
        descripcion: producto.descripcion ?? "",
        variantes: producto.variantes.map((v) => ({
          sucursalId: v.sucursalId,
          talla: v.talla,
          color: v.color,
          sku: v.sku,
          codigoBarras: v.codigoBarras ?? "",
          stock: v.stock,
          stockMinimo: v.stockMinimo,
          costoCompra: Number(v.costoCompra),
          precioVenta: Number(v.precioVenta),
          precioMayorista: v.precioMayorista ? Number(v.precioMayorista) : undefined,
          precioVip: v.precioVip ? Number(v.precioVip) : undefined,
        })),
      });
    } else {
      reset({
        codigo: "",
        nombre: "",
        variantes: [
          {
            sucursalId: sucursalIdDefault,
            talla: "",
            color: "",
            sku: "",
            stock: 0,
            stockMinimo: 5,
            costoCompra: 0,
            precioVenta: 0,
          },
        ],
      });
    }
  }, [producto, sucursalIdDefault, reset]);

  const onSubmit = async (data: ProductoForm) => {
    if (producto) {
      await actualizar.mutateAsync({ id: producto.id, version: producto.version, ...data });
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
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-xl flex-col border-l border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">
                {producto ? "Editar producto" : "Nuevo producto"}
              </h2>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Código</label>
                    <input
                      {...register("codigo")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.codigo && <p className="text-xs text-destructive">{errors.codigo.message}</p>}
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium">Nombre</label>
                    <input
                      {...register("nombre")}
                      className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                    />
                    {errors.nombre && <p className="text-xs text-destructive">{errors.nombre.message}</p>}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Descripción</label>
                  <textarea
                    {...register("descripcion")}
                    rows={2}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium">Fotos</label>
                  {producto ? (
                    <ImageUploader carpeta="productos" imagenes={imagenes} onChange={handleCambiarImagenes} />
                  ) : (
                    <p className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                      Guarda el producto primero; luego podrás agregar fotos desde "Editar".
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label className="text-xs font-medium">Variantes (talla / color)</label>
                    <button
                      type="button"
                      onClick={() =>
                        append({
                          sucursalId: sucursalIdDefault,
                          talla: "",
                          color: "",
                          sku: "",
                          stock: 0,
                          stockMinimo: 5,
                          costoCompra: 0,
                          precioVenta: 0,
                        })
                      }
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
                    >
                      <Plus size={13} /> Agregar variante
                    </button>
                  </div>
                  {errors.variantes?.root && (
                    <p className="mb-2 text-xs text-destructive">{errors.variantes.root.message}</p>
                  )}

                  <div className="space-y-2">
                    {fields.map((field, i) => (
                      <div key={field.id} className="rounded-md border border-border p-3">
                        <div className="mb-2 grid grid-cols-3 gap-2">
                          <input
                            placeholder="Talla"
                            {...register(`variantes.${i}.talla`)}
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            placeholder="Color"
                            {...register(`variantes.${i}.color`)}
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            placeholder="SKU"
                            {...register(`variantes.${i}.sku`)}
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <input
                            type="number"
                            placeholder="Stock"
                            {...register(`variantes.${i}.stock`)}
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="number"
                            placeholder="Stock mín."
                            {...register(`variantes.${i}.stockMinimo`)}
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="number"
                            placeholder="Costo"
                            {...register(`variantes.${i}.costoCompra`)}
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                          />
                          <input
                            type="number"
                            placeholder="Precio venta"
                            {...register(`variantes.${i}.precioVenta`)}
                            className="rounded-md border border-border bg-background px-2 py-1.5 text-xs outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                        {fields.length > 1 && (
                          <button
                            type="button"
                            onClick={() => remove(i)}
                            className="mt-2 flex items-center gap-1 text-xs text-destructive hover:opacity-80"
                          >
                            <Trash2 size={12} /> Quitar variante
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 border-t border-border px-6 py-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {isSubmitting ? "Guardando..." : producto ? "Guardar cambios" : "Crear producto"}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
