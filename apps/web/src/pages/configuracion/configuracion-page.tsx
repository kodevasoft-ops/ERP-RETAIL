import { useState } from "react";
import {
  useCategorias, useCrearCategoria, useEliminarCategoria,
  useMarcas, useCrearMarca, useEliminarMarca,
  useTransportadoras, useCrearTransportadora,
  useSucursales, useCrearSucursal,
} from "./use-configuracion";
import { CatalogoPanel } from "./components/catalogo-panel";
import { TiendaPanel } from "./components/tienda-panel";

const TABS = ["Tienda en línea", "Sucursales", "Categorías", "Marcas", "Transportadoras"] as const;

export default function ConfiguracionPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>("Sucursales");

  const categorias = useCategorias();
  const crearCategoria = useCrearCategoria();
  const eliminarCategoria = useEliminarCategoria();

  const marcas = useMarcas();
  const crearMarca = useCrearMarca();
  const eliminarMarca = useEliminarMarca();

  const transportadoras = useTransportadoras();
  const crearTransportadora = useCrearTransportadora();

  const sucursales = useSucursales();
  const crearSucursal = useCrearSucursal();

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Catálogos base usados en todo el sistema.</p>
      </div>

      <div className="flex gap-1 rounded-md bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 rounded-md py-1.5 text-sm font-medium transition-colors ${
              tab === t ? "bg-card shadow-sm" : "text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Tienda en línea" && <TiendaPanel />}

      {tab === "Sucursales" && (
        <CatalogoPanel
          titulo="Sucursales"
          descripcion="Cada sucursal tiene su propio inventario y caja."
          items={sucursales.data}
          isLoading={sucursales.isLoading}
          creando={crearSucursal.isPending}
          onCrear={(nombre) => crearSucursal.mutate({ nombre, codigo: nombre.toUpperCase().replace(/\s+/g, "_").slice(0, 10) })}
        />
      )}

      {tab === "Categorías" && (
        <CatalogoPanel
          titulo="Categorías de productos"
          descripcion="Usadas para clasificar el catálogo y filtrar reportes."
          items={categorias.data}
          isLoading={categorias.isLoading}
          creando={crearCategoria.isPending}
          onCrear={(nombre) => crearCategoria.mutate({ nombre })}
          onEliminar={(id) => eliminarCategoria.mutate(id)}
        />
      )}

      {tab === "Marcas" && (
        <CatalogoPanel
          titulo="Marcas"
          descripcion="Marca o fabricante de cada producto."
          items={marcas.data}
          isLoading={marcas.isLoading}
          creando={crearMarca.isPending}
          onCrear={(nombre) => crearMarca.mutate({ nombre })}
          onEliminar={(id) => eliminarMarca.mutate(id)}
        />
      )}

      {tab === "Transportadoras" && (
        <CatalogoPanel
          titulo="Transportadoras"
          descripcion="Empresas de envío disponibles para los pedidos."
          items={transportadoras.data}
          isLoading={transportadoras.isLoading}
          creando={crearTransportadora.isPending}
          onCrear={(nombre) => crearTransportadora.mutate({ nombre })}
        />
      )}
    </div>
  );
}
