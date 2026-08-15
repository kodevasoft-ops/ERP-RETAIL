import { useState } from "react";
import { Lock, Unlock, ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { useSesionActiva, useResumenSesion, useAbrirCaja, useMovimientoCaja, useCerrarCaja } from "./use-caja";

function money(n: number | string) {
  return Number(n).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

export default function CajaPage() {
  const { data: activa, isLoading } = useSesionActiva();
  const { data: resumen } = useResumenSesion(activa?.id ?? null);
  const abrir = useAbrirCaja();
  const movimiento = useMovimientoCaja(activa?.id ?? null);
  const cerrar = useCerrarCaja(activa?.id ?? null);

  const [montoApertura, setMontoApertura] = useState(0);
  const [montoCierre, setMontoCierre] = useState(0);

  if (isLoading) return <p className="text-sm text-muted-foreground">Cargando estado de caja...</p>;

  if (!activa) {
    return (
      <div className="mx-auto max-w-sm space-y-4 animate-fade-in rounded-lg border border-border bg-card p-6 text-center">
        <Unlock size={32} className="mx-auto text-muted-foreground" />
        <div>
          <h2 className="text-sm font-semibold">Caja cerrada</h2>
          <p className="text-xs text-muted-foreground">Abre la caja para empezar a registrar ventas en efectivo.</p>
        </div>
        <input
          type="number"
          placeholder="Monto de apertura (base)"
          value={montoApertura || ""}
          onChange={(e) => setMontoApertura(Number(e.target.value))}
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-center text-sm outline-none focus:ring-2 focus:ring-primary"
        />
        <button
          onClick={() => abrir.mutate({ montoApertura })}
          disabled={abrir.isPending}
          className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          Abrir caja
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 animate-fade-in">
      <div className="flex items-center justify-between rounded-lg border border-success/30 bg-success/5 px-4 py-3">
        <span className="flex items-center gap-2 text-sm font-medium text-success">
          <Unlock size={15} /> Caja abierta
        </span>
        <span className="text-xs text-muted-foreground">
          desde {new Date(activa.abiertaAt).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Monto de apertura</p>
            <p className="font-semibold">{money(activa.montoApertura)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Esperado en caja ahora</p>
            <p className="font-semibold">{resumen ? money(resumen.montoEsperado ?? 0) : "—"}</p>
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">Registrar movimiento</h3>
        <MovimientoForm onSubmit={(tipo, monto, motivo) => movimiento.mutate({ tipo, monto, motivo })} />
      </div>

      {resumen && resumen.movimientos.length > 0 && (
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="mb-2 text-xs font-medium text-muted-foreground">Movimientos de la sesión</h3>
          <div className="space-y-1.5">
            {resumen.movimientos.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  {m.tipo === "INGRESO" ? (
                    <ArrowDownCircle size={13} className="text-success" />
                  ) : (
                    <ArrowUpCircle size={13} className="text-destructive" />
                  )}
                  {m.motivo}
                </span>
                <span className={m.tipo === "INGRESO" ? "text-success" : "text-destructive"}>
                  {m.tipo === "INGRESO" ? "+" : "-"}
                  {money(m.monto)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="mb-2 text-xs font-medium text-muted-foreground">Cerrar caja (arqueo)</h3>
        <div className="space-y-2">
          <input
            type="number"
            placeholder="Monto contado físicamente"
            value={montoCierre || ""}
            onChange={(e) => setMontoCierre(Number(e.target.value))}
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
          {montoCierre > 0 && resumen && (
            <p className="text-xs text-muted-foreground">
              Diferencia: <span className={montoCierre - (resumen.montoEsperado ?? 0) === 0 ? "text-success" : "text-warning"}>
                {money(montoCierre - (resumen.montoEsperado ?? 0))}
              </span>
            </p>
          )}
          <button
            onClick={() => cerrar.mutate({ montoCierreReal: montoCierre })}
            disabled={cerrar.isPending || montoCierre <= 0}
            className="flex w-full items-center justify-center gap-1.5 rounded-md bg-destructive py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            <Lock size={14} /> Cerrar caja
          </button>
        </div>
      </div>
    </div>
  );
}

function MovimientoForm({ onSubmit }: { onSubmit: (tipo: "INGRESO" | "RETIRO", monto: number, motivo: string) => void }) {
  const [tipo, setTipo] = useState<"INGRESO" | "RETIRO">("RETIRO");
  const [monto, setMonto] = useState(0);
  const [motivo, setMotivo] = useState("");

  return (
    <div className="flex items-center gap-2">
      <select value={tipo} onChange={(e) => setTipo(e.target.value as "INGRESO" | "RETIRO")} className="rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary">
        <option value="RETIRO">Retiro</option>
        <option value="INGRESO">Ingreso</option>
      </select>
      <input
        type="number"
        placeholder="Monto"
        value={monto || ""}
        onChange={(e) => setMonto(Number(e.target.value))}
        className="w-24 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <input
        placeholder="Motivo"
        value={motivo}
        onChange={(e) => setMotivo(e.target.value)}
        className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
      />
      <button
        onClick={() => {
          if (monto > 0 && motivo) {
            onSubmit(tipo, monto, motivo);
            setMonto(0);
            setMotivo("");
          }
        }}
        className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
      >
        Registrar
      </button>
    </div>
  );
}
