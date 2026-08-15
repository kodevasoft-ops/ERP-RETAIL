import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  CreateProductoInput,
  PaginatedResponse,
  Producto,
} from "./productos.types";

export interface ProductosFilters {
  page: number;
  limit: number;
  search?: string;
  categoriaId?: string;
  marcaId?: string;
  activo?: boolean;
  stockBajo?: boolean;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

const PRODUCTOS_KEY = "productos";

export function useProductos(filters: ProductosFilters) {
  return useQuery({
    queryKey: [PRODUCTOS_KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Producto>>("/productos", {
        params: filters,
      });
      return data;
    },
    placeholderData: (prev) => prev, // evita parpadeo al cambiar de página
  });
}

export function useProducto(id: string | null) {
  return useQuery({
    queryKey: [PRODUCTOS_KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<Producto>(`/productos/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCrearProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateProductoInput) => {
      const { data } = await apiClient.post<Producto>("/productos", input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTOS_KEY] });
    },
  });
}

export function useActualizarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: Partial<CreateProductoInput> & { id: string; version: number }) => {
      const { data } = await apiClient.patch<Producto>(`/productos/${id}`, input);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTOS_KEY] });
    },
  });
}

export function useEliminarProducto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/productos/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCTOS_KEY] });
    },
  });
}
