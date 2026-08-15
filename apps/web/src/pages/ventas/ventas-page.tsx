import { useState } from "react";
import { ChevronLeft, ChevronRight, XCircle, FileText, Receipt } from "lucide-react";
import { Link } from "react-router-dom";
import { useVentas, useAnularVenta } from "@/pages/pos/use-pos";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export default function VentasPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useVentas({ page, limit: 20 });
  const anular = useAnularVenta();

  const verDocumento = async (ruta: string) => {
    const response = await apiClient.get(ruta, { responseType: "blob" });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: "application/pdf" }));
    window.open(url, "_blank", "noopener,noreferrer");
    // Revoca la URL en background tras darle tiempo a la pestaña de cargarla.
    setTimeout(() => window.URL.revokeObjectURL(url), 30_000);
  };

  const handleAnular = (id: string) => {
    const motivo = window.prompt("Motivo de anulación (obligatorio):");
    if (!motivo) return;
    anular.mutate({ id, motivo });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Ventas</h1>
          <p className="text-sm text-muted-foreground">Historial de facturación interna.</p>
        </div>
        <Link
          to="/pos"
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Abrir POS
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
            <tr>
              <th className="px-4 py-2.5 text-left font-medium">Número</th>
              <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
              <th className="px-4 py-2.5 text-left font-medium">Ítems</th>
              <th className="px-4 py-2.5 text-right font-medium">Total</th>
              <th className="px-4 py-2.5 text-left font-medium">Estado</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Cargando ventas...
                </td>
              </tr>
            )}
            {data?.data.map((venta) => (
              <tr key={venta.id} className="hover:bg-muted/30">
                <td className="px-4 py-2.5 font-medium">
                  {venta.prefijo}
                  {venta.numero}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">
                  {new Date(venta.createdAt).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" })}
                </td>
                <td className="px-4 py-2.5 text-muted-foreground">{venta._count?.items ?? "—"}</td>
                <td className="px-4 py-2.5 text-right font-medium">
                  {Number(venta.total).toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 })}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      venta.estado === "COMPLETADA" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                    )}
                  >
                    {venta.estado === "COMPLETADA" ? "Completada" : "Anulada"}
                  </span>
                </td>
                <td className="px-4 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-3">
                    <button
                      onClick={() => verDocumento(`/ventas/${venta.id}/factura.pdf`)}
                      className="flex items-center gap-1 text-xs text-primary hover:opacity-80"
                    >
                      <FileText size={13} /> Factura
                    </button>
                    {venta.estado === "COMPLETADA" ? (
                      <button
                        onClick={() => handleAnular(venta.id)}
                        className="flex items-center gap-1 text-xs text-destructive hover:opacity-80"
                      >
                        <XCircle size={13} /> Anular
                      </button>
                    ) : (
                      <button
                        onClick={() => verDocumento(`/ventas/${venta.id}/nota-credito.pdf`)}
                        className="flex items-center gap-1 text-xs text-destructive hover:opacity-80"
                      >
                        <Receipt size={13} /> Nota crédito
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {data && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            {data.meta.total} ventas · página {page} de {data.meta.totalPages}
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
  );
}
