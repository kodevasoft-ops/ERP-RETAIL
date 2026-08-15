import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Download, CheckCircle2, AlertTriangle, FileSpreadsheet } from "lucide-react";
import {
  descargarPlantilla,
  useValidarImportacion,
  useEjecutarImportacion,
  type ResultadoValidacion,
  type ResultadoEjecucion,
} from "../use-importacion";

interface Props {
  open: boolean;
  onClose: () => void;
  sucursalId: string;
}

export function ImportarProductosModal({ open, onClose, sucursalId }: Props) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [validacion, setValidacion] = useState<ResultadoValidacion | null>(null);
  const [resultado, setResultado] = useState<ResultadoEjecucion | null>(null);

  const validar = useValidarImportacion();
  const ejecutar = useEjecutarImportacion();

  const reset = () => {
    setArchivo(null);
    setValidacion(null);
    setResultado(null);
  };

  const handleCerrar = () => {
    reset();
    onClose();
  };

  const handleSeleccionar = async (file: File) => {
    setArchivo(file);
    setResultado(null);
    const data = await validar.mutateAsync(file);
    setValidacion(data);
  };

  const handleConfirmar = async () => {
    if (!archivo) return;
    const data = await ejecutar.mutateAsync({ file: archivo, sucursalId });
    setResultado(data);
    setValidacion(null);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleCerrar} className="fixed inset-0 z-40 bg-black/30" />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-border bg-card p-5"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-semibold">
                <FileSpreadsheet size={16} /> Importar productos desde Excel
              </h2>
              <button onClick={handleCerrar} className="rounded-md p-1 hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            {!resultado && (
              <button
                onClick={() => descargarPlantilla()}
                className="mb-4 flex w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary"
              >
                <Download size={13} /> Descargar plantilla oficial (.xlsx)
              </button>
            )}

            {!resultado && !validacion && (
              <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-border py-8 text-sm text-muted-foreground hover:border-primary hover:text-primary">
                <Upload size={20} />
                {validar.isPending ? "Analizando archivo..." : "Haz clic para seleccionar tu archivo .xlsx"}
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  className="hidden"
                  disabled={validar.isPending}
                  onChange={(e) => e.target.files?.[0] && handleSeleccionar(e.target.files[0])}
                />
              </label>
            )}

            {validacion && !resultado && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-success/10 p-3 text-center">
                    <p className="text-lg font-semibold text-success">{validacion.productosDetectados}</p>
                    <p className="text-xs text-muted-foreground">productos listos</p>
                  </div>
                  <div className={`rounded-md p-3 text-center ${validacion.errores.length > 0 ? "bg-warning/10" : "bg-muted"}`}>
                    <p className={`text-lg font-semibold ${validacion.errores.length > 0 ? "text-warning" : ""}`}>
                      {validacion.errores.length}
                    </p>
                    <p className="text-xs text-muted-foreground">filas con error</p>
                  </div>
                </div>

                {validacion.errores.length > 0 && (
                  <div className="max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
                    {validacion.errores.map((e, i) => (
                      <p key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                        <AlertTriangle size={12} className="mt-0.5 shrink-0 text-warning" />
                        <span>
                          Fila {e.fila}: {e.mensaje}
                        </span>
                      </p>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <button onClick={reset} className="flex-1 rounded-md border border-border py-2 text-sm hover:bg-muted">
                    Cambiar archivo
                  </button>
                  <button
                    onClick={handleConfirmar}
                    disabled={!validacion.listoParaImportar || ejecutar.isPending}
                    className="flex-1 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
                  >
                    {ejecutar.isPending
                      ? "Importando..."
                      : `Importar ${validacion.filasValidas} variantes`}
                  </button>
                </div>
              </div>
            )}

            {resultado && (
              <div className="space-y-3 text-center">
                <CheckCircle2 size={32} className="mx-auto text-success" />
                <p className="text-sm">
                  <span className="font-semibold">{resultado.productosCreados}</span> productos y{" "}
                  <span className="font-semibold">{resultado.variantesCreadas}</span> variantes importadas.
                </p>
                {resultado.totalErrores > 0 && (
                  <p className="text-xs text-warning">{resultado.totalErrores} filas no se pudieron importar.</p>
                )}
                <button onClick={handleCerrar} className="w-full rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90">
                  Listo
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
