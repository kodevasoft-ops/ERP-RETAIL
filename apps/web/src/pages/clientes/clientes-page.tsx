import { useState } from "react";
import { ClientesTable } from "./components/clientes-table";
import { ClienteDrawer } from "./components/cliente-drawer";
import type { Cliente } from "./clientes.types";

export default function ClientesPage() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">Base de clientes, etiquetas y fidelización.</p>
      </div>

      <ClientesTable
        onNuevo={() => {
          setClienteEditando(null);
          setDrawerOpen(true);
        }}
        onEditar={(cliente) => {
          setClienteEditando(cliente);
          setDrawerOpen(true);
        }}
      />

      <ClienteDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} cliente={clienteEditando} />
    </div>
  );
}
