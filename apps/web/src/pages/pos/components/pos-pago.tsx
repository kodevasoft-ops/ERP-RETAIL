import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { PagoInput } from "../use-pos";

const METODOS: { value: PagoInput["metodo"]; label: string }[] = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA_DEBITO", label: "Tarjeta débito" },
  { value: "TARJETA_CREDITO", label: "Tarjeta crédito" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "CREDITO", label: "Crédito cliente" },
];

interface Props {
  total: number;
  pagos: PagoInput[];
  onChange: (pagos: PagoInput[]) => void;
}

export function PosPago({ total, pagos, onChange }: Props) {
  const [metodo, setMetodo] = useState<PagoInput["metodo"]>("EFECTIVO");
  const totalPagado = pagos.reduce((s, p) => s + p.monto, 0);
  const restante = total - totalPagado;

  const agregarPago = () => {
    if (restante <= 0) return;
    onChange([...pagos, { metodo, monto: Math.round(restante) }]);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Total a pagar</span>
        <span className="font-semibold">
          {total.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
        </span>
      </div>

      {pagos.map((pago, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="flex-1 text-xs text-muted-foreground">
            {METODOS.find((m) => m.value === pago.metodo)?.label}
          </span>
          <input
            type="number"
            value={pago.monto}
            onChange={(e) => {
              const next = [...pagos];
              next[i] = { ...next[i], monto: Number(e.target.value) };
              onChange(next);
            }}
            className="w-28 rounded-md border border-border bg-background px-2 py-1 text-right text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={() => onChange(pagos.filter((_, idx) => idx !== i))}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 size={13} />
          </button>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <select
          value={metodo}
          onChange={(e) => setMetodo(e.target.value as PagoInput["metodo"])}
          className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
        >
          {METODOS.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </select>
        <button
          onClick={agregarPago}
          disabled={restante <= 0}
          className="flex items-center gap-1 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-muted disabled:opacity-40"
        >
          <Plus size={13} /> Agregar
        </button>
      </div>

      <div className="flex items-center justify-between border-t border-border pt-2 text-sm">
        <span className="text-muted-foreground">
          {restante > 0 ? "Falta por pagar" : restante < 0 ? "Cambio" : "Completo"}
        </span>
        <span className={restante === 0 ? "font-medium text-success" : "font-medium text-warning"}>
          {Math.abs(restante).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
        </span>
      </div>
    </div>
  );
}
