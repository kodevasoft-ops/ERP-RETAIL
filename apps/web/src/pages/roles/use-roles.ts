import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Permiso {
  id: string;
  modulo: string;
  accion: string;
}

export interface Rol {
  id: string;
  nombre: string;
  descripcion?: string | null;
  esSistema: boolean;
  version: number;
  permisos: { permiso: Permiso }[];
  _count: { usuarios: number };
}

const KEY = "roles";

export function useRoles() {
  return useQuery({
    queryKey: [KEY],
    queryFn: async () => {
      const { data } = await apiClient.get<Rol[]>("/roles");
      return data;
    },
  });
}

export function usePermisosDisponibles() {
  return useQuery({
    queryKey: [KEY, "permisos-disponibles"],
    queryFn: async () => {
      const { data } = await apiClient.get<Record<string, Permiso[]>>("/roles/permisos-disponibles");
      return data;
    },
    staleTime: 5 * 60_000, // el catálogo de permisos casi no cambia
  });
}

export function useCrearRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nombre: string; descripcion?: string; permisos: { modulo: string; accion: string }[] }) => {
      const { data } = await apiClient.post<Rol>("/roles", input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useActualizarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: { id: string; version: number; nombre: string; descripcion?: string; permisos: { modulo: string; accion: string }[] }) => {
      const { data } = await apiClient.patch<Rol>(`/roles/${id}`, input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useEliminarRol() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/roles/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}
