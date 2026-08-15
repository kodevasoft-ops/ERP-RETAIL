/**
 * Cada módulo de negocio tiene un color de acento propio — igual que en
 * Figma cada equipo/proyecto tiene un color que lo identifica de un
 * vistazo en toda la interfaz (sidebar, badges, KPIs, gráficas).
 *
 * Los valores son HSL sin la función hsl() envolvente, para poder
 * inyectarlos como variable CSS (--accent) y consumirlos con la clase
 * Tailwind estática `text-[hsl(var(--accent))]` — así Tailwind no
 * necesita conocer cada color en build time (JIT-safe) y el color real
 * se resuelve en runtime por componente.
 */
export const MODULE_COLORS = {
  crm: "262 83% 58%",          // violeta — relaciones, seguimiento
  cotizaciones: "45 93% 47%",   // ámbar — documentos en negociación
  clientes: "330 81% 60%",      // rosa — personas
  productos: "217 91% 45%",     // azul — catálogo (color primario base)
  ventas: "152 60% 36%",        // verde — dinero entrando
  inventario: "25 95% 53%",     // naranja — bodega/stock físico
  compras: "199 89% 48%",       // cyan — flujo entrante de mercancía
  proveedores: "199 89% 48%",   // cyan — mismo dominio que compras
  caja: "160 84% 39%",          // esmeralda — efectivo, cierre de turno
  gastos: "14 90% 55%",         // coral — dinero saliendo
  finanzas: "217 91% 45%",      // azul — vista consolidada
  garantias: "0 72% 51%",       // rojo — casos que requieren atención
  devoluciones: "280 65% 60%",  // púrpura — reversa de una operación
  envios: "199 89% 48%",        // cyan — logística
  reportes: "220 9% 46%",       // gris pizarra — análisis neutral
  fidelizacion: "330 81% 60%",  // rosa — igual que clientes
  admin: "220 9% 46%",          // gris pizarra — usuarios/roles/config
} as const;

export type ModuleKey = keyof typeof MODULE_COLORS;

/** Aplica el acento de un módulo como variable CSS inline sobre cualquier elemento. */
export function moduleAccentStyle(mod: ModuleKey): React.CSSProperties {
  return { "--accent": MODULE_COLORS[mod] } as React.CSSProperties;
}
