import type { ReactNode } from "react";
import { ExportButtons } from "./export-buttons";

interface Props {
  titulo: string;
  endpoint?: string;
  params?: Record<string, string>;
  children: ReactNode;
}

export function ReportCard({ titulo, endpoint, params, children }: Props) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-medium">{titulo}</h3>
        {endpoint && <ExportButtons endpoint={endpoint} params={params} />}
      </div>
      {children}
    </div>
  );
}
