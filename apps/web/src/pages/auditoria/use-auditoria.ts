import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";

export interface RegistroAuditoria {
  id: string;
  modulo: string;
  accion: string;
  entidadId?: string | null;
  resultado: string;
  ip?: string | null;
  createdAt: string;
  antes?: unknown;
  despues?: unknown;
  usuario?: { nombre: string; apellido: string; email: string } | null;
}

const KEY = "auditoria";

export function useAuditoria(filters: { page: number; limit: number; modulo?: string; resultado?: string; search?: string }) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<RegistroAuditoria>>("/auditoria", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useModulosAuditoria() {
  return useQuery({
    queryKey: [KEY, "modulos"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ modulo: string; total: number }[]>("/auditoria/modulos");
      return data;
    },
  });
}
