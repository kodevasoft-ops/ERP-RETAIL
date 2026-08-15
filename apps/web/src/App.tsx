import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import { PageSkeleton } from "@/components/layout/page-skeleton";

// Cada página es su propio chunk: la primera carga solo trae lo necesario.
const DashboardPage = lazy(() => import("@/pages/dashboard/dashboard-page"));
const LoginPage = lazy(() => import("@/pages/login/login-page"));
const TiendaPage = lazy(() => import("@/pages/tienda/tienda-page"));
const ProductosPage = lazy(() => import("@/pages/productos/productos-page"));
const InventarioPage = lazy(() => import("@/pages/inventario/inventario-page"));
const ClientesPage = lazy(() => import("@/pages/clientes/clientes-page"));
const CrmPage = lazy(() => import("@/pages/crm/crm-page"));
const PosPage = lazy(() => import("@/pages/pos/pos-page"));
const VentasPage = lazy(() => import("@/pages/ventas/ventas-page"));
const ProveedoresPage = lazy(() => import("@/pages/proveedores/proveedores-page"));
const ComprasPage = lazy(() => import("@/pages/compras/compras-page"));
const UsuariosPage = lazy(() => import("@/pages/usuarios/usuarios-page"));
const RolesPage = lazy(() => import("@/pages/roles/roles-page"));
const CajaPage = lazy(() => import("@/pages/caja/caja-page"));
const CotizacionesPage = lazy(() => import("@/pages/cotizaciones/cotizaciones-page"));
const GarantiasPage = lazy(() => import("@/pages/garantias/garantias-page"));
const DevolucionesPage = lazy(() => import("@/pages/devoluciones/devoluciones-page"));
const ReportesPage = lazy(() => import("@/pages/reportes/reportes-page"));
const GastosPage = lazy(() => import("@/pages/gastos/gastos-page"));
const CarteraPage = lazy(() => import("@/pages/cartera/cartera-page"));
const AuditoriaPage = lazy(() => import("@/pages/auditoria/auditoria-page"));
const FinanzasPage = lazy(() => import("@/pages/finanzas/finanzas-page"));
const EnviosPage = lazy(() => import("@/pages/envios/envios-page"));
const ConfiguracionPage = lazy(() => import("@/pages/configuracion/configuracion-page"));
const FidelizacionPage = lazy(() => import("@/pages/fidelizacion/fidelizacion-page"));

export function App() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/tienda/:empresaId" element={<TiendaPage />} />
        <Route path="/pos" element={<PosPage />} />
        <Route element={<AppShell />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/productos" element={<ProductosPage />} />
          <Route path="/inventario" element={<InventarioPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/crm" element={<CrmPage />} />
          <Route path="/ventas" element={<VentasPage />} />
          <Route path="/proveedores" element={<ProveedoresPage />} />
          <Route path="/compras" element={<ComprasPage />} />
          <Route path="/usuarios" element={<UsuariosPage />} />
          <Route path="/roles" element={<RolesPage />} />
          <Route path="/caja" element={<CajaPage />} />
          <Route path="/cotizaciones" element={<CotizacionesPage />} />
          <Route path="/garantias" element={<GarantiasPage />} />
          <Route path="/devoluciones" element={<DevolucionesPage />} />
          <Route path="/reportes" element={<ReportesPage />} />
          <Route path="/gastos" element={<GastosPage />} />
          <Route path="/cartera" element={<CarteraPage />} />
          <Route path="/auditoria" element={<AuditoriaPage />} />
          <Route path="/finanzas" element={<FinanzasPage />} />
          <Route path="/envios" element={<EnviosPage />} />
          <Route path="/configuracion" element={<ConfiguracionPage />} />
          <Route path="/fidelizacion" element={<FidelizacionPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
