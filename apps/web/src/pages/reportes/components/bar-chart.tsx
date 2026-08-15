interface Props {
  datos: { label: string; valor: number }[];
  formatoValor?: (v: number) => string;
}

export function BarChart({ datos, formatoValor }: Props) {
  if (datos.length === 0) {
    return <p className="text-sm text-muted-foreground">No hay datos para el rango seleccionado.</p>;
  }

  const max = Math.max(...datos.map((d) => d.valor), 1);
  const alto = 200;
  const anchoBarra = 100 / datos.length;

  return (
    <div>
      <svg viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" className="h-52 w-full">
        {datos.map((d, i) => {
          const alturaBarra = (d.valor / max) * (alto - 20);
          return (
            <g key={i}>
              <rect
                x={i * anchoBarra + anchoBarra * 0.15}
                y={alto - 20 - alturaBarra}
                width={anchoBarra * 0.7}
                height={alturaBarra}
                rx={1}
                className="fill-primary transition-all"
              >
                <title>{`${d.label}: ${formatoValor ? formatoValor(d.valor) : d.valor}`}</title>
              </rect>
            </g>
          );
        })}
      </svg>
      <div className="mt-1 flex text-[9px] text-muted-foreground">
        {datos.map((d, i) => (
          <div key={i} style={{ width: `${anchoBarra}%` }} className="truncate text-center">
            {d.label}
          </div>
        ))}
      </div>
    </div>
  );
}
