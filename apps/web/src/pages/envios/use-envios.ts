import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";

export type EstadoEnvio = "PENDIENTE" | "DESPACHADO" | "EN_TRANSITO" | "ENTREGADO" | "DEVUELTO";

export interface Envio {
  id: string;
  ventaId: string;
  numeroGuia?: string | null;
  direccion: string;
  ciudad: string;
  estado: EstadoEnvio;
  costoEnvio: string;
  version: number;
  transportadora?: { nombre: string } | null;
}

const KEY = "envios";

export function useEnvios(filters: { page: number; limit: number; estado?: string }) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Envio>>("/envios", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCrearEnvio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ventaId: string; direccion: string; ciudad: string; transportadoraId?: string; telefono?: string }) => {
      const { data } = await apiClient.post<Envio>("/envios", input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useActualizarEnvio() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: { id: string; version: number; estado?: EstadoEnvio; numeroGuia?: string; transportadoraId?: string }) => {
      const { data } = await apiClient.patch<Envio>(`/envios/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
