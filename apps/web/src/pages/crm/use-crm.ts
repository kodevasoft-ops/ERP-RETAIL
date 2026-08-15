import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export type EstadoLead =
  | "NUEVO"
  | "CONTACTADO"
  | "INTERESADO"
  | "COTIZACION_ENVIADA"
  | "NEGOCIACION"
  | "APARTADO"
  | "GANADO"
  | "PERDIDO"
  | "NO_INTERESADO";

export type FuenteLead = "INSTAGRAM" | "FACEBOOK" | "TIKTOK" | "WEB" | "REFERIDO" | "VISITA_LOCAL" | "OTRO";

export interface Lead {
  id: string;
  nombre: string;
  telefono?: string | null;
  whatsapp?: string | null;
  correo?: string | null;
  ciudad?: string | null;
  fuente: FuenteLead;
  estado: EstadoLead;
  vendedorId?: string | null;
  observaciones?: string | null;
  proximoContacto?: string | null;
  motivoPerdida?: string | null;
  orden: number;
  version: number;
  createdAt: string;
}

export interface Seguimiento {
  id: string;
  tipo: string;
  notas: string;
  usuarioId: string;
  createdAt: string;
}

type KanbanData = Record<EstadoLead, Lead[]>;

const KEY = "crm-leads";

export function useKanban() {
  return useQuery({
    queryKey: [KEY, "kanban"],
    queryFn: async () => {
      const { data } = await apiClient.get<KanbanData>("/crm/leads/kanban");
      return data;
    },
  });
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: [KEY, id],
    queryFn: async () => {
      const { data } = await apiClient.get<Lead & { seguimientos: Seguimiento[] }>(`/crm/leads/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCrearLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { nombre: string; telefono?: string; correo?: string; fuente?: FuenteLead }) => {
      const { data } = await apiClient.post<Lead>("/crm/leads", input);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useMoverLead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; estado: EstadoLead; orden: number; version: number; motivoPerdida?: string }) => {
      const { id, ...body } = input;
      const { data } = await apiClient.patch<Lead>(`/crm/leads/${id}/mover`, body);
      return data;
    },
    // Optimistic UI: la tarjeta se mueve al instante; si falla, React Query
    // revierte al refetch. El Kanban nunca debe sentirse "trabado".
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: [KEY, "kanban"] });
      const previo = qc.getQueryData<KanbanData>([KEY, "kanban"]);
      if (previo) {
        const next: KanbanData = { ...previo };
        for (const estado of Object.keys(next) as EstadoLead[]) {
          next[estado] = next[estado].filter((l) => l.id !== input.id);
        }
        const lead = Object.values(previo).flat().find((l) => l.id === input.id);
        if (lead) {
          next[input.estado] = [...next[input.estado], { ...lead, estado: input.estado, orden: input.orden }];
        }
        qc.setQueryData([KEY, "kanban"], next);
      }
      return { previo };
    },
    onError: (_err, _input, context) => {
      if (context?.previo) qc.setQueryData([KEY, "kanban"], context.previo);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useAgregarSeguimiento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, ...input }: { leadId: string; tipo: string; notas: string; proximoContacto?: string }) => {
      const { data } = await apiClient.post(`/crm/leads/${leadId}/seguimientos`, input);
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: [KEY, variables.leadId] });
      qc.invalidateQueries({ queryKey: [KEY, "kanban"] });
    },
  });
}
