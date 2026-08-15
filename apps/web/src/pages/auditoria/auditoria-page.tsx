import { useState } from "react";
import { ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import { useAuditoria, useModulosAuditoria, type RegistroAuditoria } from "./use-auditoria";
import { cn } from "@/lib/utils";

export default function AuditoriaPage() {
  const [page, setPage] = useState(1);
  const [modulo, setModulo] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [seleccionado, setSeleccionado] = useState<RegistroAuditoria | null>(null);

  const { data: modulos } = useModulosAuditoria();
  const { data, isLoading } = useAuditoria({ page, limit: 30, modulo, search: search || undefined });

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight">
          <ShieldCheck size={20} className="text-muted-foreground" /> Auditoría
        </h1>
        <p className="text-sm text-muted-foreground">Registro de toda la actividad del sistema — quién, qué, cuándo.</p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Buscar acción o ID..."
            className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <button
          onClick={() => {
            setModulo(undefined);
            setPage(1);
          }}
          className={cn(
            "rounded-full px-2.5 py-1 text-xs font-medium",
            !modulo ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70",
          )}
        >
          Todos
        </button>
        {modulos?.map((m) => (
          <button
            key={m.modulo}
            onClick={() => {
              setModulo(m.modulo);
              setPage(1);
            }}
            className={cn(
              "rounded-full px-2.5 py-1 text-xs font-medium capitalize",
              modulo === m.modulo ? "bg-foreground text-background" : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            {m.modulo} <span className="opacity-60">{m.total}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
                <th className="px-4 py-2.5 text-left font-medium">Usuario</th>
                <th className="px-4 py-2.5 text-left font-medium">Módulo</th>
                <th className="px-4 py-2.5 text-left font-medium">Acción</th>
                <th className="px-4 py-2.5 text-left font-medium">Resultado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Cargando...
                  </td>
                </tr>
              )}
              {data?.data.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSeleccionado(r)}
                  className={cn("cursor-pointer hover:bg-muted/30", seleccionado?.id === r.id && "bg-primary/5")}
                >
                  <td className="px-4 py-2.5 text-muted-foreground">
                    {new Date(r.createdAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td className="px-4 py-2.5">{r.usuario ? `${r.usuario.nombre} ${r.usuario.apellido}` : "Sistema"}</td>
                  <td className="px-4 py-2.5 capitalize text-muted-foreground">{r.modulo}</td>
                  <td className="px-4 py-2.5 font-medium">{r.accion}</td>
                  <td className="px-4 py-2.5">
                    <span
                      className={cn(
                        "rounded-full px-2 py-0.5 text-xs font-medium",
                        r.resultado === "exito" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                      )}
                    >
                      {r.resultado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {data && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border px-4 py-2.5 text-sm text-muted-foreground">
              <span>
                {data.meta.total} registros · página {page} de {data.meta.totalPages}
              </span>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="rounded-md border border-border p-1.5 disabled:opacity-40">
                  <ChevronLeft size={15} />
                </button>
                <button
                  disabled={page >= data.meta.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded-md border border-border p-1.5 disabled:opacity-40"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          {!seleccionado ? (
            <p className="text-sm text-muted-foreground">Selecciona un registro para ver el detalle.</p>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Entidad afectada</p>
                <p className="font-mono text-xs">{seleccionado.entidadId ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">IP</p>
                <p>{seleccionado.ip ?? "—"}</p>
              </div>
              {seleccionado.antes != null && (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Antes</p>
                  <pre className="max-h-40 overflow-auto rounded-md bg-muted/50 p-2 text-[10px]">
                    {JSON.stringify(seleccionado.antes, null, 2)}
                  </pre>
                </div>
              )}
              {seleccionado.despues != null && (
                <div>
                  <p className="mb-1 text-xs text-muted-foreground">Después</p>
                  <pre className="max-h-40 overflow-auto rounded-md bg-muted/50 p-2 text-[10px]">
                    {JSON.stringify(seleccionado.despues, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
