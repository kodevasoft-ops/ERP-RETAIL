import { useEnvios, useActualizarEnvio, type EstadoEnvio } from "./use-envios";
import { cn } from "@/lib/utils";
import { Truck } from "lucide-react";

const SIGUIENTE: Partial<Record<EstadoEnvio, EstadoEnvio>> = {
  PENDIENTE: "DESPACHADO",
  DESPACHADO: "EN_TRANSITO",
  EN_TRANSITO: "ENTREGADO",
};

const ESTADO_LABEL: Record<EstadoEnvio, { label: string; className: string }> = {
  PENDIENTE: { label: "Pendiente", className: "bg-muted text-muted-foreground" },
  DESPACHADO: { label: "Despachado", className: "bg-primary/10 text-primary" },
  EN_TRANSITO: { label: "En tránsito", className: "bg-warning/10 text-warning" },
  ENTREGADO: { label: "Entregado", className: "bg-success/10 text-success" },
  DEVUELTO: { label: "Devuelto", className: "bg-destructive/10 text-destructive" },
};

export default function EnviosPage() {
  const { data, isLoading } = useEnvios({ page: 1, limit: 50 });
  const actualizar = useActualizarEnvio();

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Envíos</h1>
        <p className="text-sm text-muted-foreground">Seguimiento de despachos a domicilio.</p>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Ciudad / Dirección</th>
              <th className="px-4 py-2.5 text-left font-medium">Transportadora</th>
              <th className="px-4 py-2.5 text-left font-medium">Guía</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando envíos...
                </td>
              </tr>
            )}
            {data?.data.map((e) => (
              <tr key={e.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5">
                  <p className="font-medium">{e.ciudad}</p>
                  <p className="text-xs text-muted-foreground">{e.direccion}</p>
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.transportadora?.nombre ?? "—"}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{e.numeroGuia ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ESTADO_LABEL[e.estado].className)}>
                    {ESTADO_LABEL[e.estado].label}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  {SIGUIENTE[e.estado] && (
                    <button
                      onClick={() => actualizar.mutate({ id: e.id, version: e.version, estado: SIGUIENTE[e.estado] })}
                      className="flex items-center gap-1 text-xs font-medium text-primary hover:opacity-80"
                    >
                      <Truck size={13} /> Marcar {ESTADO_LABEL[SIGUIENTE[e.estado]!].label.toLowerCase()}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
