import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { PaginatedResponse } from "@/lib/types";

export type EstadoCotizacion = "BORRADOR" | "ENVIADA" | "ACEPTADA" | "RECHAZADA" | "VENCIDA" | "CONVERTIDA";

export interface CotizacionItem {
  id: string;
  varianteId: string;
  cantidad: number;
  precioUnitario: string;
  descuentoPorcentaje: string;
  ivaPorcentaje: string;
  total: string;
  variante?: { talla: string; color: string; sku: string; producto: { nombre: string } };
}

export interface Cotizacion {
  id: string;
  numero: number;
  estado: EstadoCotizacion;
  total: string;
  createdAt: string;
  fechaVencimiento?: string | null;
  items: CotizacionItem[];
  _count?: { items: number };
}

const KEY = "cotizaciones";

export function useCotizaciones(filters: { page: number; limit: number; estado?: string }) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Cotizacion>>("/cotizaciones", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCotizacion(id: string | null) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<Cotizacion>(`/cotizaciones/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}

export function useCrearCotizacion() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (input: {
      sucursalId: string;
      clienteId?: string;
      items: { varianteId: string; cantidad: number; descuentoPorcentaje?: number }[];
      observaciones?: string;
    }) => {
      const { data } = await apiClient.post<Cotizacion>("/cotizaciones", input);
      return data;
    },
    onSuccess: invalidate,
  });
}

function useCambiarEstado(accion: "enviar" | "aceptar" | "rechazar") {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(`/cotizaciones/${id}/${accion}`);
      return data;
    },
    onSuccess: invalidate,
  });
}

export const useEnviarCotizacion = () => useCambiarEstado("enviar");
export const useAceptarCotizacion = () => useCambiarEstado("aceptar");
export const useRechazarCotizacion = () => useCambiarEstado("rechazar");
