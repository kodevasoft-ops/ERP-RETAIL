import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";

export type EstadoOrdenCompra = "BORRADOR" | "ENVIADA" | "RECIBIDA_PARCIAL" | "RECIBIDA_TOTAL" | "CANCELADA";

export interface OrdenCompraItem {
  id: string;
  varianteId: string;
  cantidad: number;
  cantidadRecibida: number;
  costoUnitario: string;
  subtotal: string;
  variante?: { talla: string; color: string; sku: string; producto: { nombre: string } };
}

export interface OrdenCompra {
  id: string;
  numero: number;
  estado: EstadoOrdenCompra;
  subtotal: string;
  ivaTotal: string;
  total: string;
  version: number;
  createdAt: string;
  proveedor?: { nombre: string };
  items: OrdenCompraItem[];
  _count?: { items: number };
}

const KEY = "compras";

export function useOrdenesCompra(filters: { page: number; limit: number; estado?: string }) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<OrdenCompra>>("/compras/ordenes", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useOrdenCompra(id: string | null) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<OrdenCompra>(`/compras/ordenes/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: [KEY] });
    qc.invalidateQueries({ queryKey: ["inventario"] });
    qc.invalidateQueries({ queryKey: ["productos"] });
  };
}

export function useCrearOrdenCompra() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      sucursalId: string;
      proveedorId: string;
      items: { varianteId: string; cantidad: number; costoUnitario: number }[];
      observaciones?: string;
    }) => {
      const { data } = await apiClient.post<OrdenCompra>("/compras/ordenes", input);
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useEnviarOrden() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, version }: { id: string; version: number }) => {
      const { data } = await apiClient.post(`/compras/ordenes/${id}/enviar`, { version });
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useRecibirOrden() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({
      id,
      version,
      items,
    }: {
      id: string;
      version: number;
      items: { ordenCompraItemId: string; cantidadRecibida: number }[];
    }) => {
      const { data } = await apiClient.post(`/compras/ordenes/${id}/recibir`, { version, items });
      return data;
    },
    onSuccess: invalidate,
  });
}

export function useCancelarOrden() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async ({ id, version, motivo }: { id: string; version: number; motivo: string }) => {
      const { data } = await apiClient.post(`/compras/ordenes/${id}/cancelar`, { version, motivo });
      return data;
    },
    onSuccess: invalidate,
  });
}
