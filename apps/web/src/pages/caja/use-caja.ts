import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface SesionCaja {
  id: string;
  cajaId: string;
  montoApertura: string;
  montoCierreSistema?: string | null;
  montoCierreReal?: string | null;
  diferencia?: string | null;
  estado: "ABIERTA" | "CERRADA";
  abiertaAt: string;
  movimientos: { id: string; tipo: "INGRESO" | "RETIRO"; monto: string; motivo: string; createdAt: string }[];
  montoEsperado?: number;
}

const KEY = "caja";
// TODO: reemplazar por la caja física asignada a la sesión del usuario
const CAJA_DEFAULT = "00000000-0000-0000-0000-000000000000";

export function useSesionActiva() {
  return useQuery({
    queryKey: [KEY, "activa"],
    queryFn: async () => {
      const { data } = await apiClient.get<SesionCaja | null>("/caja/activa", { params: { cajaId: CAJA_DEFAULT } });
      return data;
    },
  });
}

export function useResumenSesion(sesionId: string | null) {
  return useQuery({
    queryKey: [KEY, "resumen", sesionId],
    queryFn: async () => {
      const { data } = await apiClient.get<SesionCaja>(`/caja/${sesionId}/resumen`);
      return data;
    },
    enabled: !!sesionId,
    refetchInterval: 15_000,
  });
}

export function useAbrirCaja() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { montoApertura: number; observaciones?: string }) => {
      const { data } = await apiClient.post("/caja/abrir", { cajaId: CAJA_DEFAULT, ...input });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useMovimientoCaja(sesionId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { tipo: "INGRESO" | "RETIRO"; monto: number; motivo: string }) => {
      const { data } = await apiClient.post(`/caja/${sesionId}/movimientos`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useCerrarCaja(sesionId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { montoCierreReal: number; observaciones?: string }) => {
      const { data } = await apiClient.post(`/caja/${sesionId}/cerrar`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
