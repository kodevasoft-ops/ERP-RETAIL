import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Notificacion {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  createdAt: string;
}

const KEY = "notificaciones";

export function useNotificaciones() {
  return useQuery({
    queryKey: [KEY],
    queryFn: async () => {
      const { data } = await apiClient.get<Notificacion[]>("/notificaciones");
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useContarNoLeidas() {
  return useQuery({
    queryKey: [KEY, "count"],
    queryFn: async () => {
      const { data } = await apiClient.get<number>("/notificaciones/no-leidas/count");
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useMarcarTodasLeidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await apiClient.patch("/notificaciones/leer-todas");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
