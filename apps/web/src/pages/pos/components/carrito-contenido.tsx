import type { UseMutationResult } from "@tanstack/react-query";
import { PosCarrito } from "./pos-carrito";
import { PosPago } from "./pos-pago";
import type { CarritoItem, PagoInput, Venta, CheckoutInput } from "../use-pos";

interface Props {
  carrito: CarritoItem[];
  setCarrito: React.Dispatch<React.SetStateAction<CarritoItem[]>>;
  pagos: PagoInput[];
  setPagos: React.Dispatch<React.SetStateAction<PagoInput[]>>;
  subtotal: number;
  iva: number;
  total: number;
  checkout: UseMutationResult<Venta, unknown, CheckoutInput>;
  finalizarVenta: () => void;
  puedeCompletar: boolean;
}

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export function CarritoContenido({
  carrito,
  setCarrito,
  pagos,
  setPagos,
  subtotal,
  iva,
  total,
  checkout,
  finalizarVenta,
  puedeCompletar,
}: Props) {
  return (
    <>
      <PosCarrito
        items={carrito}
        onCambiarCantidad={(id, cantidad) =>
          setCarrito((prev) => prev.map((i) => (i.varianteId === id ? { ...i, cantidad } : i)))
        }
        onCambiarDescuento={(id, descuento) =>
          setCarrito((prev) => prev.map((i) => (i.varianteId === id ? { ...i, descuentoPorcentaje: descuento } : i)))
        }
        onQuitar={(id) => setCarrito((prev) => prev.filter((i) => i.varianteId !== id))}
      />

      <div className="mt-4 space-y-2 overflow-y-auto border-t border-border pt-4">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Subtotal</span>
          <span>{money(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>IVA</span>
          <span>{money(iva)}</span>
        </div>
        <div className="flex justify-between text-base font-semibold">
          <span>Total</span>
          <span>{money(total)}</span>
        </div>

        <PosPago total={total} pagos={pagos} onChange={setPagos} />

        {checkout.isError && (
          <p className="text-xs text-destructive">
            {(checkout.error as { response?: { data?: { message?: string } } })?.response?.data?.message ??
              "No se pudo completar la venta."}
          </p>
        )}

        <button
          onClick={finalizarVenta}
          disabled={!puedeCompletar || checkout.isPending}
          className="w-full rounded-md bg-primary py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {checkout.isPending ? "Procesando..." : "Finalizar venta"}
        </button>
      </div>
    </>
  );
}
