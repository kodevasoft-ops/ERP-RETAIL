import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Contact,
  Package,
  ShoppingCart,
  Warehouse,
  Truck,
  Building2,
  BarChart3,
  Settings,
  ChevronsLeft,
  Zap,
  Wallet,
  UserCog,
  ShieldCheck,
  FileText,
  ShieldAlert,
  RotateCcw,
  Receipt,
  LineChart,
  Truck as TruckIcon,
  Gift,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MODULE_COLORS, type ModuleKey } from "@/lib/module-colors";

const NAV_ITEMS: { icon: typeof LayoutDashboard; label: string; href: string; mod: ModuleKey | null }[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/", mod: null },
  { icon: Users, label: "CRM", href: "/crm", mod: "crm" },
  { icon: FileText, label: "Cotizaciones", href: "/cotizaciones", mod: "cotizaciones" },
  { icon: Contact, label: "Clientes", href: "/clientes", mod: "clientes" },
  { icon: CreditCard, label: "Cartera", href: "/cartera", mod: "clientes" },
  { icon: Package, label: "Productos", href: "/productos", mod: "productos" },
  { icon: ShoppingCart, label: "Ventas", href: "/ventas", mod: "ventas" },
  { icon: TruckIcon, label: "Envíos", href: "/envios", mod: "envios" },
  { icon: RotateCcw, label: "Devoluciones", href: "/devoluciones", mod: "devoluciones" },
  { icon: ShieldAlert, label: "Garantías", href: "/garantias", mod: "garantias" },
  { icon: Warehouse, label: "Inventario", href: "/inventario", mod: "inventario" },
  { icon: Truck, label: "Compras", href: "/compras", mod: "compras" },
  { icon: Building2, label: "Proveedores", href: "/proveedores", mod: "proveedores" },
  { icon: Wallet, label: "Caja", href: "/caja", mod: "caja" },
  { icon: Receipt, label: "Gastos", href: "/gastos", mod: "gastos" },
  { icon: LineChart, label: "Finanzas", href: "/finanzas", mod: "finanzas" },
  { icon: Gift, label: "Fidelización", href: "/fidelizacion", mod: "fidelizacion" },
  { icon: BarChart3, label: "Reportes", href: "/reportes", mod: "reportes" },
];

const ADMIN_ITEMS: { icon: typeof UserCog; label: string; href: string; mod: ModuleKey }[] = [
  { icon: UserCog, label: "Usuarios", href: "/usuarios", mod: "admin" },
  { icon: ShieldCheck, label: "Roles y permisos", href: "/roles", mod: "admin" },
  { icon: Settings, label: "Configuración", href: "/configuracion", mod: "admin" },
  { icon: ShieldCheck, label: "Auditoría", href: "/auditoria", mod: "admin" },
];

interface Props {
  onNavigate?: () => void;
  forzarExpandido?: boolean;
}

export function Sidebar({ onNavigate, forzarExpandido }: Props) {
  const [collapsedState, setCollapsedState] = useState(false);
  const collapsed = forzarExpandido ? false : collapsedState;
  const location = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 240 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="flex h-full w-60 flex-col border-r border-border bg-card"
    >
      <div className="flex h-14 items-center justify-between px-4">
        {!collapsed && <span className="text-sm font-semibold">ERP Retail</span>}
        {!forzarExpandido && (
          <button
            onClick={() => setCollapsedState((c) => !c)}
            className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"
            aria-label="Colapsar menú"
          >
            <ChevronsLeft size={16} className={cn("transition-transform duration-200", collapsed && "rotate-180")} />
          </button>
        )}
      </div>

      <div className="px-2 pb-2">
        <Link
          to="/pos"
          onClick={onNavigate}
          className="flex items-center justify-center gap-2 rounded-md bg-primary py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          <Zap size={15} />
          {!collapsed && <span>Abrir POS</span>}
        </Link>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 pb-4">
        {NAV_ITEMS.map((item) => {
          const activo = location.pathname === item.href;
          const accent = item.mod ? MODULE_COLORS[item.mod] : "217 91% 45%";
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              style={{ "--accent": accent } as React.CSSProperties}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                activo
                  ? "bg-[hsl(var(--accent)/0.1)] font-medium text-[hsl(var(--accent))]"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
              {activo && !collapsed && (
                <span className="ml-auto h-1.5 w-1.5 rounded-full bg-[hsl(var(--accent))]" />
              )}
            </Link>
          );
        })}

        <div className="my-2 border-t border-border" />
        {!collapsed && (
          <p className="px-3 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/60">
            Administración
          </p>
        )}
        {ADMIN_ITEMS.map((item) => {
          const activo = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors duration-150",
                activo ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
}
