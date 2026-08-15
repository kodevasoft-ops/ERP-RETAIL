import { useEffect, useState } from "react";
import { Search, Bell, CheckCheck, Menu } from "lucide-react";
import { useNotificaciones, useContarNoLeidas, useMarcarTodasLeidas } from "@/pages/notificaciones/use-notificaciones";
import { cn } from "@/lib/utils";

export function Header({ onAbrirMenuMovil }: { onAbrirMenuMovil?: () => void }) {
  const [showHint, setShowHint] = useState(true);
  const [panelAbierto, setPanelAbierto] = useState(false);
  const [busquedaMovilAbierta, setBusquedaMovilAbierta] = useState(false);

  const { data: noLeidas } = useContarNoLeidas();
  const { data: notificaciones } = useNotificaciones();
  const marcarTodas = useMarcarTodasLeidas();

  useEffect(() => {
    const onKeydown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        // TODO: abrir Command Palette global (productos, clientes, facturas...)
        setShowHint(false);
      }
    };
    window.addEventListener("keydown", onKeydown);
    return () => window.removeEventListener("keydown", onKeydown);
  }, []);

  return (
    <header className="relative flex h-14 items-center justify-between gap-2 border-b border-border px-3 sm:px-6">
      <div className="flex items-center gap-2">
        <button
          onClick={onAbrirMenuMovil}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>

        {/* Desktop/tablet: buscador siempre visible */}
        <button className="hidden items-center gap-2 rounded-md border border-border bg-muted/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted sm:flex sm:w-64 lg:w-80">
          <Search size={15} />
          <span className="flex-1 text-left">Buscar productos, clientes, facturas...</span>
          {showHint && (
            <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 text-xs lg:inline">
              Ctrl K
            </kbd>
          )}
        </button>
      </div>

      {/* Móvil: ícono de búsqueda que expande un input a todo el ancho */}
      <div className="flex flex-1 justify-end sm:hidden">
        {busquedaMovilAbierta ? (
          <input
            autoFocus
            onBlur={() => setBusquedaMovilAbierta(false)}
            placeholder="Buscar..."
            className="w-full rounded-md border border-border bg-background px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-primary"
          />
        ) : (
          <button
            onClick={() => setBusquedaMovilAbierta(true)}
            className="rounded-md p-2 text-muted-foreground hover:bg-muted"
            aria-label="Buscar"
          >
            <Search size={18} />
          </button>
        )}
      </div>

      {!busquedaMovilAbierta && (
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="relative">
            <button
              onClick={() => setPanelAbierto((v) => !v)}
              className="relative rounded-md p-2 text-muted-foreground hover:bg-muted"
              aria-label="Notificaciones"
            >
              <Bell size={18} />
              {!!noLeidas && noLeidas > 0 && (
                <span className="absolute right-1 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-destructive text-[9px] font-medium text-white">
                  {noLeidas > 9 ? "9+" : noLeidas}
                </span>
              )}
            </button>

            {panelAbierto && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setPanelAbierto(false)} />
                <div className="fixed inset-x-3 top-14 z-50 rounded-lg border border-border bg-card shadow-lg sm:absolute sm:inset-x-auto sm:right-0 sm:top-11 sm:w-80">
                  <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
                    <span className="text-sm font-medium">Notificaciones</span>
                    <button
                      onClick={() => marcarTodas.mutate()}
                      className="flex items-center gap-1 text-xs text-primary hover:opacity-80"
                    >
                      <CheckCheck size={13} /> Marcar todas
                    </button>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notificaciones?.length === 0 && (
                      <p className="px-4 py-6 text-center text-xs text-muted-foreground">Sin notificaciones.</p>
                    )}
                    {notificaciones?.map((n) => (
                      <div
                        key={n.id}
                        className={cn("border-b border-border px-4 py-2.5 text-sm last:border-0", !n.leida && "bg-primary/5")}
                      >
                        <p className="font-medium">{n.titulo}</p>
                        <p className="text-xs text-muted-foreground">{n.mensaje}</p>
                        <p className="mt-0.5 text-[10px] text-muted-foreground">
                          {new Date(n.createdAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
          <div className="h-8 w-8 shrink-0 rounded-full bg-primary/10" />
        </div>
      )}
    </header>
  );
}
