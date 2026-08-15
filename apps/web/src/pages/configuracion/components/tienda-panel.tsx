import { useState, useEffect } from "react";
import { Copy, Check, ExternalLink } from "lucide-react";
import { useEmpresa, useActualizarEmpresa } from "../use-configuracion";

export function TiendaPanel() {
  const { data: empresa, isLoading } = useEmpresa();
  const actualizar = useActualizarEmpresa();
  const [whatsapp, setWhatsapp] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (empresa) {
      setWhatsapp(empresa.whatsappVentas ?? "");
      setDescripcion(empresa.descripcionTienda ?? "");
    }
  }, [empresa]);

  if (isLoading || !empresa) return <p className="text-sm text-muted-foreground">Cargando...</p>;

  const enlaceTienda = `${window.location.origin}/tienda/${empresa.id}`;

  const copiarEnlace = () => {
    navigator.clipboard.writeText(enlaceTienda);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="space-y-4 rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Tienda en línea</h3>
          <p className="text-xs text-muted-foreground">Catálogo público donde tus clientes compran por WhatsApp.</p>
        </div>
        <label className="relative inline-flex cursor-pointer items-center">
          <input
            type="checkbox"
            checked={empresa.tiendaActiva}
            onChange={(e) => actualizar.mutate({ tiendaActiva: e.target.checked })}
            className="peer sr-only"
          />
          <div className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-success" />
          <div className="absolute left-1 h-4 w-4 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
        </label>
      </div>

      {empresa.tiendaActiva && (
        <>
          <div className="flex items-center gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs">
            <span className="flex-1 truncate font-mono">{enlaceTienda}</span>
            <button onClick={copiarEnlace} className="flex items-center gap-1 text-primary hover:opacity-80">
              {copiado ? <Check size={13} /> : <Copy size={13} />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
            <a href={enlaceTienda} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground">
              <ExternalLink size={13} />
            </a>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Número de WhatsApp para pedidos</label>
            <input
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              onBlur={() => actualizar.mutate({ whatsappVentas: whatsapp })}
              placeholder="573001234567 (código de país, sin +)"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium">Descripción corta de la tienda</label>
            <input
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              onBlur={() => actualizar.mutate({ descripcionTienda: descripcion })}
              placeholder="Ej: Ropa y accesorios para toda la familia"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </>
      )}
    </div>
  );
}
