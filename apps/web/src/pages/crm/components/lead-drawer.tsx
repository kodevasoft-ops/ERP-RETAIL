import { useState } from "react";
import { X, Phone, Mail, MapPin, Send } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useLead, useAgregarSeguimiento } from "../use-crm";
import type { Lead } from "../use-crm";

const TIPOS_SEGUIMIENTO = [
  { value: "LLAMADA", label: "Llamada" },
  { value: "WHATSAPP", label: "WhatsApp" },
  { value: "CORREO", label: "Correo" },
  { value: "VISITA", label: "Visita" },
  { value: "NOTA", label: "Nota" },
];

export function LeadDrawer({ lead, onClose }: { lead: Lead | null; onClose: () => void }) {
  const { data: detalle } = useLead(lead?.id ?? null);
  const agregar = useAgregarSeguimiento();
  const [tipo, setTipo] = useState("LLAMADA");
  const [notas, setNotas] = useState("");

  const handleSubmit = async () => {
    if (!lead || !notas.trim()) return;
    await agregar.mutateAsync({ leadId: lead.id, tipo, notas });
    setNotas("");
  };

  return (
    <AnimatePresence>
      {lead && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/30"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-card"
          >
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <h2 className="text-sm font-semibold">{lead.nombre}</h2>
              <button onClick={onClose} className="rounded-md p-1.5 hover:bg-muted">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-3 border-b border-border px-6 py-4 text-sm">
              {lead.telefono && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Phone size={14} /> {lead.telefono}
                </p>
              )}
              {lead.correo && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <Mail size={14} /> {lead.correo}
                </p>
              )}
              {lead.ciudad && (
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin size={14} /> {lead.ciudad}
                </p>
              )}
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
              <h3 className="text-xs font-medium text-muted-foreground">Historial de seguimiento</h3>
              {detalle?.seguimientos.length === 0 && (
                <p className="text-xs text-muted-foreground">Aún no hay seguimientos registrados.</p>
              )}
              {detalle?.seguimientos.map((s) => (
                <div key={s.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-medium">{TIPOS_SEGUIMIENTO.find((t) => t.value === s.tipo)?.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.createdAt).toLocaleDateString("es-CO", { dateStyle: "short" })}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{s.notas}</p>
                </div>
              ))}
            </div>

            <div className="space-y-2 border-t border-border px-6 py-4">
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
              >
                {TIPOS_SEGUIMIENTO.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <div className="flex gap-2">
                <input
                  value={notas}
                  onChange={(e) => setNotas(e.target.value)}
                  placeholder="Escribe una nota de seguimiento..."
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button
                  onClick={handleSubmit}
                  disabled={agregar.isPending || !notas.trim()}
                  className="rounded-md bg-primary px-3 py-2 text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  <Send size={15} />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
