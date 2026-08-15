import type { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import type { ModuleKey } from "@/lib/module-colors";
import { MODULE_COLORS } from "@/lib/module-colors";
import { AnimatedNumber } from "./animated-number";

interface Props {
  label: string;
  valor: number;
  formato?: (n: number) => string;
  icon: LucideIcon;
  mod: ModuleKey;
  tendencia?: { valor: number; positiva: boolean };
  index?: number;
}

export function KpiCard({ label, valor, formato, icon: Icon, mod, tendencia, index = 0 }: Props) {
  const accent = MODULE_COLORS[mod];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: "easeOut" }}
      style={{ "--accent": accent } as React.CSSProperties}
      className="group relative overflow-hidden rounded-xl border border-border bg-card p-4 transition-shadow hover:shadow-md"
    >
      {/* Gradiente de acento muy sutil, apenas insinuado — identidad del módulo sin gritar */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] transition-opacity duration-200 group-hover:opacity-[0.1]"
        style={{ background: `radial-gradient(circle at 100% 0%, hsl(var(--accent)), transparent 60%)` }}
      />

      <div className="relative flex items-start justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{ background: `hsl(var(--accent) / 0.12)` }}
        >
          <Icon size={15} style={{ color: `hsl(var(--accent))` }} />
        </div>
      </div>

      <div className="relative mt-2 flex items-baseline gap-2">
        <span className="text-2xl font-semibold tabular-nums">
          <AnimatedNumber valor={valor} formato={formato} />
        </span>
        {tendencia && (
          <span className={`text-xs font-medium ${tendencia.positiva ? "text-success" : "text-destructive"}`}>
            {tendencia.positiva ? "+" : ""}
            {tendencia.valor}%
          </span>
        )}
      </div>

      {/* Barra de acento inferior — el detalle "Figma-like": una línea de color
          fina y precisa, no un borde grueso genérico. */}
      <div
        className="absolute inset-x-0 bottom-0 h-0.5 origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
        style={{ background: `hsl(var(--accent))` }}
      />
    </motion.div>
  );
}
