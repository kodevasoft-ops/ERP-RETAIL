import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type { Cliente, EtiquetaCliente, TipoDocumento } from "./clientes.types";
import type { PaginatedResponse } from "@/lib/types";

export interface ClientesFilters {
  page: number;
  limit: number;
  search?: string;
  etiquetas?: EtiquetaCliente[];
}

export interface ClienteInput {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombre: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  whatsapp?: string;
  direccion?: string;
  ciudad?: string;
  etiquetas?: EtiquetaCliente[];
  notas?: string;
}

const KEY = "clientes";

export function useClientes(filters: ClientesFilters) {
  return useQuery({
    queryKey: [KEY, filters],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<Cliente>>("/clientes", { params: filters });
      return data;
    },
    placeholderData: (prev) => prev,
  });
}

export function useCrearCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: ClienteInput) => {
      const { data } = await apiClient.post<Cliente>("/clientes", input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useActualizarCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...input }: Partial<ClienteInput> & { id: string; version: number }) => {
      const { data } = await apiClient.patch<Cliente>(`/clientes/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useEliminarCliente() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/clientes/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
