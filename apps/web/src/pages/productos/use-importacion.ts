import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface ErrorFila {
  fila: number;
  mensaje: string;
}

export interface ResultadoValidacion {
  filasValidas: number;
  productosDetectados: number;
  errores: ErrorFila[];
  listoParaImportar: boolean;
}

export interface ResultadoEjecucion {
  productosCreados: number;
  variantesCreadas: number;
  totalErrores: number;
  errores: ErrorFila[];
}

export function descargarPlantilla() {
  return apiClient.get("/productos/importar/plantilla", { responseType: "blob" }).then(({ data }) => {
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement("a");
    link.href = url;
    link.download = "plantilla-productos.xlsx";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  });
}

export function useValidarImportacion() {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiClient.post<ResultadoValidacion>("/productos/importar/validar", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
  });
}

export function useEjecutarImportacion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ file, sucursalId }: { file: File; sucursalId: string }) => {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await apiClient.post<ResultadoEjecucion>(
        `/productos/importar/ejecutar?sucursalId=${sucursalId}`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["productos"] });
      qc.invalidateQueries({ queryKey: ["configuracion"] });
    },
  });
}
