import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Cliente HTTP propio, SIN el interceptor de auth del resto de la app
// (la tienda es pública; nunca debe intentar adjuntar ni refrescar un
// token de sesión de staff).
const tiendaClient = axios.create({ baseURL: "/api/v1/tienda" });

export interface TiendaInfo {
  id: string;
  nombre: string;
  logoUrl?: string | null;
  descripcionTienda?: string | null;
  whatsappVentas?: string | null;
}

export interface ProductoTienda {
  id: string;
  nombre: string;
  descripcion?: string | null;
  categoria?: { nombre: string } | null;
  imagenes: { url: string; esPrincipal: boolean }[];
  variantes: { id: string; talla: string; color: string; precioVenta: string }[];
}

export function useTiendaInfo(empresaId: string) {
  return useQuery({
    queryKey: ["tienda-info", empresaId],
    queryFn: async () => {
      const { data } = await tiendaClient.get<TiendaInfo>(`/${empresaId}/info`);
      return data;
    },
    retry: false,
  });
}

export function useTiendaProductos(empresaId: string, search: string) {
  return useQuery({
    queryKey: ["tienda-productos", empresaId, search],
    queryFn: async () => {
      const { data } = await tiendaClient.get<{ data: ProductoTienda[] }>(`/${empresaId}/productos`, {
        params: { page: 1, limit: 60, search: search || undefined },
      });
      return data.data;
    },
  });
}
