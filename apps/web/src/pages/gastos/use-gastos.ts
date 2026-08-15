import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";

export type CategoriaGasto = "ARRIENDO" | "SERVICIOS" | "INTERNET" | "PUBLICIDAD" | "NOMINA" | "TRANSPORTE" | "PAPELERIA" | "IMPREVISTOS" | "OTRO";

export interface Gasto {
  id: string;
  categoria: CategoriaGasto;
  descripcion: string;
  monto: string;
  fecha: string;
  version: number;
}

const KEY = "gastos";
const SUCURSAL_DEFAULT = "00000000-0000-0000-0000-000000000000";

export function useGastos(filters: { page: number; limit: number; categoria?: string; desde?: string; hasta?: string }) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Gasto>>("/gastos", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCrearGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { categoria: CategoriaGasto; descripcion: string; monto: number; fecha: string }) => {
      const { data } = await apiClient.post<Gasto>("/gastos", { sucursalId: SUCURSAL_DEFAULT, ...input });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["finanzas"] });
    },
  });
}

export function useEliminarGasto() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/gastos/${id}`);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["finanzas"] });
    },
  });
}
