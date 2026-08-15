import { motion } from "framer-motion";
import {
  TrendingUp,
  Users,
  ShoppingBag,
  DollarSign,
  AlertTriangle,
  Wallet,
  FileText,
  ShieldAlert,
} from "lucide-react";
import { KpiCard } from "./components/kpi-card";
import { BarChart } from "@/pages/reportes/components/bar-chart";
import { useDashboardResumen, useVentasPorDia } from "@/pages/reportes/use-reportes";
import { MODULE_COLORS } from "@/lib/module-colors";

function money(n: number) {
  return n.toLocaleString("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}
function hace7Dias() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function DashboardPage() {
  const { data: resumen } = useDashboardResumen();
  const { data: ventasSemana } = useVentasPorDia({ desde: hace7Dias(), hasta: hoy() });

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
        </p>
      </div>

      {/* Bento grid: celdas de distinto tamaño según importancia, no una
          grilla uniforme — el patrón que distingue un dashboard con
          intención del típico "4 cajitas iguales" de un ERP genérico. */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
        <div className="col-span-2">
          <KpiCard
            label="Ventas de hoy"
            valor={resumen?.ventasHoy.total ?? 0}
            formato={money}
            icon={DollarSign}
            mod="ventas"
            index={0}
          />
        </div>
        <KpiCard label="Transacciones hoy" valor={resumen?.ventasHoy.cantidad ?? 0} icon={ShoppingBag} mod="ventas" index={1} />
        <KpiCard label="Ventas del mes" valor={resumen?.ventasMes.total ?? 0} formato={money} icon={TrendingUp} mod="finanzas" index={2} />
        <KpiCard label="Stock bajo" valor={resumen?.productosStockBajo ?? 0} icon={AlertTriangle} mod="inventario" index={3} />
        <KpiCard label="Clientes nuevos" valor={0} icon={Users} mod="clientes" index={4} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Panel principal: ocupa 2/3 del ancho en desktop */}
        <div className="rounded-xl border border-border bg-card p-4 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-medium">Ventas de la última semana</h2>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={{
                background: `hsl(${MODULE_COLORS.ventas} / 0.1)`,
                color: `hsl(${MODULE_COLORS.ventas})`,
              }}
            >
              Ventas
            </span>
          </div>
          <BarChart datos={(ventasSemana ?? []).map((d) => ({ label: d.fecha.slice(5), valor: d.total_ventas }))} formatoValor={money} />
        </div>

        {/* Panel lateral: accesos directos coloreados por módulo, tipo "quick actions" de Figma */}
        <div className="space-y-3">
          <AccesoDirecto icon={Wallet} label="Abrir/cerrar caja" href="/caja" mod="caja" />
          <AccesoDirecto icon={FileText} label="Nueva cotización" href="/cotizaciones" mod="cotizaciones" />
          <AccesoDirecto icon={ShieldAlert} label="Casos de garantía" href="/garantias" mod="garantias" />
        </div>
      </div>
    </div>
  );
}

function AccesoDirecto({
  icon: Icon,
  label,
  href,
  mod,
}: {
  icon: typeof Wallet;
  label: string;
  href: string;
  mod: keyof typeof MODULE_COLORS;
}) {
  const accent = MODULE_COLORS[mod];
  return (
    <motion.a
      href={href}
      whileHover={{ x: 2 }}
      transition={{ duration: 0.15 }}
      style={{ "--accent": accent } as React.CSSProperties}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-sm transition-colors hover:border-[hsl(var(--accent)/0.4)]"
    >
      <div className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `hsl(var(--accent) / 0.12)` }}>
        <Icon size={16} style={{ color: `hsl(var(--accent))` }} />
      </div>
      <span className="font-medium">{label}</span>
    </motion.a>
  );
}
