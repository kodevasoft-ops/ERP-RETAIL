export type TipoDocumento = "CC" | "CE" | "NIT" | "PASAPORTE" | "TI";
export type EtiquetaCliente = "VIP" | "MAYORISTA" | "FRECUENTE" | "NUEVO";

export interface Cliente {
  id: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  nombre: string;
  apellido?: string | null;
  email?: string | null;
  telefono?: string | null;
  whatsapp?: string | null;
  direccion?: string | null;
  ciudad?: string | null;
  fechaNacimiento?: string | null;
  etiquetas: EtiquetaCliente[];
  saldoCredito: string;
  puntosFidelizacion: number;
  notas?: string | null;
  activo: boolean;
  version: number;
  createdAt: string;
}
