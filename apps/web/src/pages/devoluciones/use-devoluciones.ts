import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";

export type TipoDevolucion = "CAMBIO_TALLA" | "CAMBIO_COLOR" | "DINERO" | "BONO" | "CREDITO" | "REPOSICION";
export type EstadoDevolucion = "SOLICITADA" | "APROBADA" | "RECHAZADA" | "COMPLETADA";

export interface Devolucion {
  id: string;
  ventaId: string;
  tipo: TipoDevolucion;
  motivo: string;
  estado: EstadoDevolucion;
  montoReembolso?: string | null;
  createdAt: string;
  _count?: { items: number };
}

const KEY = "devoluciones";
const SUCURSAL_DEFAULT = "00000000-0000-0000-0000-000000000000";

export function useDevoluciones(filters: { page: number; limit: number; estado?: string }) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Devolucion>>("/devoluciones", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCrearDevolucion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      ventaId: string;
      tipo: TipoDevolucion;
      motivo: string;
      montoReembolso?: number;
      items: { varianteId: string; cantidad: number; varianteNuevaId?: string }[];
    }) => {
      const { data } = await apiClient.post<Devolucion>("/devoluciones", { sucursalId: SUCURSAL_DEFAULT, ...input });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [KEY] });
    qc.invalidateQueries({ queryKey: ["inventario"] });
    qc.invalidateQueries({ queryKey: ["productos"] });
    qc.invalidateQueries({ queryKey: ["clientes"] });
  };
}

export function useProcesarDevolucion() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/devoluciones/${id}/procesar`);
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useRechazarDevolucion() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data } = await apiClient.post(`/devoluciones/${id}/rechazar`, { motivo });
      return data;
    },
    onSuccess: invalidate,
  });
}
