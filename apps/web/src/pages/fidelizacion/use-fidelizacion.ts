import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface MovimientoPuntos {
  id: string;
  tipo: "ACUMULACION" | "REDENCION" | "AJUSTE" | "EXPIRACION";
  puntos: number;
  motivo: string;
  createdAt: string;
}

const KEY = "fidelizacion";

export function useHistorialPuntos(clienteId: string | null) {
  return useQuery({
    queryKey: [KEY, clienteId],
    queryFn: async () => {
      const { data } = await apiClient.get<{ saldoActual: number; movimientos: MovimientoPuntos[] }>(
        `/fidelizacion/clientes/${clienteId}/historial`,
      );
      return data;
    },
    enabled: !!clienteId,
  });
}

export function useAcumularPuntos(clienteId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { puntos: number; motivo: string }) => {
      const { data } = await apiClient.post(`/fidelizacion/clientes/${clienteId}/acumular`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, clienteId] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}

export function useRedimirPuntos(clienteId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { puntos: number; motivo: string }) => {
      const { data } = await apiClient.post(`/fidelizacion/clientes/${clienteId}/redimir`, input);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY, clienteId] });
      qc.invalidateQueries({ queryKey: ["clientes"] });
    },
  });
}
