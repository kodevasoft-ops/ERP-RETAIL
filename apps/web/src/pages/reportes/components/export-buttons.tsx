import { useState } from "react";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import { descargarReporte } from "../use-reportes";

export function ExportButtons({ endpoint, params }: { endpoint: string; params?: Record<string, string> }) {
  const [cargando, setCargando] = useState<"xlsx" | "pdf" | null>(null);

  const exportar = async (formato: "xlsx" | "pdf") => {
    setCargando(formato);
    try {
      await descargarReporte(endpoint, formato, params);
    } finally {
      setCargando(null);
    }
  };

  return (
    <div className="flex gap-1.5">
      <button
        onClick={() => exportar("xlsx")}
        disabled={cargando !== null}
        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
      >
        {cargando === "xlsx" ? <Loader2 size={12} className="animate-spin" /> : <FileSpreadsheet size={12} />}
        Excel
      </button>
      <button
        onClick={() => exportar("pdf")}
        disabled={cargando !== null}
        className="flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
      >
        {cargando === "pdf" ? <Loader2 size={12} className="animate-spin" /> : <FileText size={12} />}
        PDF
      </button>
    </div>
  );
}
