import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";

export type EstadoGarantia = "RECIBIDO" | "EN_REVISION" | "ENVIADO_PROVEEDOR" | "APROBADO" | "RECHAZADO" | "ENTREGADO";

export interface Garantia {
  id: string;
  varianteId: string;
  cantidad: number;
  motivo: string;
  estado: EstadoGarantia;
  notas?: string | null;
  version: number;
  createdAt: string;
}

const KEY = "garantias";
const SUCURSAL_DEFAULT = "00000000-0000-0000-0000-000000000000";

export function useGarantias(filters: { page: number; limit: number; estado?: string }) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Garantia>>("/garantias", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCrearGarantia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { varianteId: string; motivo: string; cantidad?: number; ventaId?: string }) => {
      const { data } = await apiClient.post<Garantia>("/garantias", { sucursalId: SUCURSAL_DEFAULT, ...input });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useActualizarEstadoGarantia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado, version, notas }: { id: string; estado: EstadoGarantia; version: number; notas?: string }) => {
      const { data } = await apiClient.patch(`/garantias/${id}/estado`, { estado, version, notas });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
