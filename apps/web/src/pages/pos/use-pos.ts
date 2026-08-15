import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";

export interface CarritoItem {
  varianteId: string;
  productoNombre: string;
  talla: string;
  color: string;
  sku: string;
  precioUnitario: number;
  ivaPorcentaje: number;
  descuentoMax: number;
  stockDisponible: number;
  cantidad: number;
  descuentoPorcentaje: number;
}

export interface PagoInput {
  metodo: "EFECTIVO" | "TARJETA_CREDITO" | "TARJETA_DEBITO" | "TRANSFERENCIA" | "CREDITO" | "BONO" | "PUNTOS";
  monto: number;
  referencia?: string;
}

export interface CheckoutInput {
  sucursalId: string;
  clienteId?: string;
  cotizacionId?: string;
  items: { varianteId: string; cantidad: number; descuentoPorcentaje?: number }[];
  pagos: PagoInput[];
  observaciones?: string;
  idempotencyKey: string;
}

export interface Venta {
  id: string;
  numero: number;
  prefijo: string;
  total: string;
  estado: "COMPLETADA" | "ANULADA";
  createdAt: string;
  motivoAnulacion?: string | null;
  _count?: { items: number };
}

const KEY = "ventas";

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: CheckoutInput) => {
      const { data } = await apiClient.post<Venta>("/ventas", input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["productos"] });
      qc.invalidateQueries({ queryKey: ["inventario"] });
    },
  });
}

export function useVentas(filters: { page: number; limit: number; estado?: string; search?: string }) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Venta>>("/ventas", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useVenta(id: string | null) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get(`/ventas/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useAnularVenta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, motivo }: { id: string; motivo: string }) => {
      const { data } = await apiClient.post(`/ventas/${id}/anular`, { motivo });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["inventario"] });
    },
  });
}
