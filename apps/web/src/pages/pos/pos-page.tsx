import { useEffect, useMemo, useState } from "react";
import { X, ShoppingCart, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate, useSearchParams } from "react-router-dom";
import { PosBuscador } from "./components/pos-buscador";
import { CarritoContenido } from "./components/carrito-contenido";
import { useCheckout, type CarritoItem, type PagoInput } from "./use-pos";
import { apiClient } from "@/lib/api-client";

// TODO: obtener de la sesión activa (contexto de usuario/sucursal)
const SUCURSAL_ACTUAL = "00000000-0000-0000-0000-000000000000";

function calcularTotales(items: CarritoItem[]) {
  let subtotal = 0;
  let iva = 0;
  for (const item of items) {
    const bruto = item.precioUnitario * item.cantidad;
    const descuento = bruto * (item.descuentoPorcentaje / 100);
    const base = bruto - descuento;
    subtotal += base;
    iva += base * (item.ivaPorcentaje / 100);
  }
  return { subtotal, iva, total: subtotal + iva };
}

export default function PosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const cotizacionId = searchParams.get("cotizacionId");
  const [carrito, setCarrito] = useState<CarritoItem[]>([]);
  const [pagos, setPagos] = useState<PagoInput[]>([]);
  const [idempotencyKey, setIdempotencyKey] = useState(() => crypto.randomUUID());
  const [ventaExitosa, setVentaExitosa] = useState<number | null>(null);
  const [carritoMovilAbierto, setCarritoMovilAbierto] = useState(false);

  const checkout = useCheckout();
  const { subtotal, iva, total } = useMemo(() => calcularTotales(carrito), [carrito]);

  // Si se abrió el POS desde una cotización aceptada, precarga el carrito
  // con sus líneas exactas (precio y descuento congelados en la cotización).
  useEffect(() => {
    if (!cotizacionId) return;
    apiClient.get(`/cotizaciones/${cotizacionId}`).then(({ data }) => {
      const items: CarritoItem[] = data.items.map((item: any) => ({
        varianteId: item.varianteId,
        productoNombre: item.variante?.producto?.nombre ?? "Producto",
        talla: item.variante?.talla ?? "",
        color: item.variante?.color ?? "",
        sku: item.variante?.sku ?? "",
        precioUnitario: Number(item.precioUnitario),
        ivaPorcentaje: Number(item.ivaPorcentaje),
        descuentoMax: 100,
        stockDisponible: 9999,
        cantidad: item.cantidad,
        descuentoPorcentaje: Number(item.descuentoPorcentaje),
      }));
      setCarrito(items);
    });
  }, [cotizacionId]);

  const agregarAlCarrito = (item: CarritoItem) => {
    setCarrito((prev) => {
      const existente = prev.find((i) => i.varianteId === item.varianteId);
      if (existente) {
        return prev.map((i) =>
          i.varianteId === item.varianteId
            ? { ...i, cantidad: Math.min(i.stockDisponible, i.cantidad + 1) }
            : i,
        );
      }
      return [...prev, item];
    });
  };

  const finalizarVenta = async () => {
    try {
      const venta = await checkout.mutateAsync({
        sucursalId: SUCURSAL_ACTUAL,
        items: carrito.map((i) => ({
          varianteId: i.varianteId,
          cantidad: i.cantidad,
          descuentoPorcentaje: i.descuentoPorcentaje,
        })),
        pagos,
        idempotencyKey,
        ...(cotizacionId && { cotizacionId }),
      });
      setVentaExitosa(venta.numero);
      setCarrito([]);
      setCarritoMovilAbierto(false);
      setPagos([]);
      setIdempotencyKey(crypto.randomUUID()); // nueva key solo tras éxito
    } catch {
      // El error se muestra vía checkout.error; la key se mantiene para
      // permitir reintentar sin duplicar el cobro.
    }
  };

  const totalPagado = pagos.reduce((s, p) => s + p.monto, 0);
  const puedeCompletar = carrito.length > 0 && Math.abs(totalPagado - total) < 1;

  if (ventaExitosa !== null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-background">
        <CheckCircle2 size={56} className="text-success" />
        <div className="text-center">
          <p className="text-lg font-semibold">Venta #{ventaExitosa} completada</p>
          <p className="text-sm text-muted-foreground">El inventario se actualizó automáticamente.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setVentaExitosa(null)}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            Nueva venta
          </button>
          <button
            onClick={() => navigate("/ventas")}
            className="rounded-md border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Ver historial
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <h1 className="flex items-center gap-2 text-sm font-semibold">
          <ShoppingCart size={16} /> Punto de venta
        </h1>
        <button onClick={() => navigate("/")} className="rounded-md p-1.5 hover:bg-muted" aria-label="Cerrar POS">
          <X size={18} />
        </button>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex-1 overflow-hidden p-3 sm:p-4">
          <PosBuscador onAgregar={agregarAlCarrito} />
        </div>

        {/* Desktop/tablet ancho: carrito fijo a la derecha */}
        <div className="hidden w-96 shrink-0 flex-col border-l border-border p-4 lg:flex">
          <CarritoContenido
            carrito={carrito}
            setCarrito={setCarrito}
            pagos={pagos}
            setPagos={setPagos}
            subtotal={subtotal}
            iva={iva}
            total={total}
            checkout={checkout}
            finalizarVenta={finalizarVenta}
            puedeCompletar={puedeCompletar}
          />
        </div>

        {/* Móvil/tablet angosta: botón flotante que abre el carrito como hoja inferior */}
        <div className="lg:hidden">
          <button
            onClick={() => setCarritoMovilAbierto(true)}
            disabled={carrito.length === 0}
            className="fixed bottom-4 left-4 right-4 z-30 flex items-center justify-between rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground shadow-lg disabled:opacity-40"
          >
            <span className="flex items-center gap-2">
              <ShoppingCart size={16} />
              {carrito.length} {carrito.length === 1 ? "producto" : "productos"}
            </span>
            <span>{total.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}</span>
          </button>

          <AnimatePresence>
            {carritoMovilAbierto && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setCarritoMovilAbierto(false)}
                  className="fixed inset-0 z-40 bg-black/40"
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-border bg-card p-4"
                >
                  <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-muted" />
                  <CarritoContenido
                    carrito={carrito}
                    setCarrito={setCarrito}
                    pagos={pagos}
                    setPagos={setPagos}
                    subtotal={subtotal}
                    iva={iva}
                    total={total}
                    checkout={checkout}
                    finalizarVenta={finalizarVenta}
                    puedeCompletar={puedeCompletar}
                  />
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
