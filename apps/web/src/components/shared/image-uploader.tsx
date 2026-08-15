import { useState, useRef } from "react";
import { Upload, X, Loader2, Star } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface ImagenSubida {
  url: string;
  esPrincipal: boolean;
}

interface Props {
  carpeta: "productos" | "garantias" | "gastos" | "empresa";
  imagenes: ImagenSubida[];
  onChange: (imagenes: ImagenSubida[]) => void;
  maxImagenes?: number;
}

/**
 * Flujo de subida en 2 pasos, nunca pasa el archivo por nuestro backend:
 *  1. Pide una URL prefirmada al API (POST /uploads/presigned-url)
 *  2. Sube el archivo DIRECTO a R2 con esa URL (PUT)
 * Solo entonces la URL pública resultante se guarda en el formulario.
 */
export function ImageUploader({ carpeta, imagenes, onChange, maxImagenes = 6 }: Props) {
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const subirArchivo = async (file: File) => {
    setError(null);
    setSubiendo(true);
    try {
      const { data } = await apiClient.post<{ uploadUrl: string; publicUrl: string }>("/uploads/presigned-url", {
        nombreArchivo: file.name,
        tipoContenido: file.type,
        carpeta,
        tamanoBytes: file.size,
      });

      // Sube directo a R2 — nota: no usamos apiClient aquí a propósito,
      // esta URL es prefirmada y va directo al bucket, no a nuestro API.
      await fetch(data.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });

      onChange([...imagenes, { url: data.publicUrl, esPrincipal: imagenes.length === 0 }]);
    } catch {
      setError("No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setSubiendo(false);
    }
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const restantes = maxImagenes - imagenes.length;
    Array.from(files)
      .slice(0, restantes)
      .forEach((file) => subirArchivo(file));
  };

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-4 gap-2">
        {imagenes.map((img, i) => (
          <div key={img.url} className="group relative aspect-square overflow-hidden rounded-md border border-border">
            <img src={img.url} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
              <button
                type="button"
                onClick={() => onChange(imagenes.map((im, idx) => ({ ...im, esPrincipal: idx === i })))}
                className={cn("rounded-full p-1.5", img.esPrincipal ? "bg-warning text-white" : "bg-white/90 text-foreground")}
                title="Marcar como principal"
              >
                <Star size={12} fill={img.esPrincipal ? "currentColor" : "none"} />
              </button>
              <button
                type="button"
                onClick={() => onChange(imagenes.filter((_, idx) => idx !== i))}
                className="rounded-full bg-white/90 p-1.5 text-destructive"
                title="Quitar"
              >
                <X size={12} />
              </button>
            </div>
            {img.esPrincipal && (
              <span className="absolute left-1 top-1 rounded-full bg-warning px-1.5 py-0.5 text-[9px] font-medium text-white">
                Principal
              </span>
            )}
          </div>
        ))}

        {imagenes.length < maxImagenes && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {subiendo ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            <span className="text-[10px]">{subiendo ? "Subiendo..." : "Agregar"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
