import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface MovimientoKardex {
  id: string;
  tipo: string;
  origen: string;
  cantidad: number;
  stockAnterior: number;
  stockNuevo: number;
  motivo?: string | null;
  createdAt: string;
  variante: { talla: string; color: string; sku: string; producto: { nombre: string } };
}

export interface AlertaStockBajo {
  id: string;
  sku: string;
  talla: string;
  color: string;
  stock: number;
  stock_minimo: number;
  producto_nombre: string;
  sucursal_id: string;
}

const INVENTARIO_KEY = "inventario";

export function useKardex(filters: { page: number; limit: number; varianteId?: string }) {
  return useQuery({
    queryKey: [INVENTARIO_KEY, "kardex", filters],
    queryFn: async () => {
      const { data } = await apiClient.get(`/inventario/kardex`, { params: filters });
      return data as { data: MovimientoKardex[]; meta: { total: number; totalPages: number; page: number } };
    },
    placeholderData: (prev) => prev,
  });
}

export function useAlertasStockBajo() {
  return useQuery({
    queryKey: [INVENTARIO_KEY, "alertas"],
    queryFn: async () => {
      const { data } = await apiClient.get<AlertaStockBajo[]>("/inventario/alertas/stock-bajo");
      return data;
    },
    refetchInterval: 60_000, // refresco periódico, no es crítico en tiempo real
  });
}

function useInvalidateInventario() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [INVENTARIO_KEY] });
}

export function useRegistrarEntrada() {
  const invalidate = useInvalidateInventario();
  return useMutation({
    mutationFn: async (input: { varianteId: string; cantidad: number; costoUnitario?: number; origen: string; motivo?: string }) => {
      const { data } = await apiClient.post("/inventario/entradas", input);
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useRegistrarSalida() {
  const invalidate = useInvalidateInventario();
  return useMutation({
    mutationFn: async (input: { varianteId: string; cantidad: number; origen: string; motivo?: string }) => {
      const { data } = await apiClient.post("/inventario/salidas", input);
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useTransferir() {
  const invalidate = useInvalidateInventario();
  return useMutation({
    mutationFn: async (input: { varianteId: string; sucursalDestinoId: string; cantidad: number; motivo?: string }) => {
      const { data } = await apiClient.post("/inventario/transferencias", input);
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useAjustar() {
  const invalidate = useInvalidateInventario();
  return useMutation({
    mutationFn: async (input: { varianteId: string; cantidad: number; motivo: string }) => {
      const { data } = await apiClient.post("/inventario/ajustes", input);
      return data;
    },
    onSuccess: invalidate,
  });
}
