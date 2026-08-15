import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  apellido: string;
  activo: boolean;
  version: number;
  ultimoLogin?: string | null;
  roles: { rol: { id: string; nombre: string } }[];
}

const KEY = "usuarios";

export function useUsuarios(filters: { page: number; limit: number; search?: string }) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Usuario>>("/usuarios", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCrearUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; password: string; nombre: string; apellido: string; rolIds: string[] }) => {
      const { data } = await apiClient.post<Usuario>("/usuarios", input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useActualizarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string; version: number; nombre?: string; apellido?: string; rolIds?: string[]; activo?: boolean }) => {
      const { data } = await apiClient.patch<Usuario>(`/usuarios/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDesactivarUsuario() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/usuarios/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ id, nuevaPassword }: { id: string; nuevaPassword: string }) => {
      await apiClient.post(`/usuarios/${id}/reset-password`, { nuevaPassword });
    },
  });
}
