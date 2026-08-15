import { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { useHistorialPuntos, useAcumularPuntos, useRedimirPuntos } from "../use-fidelizacion";
import type { Cliente } from "@/pages/clientes/clientes.types";

const TIPO_LABEL: Record<string, string> = {
  ACUMULACION: "Acumulación",
  REDENCION: "Redención",
  AJUSTE: "Ajuste",
  EXPIRACION: "Expiración",
};

export function PuntosPanel({ cliente }: { cliente: Cliente }) {
  const { data } = useHistorialPuntos(cliente.id);
  const acumular = useAcumularPuntos(cliente.id);
  const redimir = useRedimirPuntos(cliente.id);
  const [puntos, setPuntos] = useState(0);
  const [motivo, setMotivo] = useState("");

  const ejecutar = async (accion: "acumular" | "redimir") => {
    if (puntos <= 0 || !motivo.trim()) return;
    if (accion === "acumular") await acumular.mutateAsync({ puntos, motivo });
    else await redimir.mutateAsync({ puntos, motivo });
    setPuntos(0);
    setMotivo("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border bg-card p-4 text-center">
        <p className="text-xs text-muted-foreground">Saldo de puntos</p>
        <p className="text-3xl font-semibold text-primary">{data?.saldoActual ?? cliente.puntosFidelizacion}</p>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-medium">Ajustar puntos</h3>
        <div className="flex gap-2">
          <input
            type="number"
            value={puntos || ""}
            onChange={(e) => setPuntos(Number(e.target.value))}
            placeholder="Puntos"
            className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Motivo"
            className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => ejecutar("acumular")}
            className="flex flex-1 items-center justify-center gap-1 rounded-md bg-success py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            <Plus size={14} /> Acumular
          </button>
          <button
            onClick={() => ejecutar("redimir")}
            className="flex flex-1 items-center justify-center gap-1 rounded-md border border-border py-1.5 text-sm hover:bg-muted"
          >
            <Minus size={14} /> Redimir
          </button>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 text-sm font-medium">Historial</h3>
        <div className="space-y-1.5">
          {data?.movimientos.length === 0 && <p className="text-xs text-muted-foreground">Sin movimientos aún.</p>}
          {data?.movimientos.map((m) => (
            <div key={m.id} className="flex items-center justify-between text-sm">
              <div>
                <span className="text-muted-foreground">{TIPO_LABEL[m.tipo]}</span>
                <p className="text-xs text-muted-foreground">{m.motivo}</p>
              </div>
              <span className={m.puntos >= 0 ? "font-medium text-success" : "font-medium text-destructive"}>
                {m.puntos >= 0 ? "+" : ""}
                {m.puntos}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
