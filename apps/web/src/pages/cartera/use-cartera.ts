import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";

export type EstadoCartera = "PENDIENTE" | "PAGADA_PARCIAL" | "PAGADA" | "VENCIDA";

export interface CuentaPorCobrar {
  id: string;
  monto: string;
  saldo: string;
  estado: EstadoCartera;
  fechaVencimiento?: string | null;
  createdAt: string;
  venta: { numero: number; prefijo: string };
  cliente: { nombre: string; apellido?: string | null; telefono?: string | null } | null;
}

export interface Abono {
  id: string;
  monto: string;
  metodoPago: string;
  observaciones?: string | null;
  createdAt: string;
}

const KEY = "cartera";

export function useResumenCartera() {
  return useQuery({
    queryKey: [KEY, "resumen"],
    queryFn: async () => {
      const { data } = await apiClient.get<{ totalPorCobrar: number; totalVencido: number; cuentasVencidas: number }>(
        "/cartera/resumen",
      );
      return data;
    },
  });
}

export function useCuentasPorCobrar(filters: { page: number; limit: number; estado?: string }) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<CuentaPorCobrar>>("/cartera", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useHistorialAbonos(cuentaId: string | null) {
  return useQuery({
    queryKey: [KEY, cuentaId, "abonos"],
    queryFn: async () => {
      const { data } = await apiClient.get<Abono[]>(`/cartera/${cuentaId}/abonos`);
      return data;
    },
    enabled: !!cuentaId,
  });
}

export function useRegistrarAbono() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cuentaId, ...input }: { cuentaId: string; monto: number; metodoPago: string; observaciones?: string }) => {
      const { data } = await apiClient.post(`/cartera/${cuentaId}/abonos`, input, {
        headers: { "Idempotency-Key": `abono-${cuentaId}-${Date.now()}` },
      });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
