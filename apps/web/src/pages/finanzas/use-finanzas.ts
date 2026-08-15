import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { RangoFechas } from "@/pages/reportes/use-reportes";

const KEY = "finanzas";

export interface ResumenFinanciero {
  ingresos: number;
  costoVentas: number;
  utilidadBruta: number;
  margenBrutoPct: number;
  gastos: number;
  comprasRecibidas: number;
  utilidadNeta: number;
  margenNetoPct: number;
}

export function useResumenFinanciero(rango: RangoFechas) {
  return useQuery({
    queryKey: [KEY, "resumen", rango],
    queryFn: async () => {
      const { data } = await apiClient.get<ResumenFinanciero>("/finanzas/resumen", { params: rango });
      return data;
    },
  });
}

export function useFlujoCaja(rango: RangoFechas) {
  return useQuery({
    queryKey: [KEY, "flujo-caja", rango],
    queryFn: async () => {
      const { data } = await apiClient.get<{ fecha: string; ingresos: number; egresos: number; neto: number }[]>(
        "/finanzas/flujo-caja",
        { params: rango },
      );
      return data;
    },
  });
}

export function useGastosPorCategoria(rango: RangoFechas) {
  return useQuery({
    queryKey: [KEY, "gastos-por-categoria", rango],
    queryFn: async () => {
      const { data } = await apiClient.get<{ categoria: string; total: number }[]>("/finanzas/gastos-por-categoria", {
        params: rango,
      });
      return data;
    },
  });
}
