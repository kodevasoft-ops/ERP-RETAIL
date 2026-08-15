import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const KEY = "configuracion";

function useLista<T>(recurso: string) {
  return useQuery({
    queryKey: [KEY, recurso],
    queryFn: async () => {
      const { data } = await apiClient.get<T[]>(`/configuracion/${recurso}`);
      return data;
    },
  });
}

function useCrear<T>(recurso: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Record<string, unknown>) => {
      const { data } = await apiClient.post<T>(`/configuracion/${recurso}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, recurso] }),
  });
}

function useEliminar(recurso: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/configuracion/${recurso}/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, recurso] }),
  });
}

export interface Categoria { id: string; nombre: string; padreId?: string | null }
export interface Marca { id: string; nombre: string }
export interface Transportadora { id: string; nombre: string; urlRastreo?: string | null; activa: boolean }
export interface Sucursal { id: string; nombre: string; codigo: string; ciudad?: string | null; activo: boolean }

export const useCategorias = () => useLista<Categoria>("categorias");
export const useCrearCategoria = () => useCrear<Categoria>("categorias");
export const useEliminarCategoria = () => useEliminar("categorias");

export const useMarcas = () => useLista<Marca>("marcas");
export const useCrearMarca = () => useCrear<Marca>("marcas");
export const useEliminarMarca = () => useEliminar("marcas");

export const useTransportadoras = () => useLista<Transportadora>("transportadoras");
export const useCrearTransportadora = () => useCrear<Transportadora>("transportadoras");

export const useSucursales = () => useLista<Sucursal>("sucursales");
export const useCrearSucursal = () => useCrear<Sucursal>("sucursales");

export interface EmpresaConfig {
  id: string;
  nombre: string;
  tiendaActiva: boolean;
  whatsappVentas?: string | null;
  logoUrl?: string | null;
  descripcionTienda?: string | null;
}

export function useEmpresa() {
  return useQuery({
    queryKey: [KEY, "empresa"],
    queryFn: async () => {
      const { data } = await apiClient.get<EmpresaConfig>("/configuracion/empresa");
      return data;
    },
  });
}

export function useActualizarEmpresa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Pick<EmpresaConfig, "tiendaActiva" | "whatsappVentas" | "logoUrl" | "descripcionTienda">>) => {
      const { data } = await apiClient.patch<EmpresaConfig>("/configuracion/empresa", input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY, "empresa"] }),
  });
}
