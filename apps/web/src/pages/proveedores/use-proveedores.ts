import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";

export interface Proveedor {
  id: string;
  nombre: string;
  nit: string;
  contacto?: string | null;
  telefono?: string | null;
  email?: string | null;
  ciudad?: string | null;
  activo: boolean;
  version: number;
}

const KEY = "proveedores";

export function useProveedores(filters: { page: number; limit: number; search?: string }) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Proveedor>>("/proveedores", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useTodosLosProveedores() {
  return useQuery({
    queryKey: [KEY, "todos"],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Proveedor>>("/proveedores", { params: { page: 1, limit: 100 } });
      return data.data;
    },
  });
}

export function useCrearProveedor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<Proveedor, "id" | "activo" | "version">) => {
      const { data } = await apiClient.post<Proveedor>("/proveedores", input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
