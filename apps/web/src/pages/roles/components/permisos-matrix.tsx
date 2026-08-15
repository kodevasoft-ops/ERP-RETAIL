import { usePermisosDisponibles } from "../use-roles";

interface Props {
  seleccionados: Set<string>; // formato "modulo:accion"
  onToggle: (modulo: string, accion: string) => void;
  disabled?: boolean;
}

const ACCION_LABEL: Record<string, string> = {
  ver: "Ver",
  crear: "Crear",
  editar: "Editar",
  eliminar: "Eliminar",
  exportar: "Exportar",
  importar: "Importar",
  aprobar: "Aprobar",
  anular: "Anular",
};

export function PermisosMatrix({ seleccionados, onToggle, disabled }: Props) {
  const { data: catalogo, isLoading } = usePermisosDisponibles();

  if (isLoading || !catalogo) {
    return <p className="text-sm text-muted-foreground">Cargando catálogo de permisos...</p>;
  }

  const modulos = Object.keys(catalogo).sort();
  const acciones = Object.keys(ACCION_LABEL);

  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted/50">
          <tr>
            <th className="sticky left-0 bg-muted/50 px-3 py-2 text-left font-medium">Módulo</th>
            {acciones.map((a) => (
              <th key={a} className="px-2 py-2 text-center font-medium">
                {ACCION_LABEL[a]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {modulos.map((modulo) => (
            <tr key={modulo}>
              <td className="sticky left-0 bg-card px-3 py-2 font-medium capitalize">{modulo}</td>
              {acciones.map((accion) => {
                const existe = catalogo[modulo].some((p) => p.accion === accion);
                const key = `${modulo}:${accion}`;
                return (
                  <td key={accion} className="px-2 py-2 text-center">
                    {existe ? (
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={seleccionados.has(key)}
                        onChange={() => onToggle(modulo, accion)}
                      />
                    ) : (
                      <span className="text-muted-foreground/30">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
