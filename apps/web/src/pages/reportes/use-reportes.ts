import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface RangoFechas {
  desde: string;
  hasta: string;
}

const KEY = "reportes";

export function useDashboardResumen() {
  return useQuery({
    queryKey: [KEY, "dashboard"],
    queryFn: async () => {
      const { data } = await apiClient.get("/reportes/dashboard");
      return data as { ventasHoy: { total: number; cantidad: number }; ventasMes: { total: number; cantidad: number }; productosStockBajo: number };
    },
  });
}

export function useVentasPorDia(rango: RangoFechas) {
  return useQuery({
    queryKey: [KEY, "ventas-por-dia", rango],
    queryFn: async () => {
      const { data } = await apiClient.get("/reportes/ventas-por-dia", { params: rango });
      return data as { fecha: string; total_ventas: number; cantidad_ventas: number }[];
    },
  });
}

export function useVentasPorVendedor(rango: RangoFechas) {
  return useQuery({
    queryKey: [KEY, "ventas-por-vendedor", rango],
    queryFn: async () => {
      const { data } = await apiClient.get("/reportes/ventas-por-vendedor", { params: rango });
      return data as { vendedor_id: string; nombre: string; total_ventas: number; cantidad_ventas: number }[];
    },
  });
}

export function useVentasPorCategoria(rango: RangoFechas) {
  return useQuery({
    queryKey: [KEY, "ventas-por-categoria", rango],
    queryFn: async () => {
      const { data } = await apiClient.get("/reportes/ventas-por-categoria", { params: rango });
      return data as { categoria: string; total_ventas: number; unidades: number }[];
    },
  });
}

export function useTopProductos(rango: RangoFechas) {
  return useQuery({
    queryKey: [KEY, "top-productos", rango],
    queryFn: async () => {
      const { data } = await apiClient.get("/reportes/top-productos", { params: rango });
      return data as { producto: string; unidades: number; total_ventas: number }[];
    },
  });
}

export function useTopClientes(rango: RangoFechas) {
  return useQuery({
    queryKey: [KEY, "top-clientes", rango],
    queryFn: async () => {
      const { data } = await apiClient.get("/reportes/top-clientes", { params: rango });
      return data as { cliente: string; compras: number; total_compras: number }[];
    },
  });
}

export function useInventarioValorizado() {
  return useQuery({
    queryKey: [KEY, "inventario-valorizado"],
    queryFn: async () => {
      const { data } = await apiClient.get("/reportes/inventario-valorizado");
      return data as { producto: string; talla: string; color: string; sku: string; stock: number; costo_promedio: number; valor_total: number }[];
    },
  });
}

/**
 * Descarga un reporte exportado (xlsx/pdf). El backend genera el archivo
 * en memoria y lo transmite como blob; aquí se dispara la descarga del
 * navegador sin necesidad de abrir una nueva pestaña.
 */
export async function descargarReporte(endpoint: string, formato: "xlsx" | "pdf", params: Record<string, string> = {}) {
  const response = await apiClient.get(`${endpoint}/exportar`, {
    params: { ...params, formato },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = url;
  link.download = `${endpoint.replace("/reportes/", "")}.${formato}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
