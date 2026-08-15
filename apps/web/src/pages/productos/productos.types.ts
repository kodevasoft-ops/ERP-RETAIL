export interface Variante {
  id: string;
  sucursalId: string;
  talla: string;
  color: string;
  sku: string;
  codigoBarras?: string | null;
  stock: number;
  stockMinimo: number;
  costoCompra: string;
  costoPromedio: string;
  precioVenta: string;
  precioMayorista?: string | null;
  precioVip?: string | null;
  iva: string;
  descuentoMax: string;
  activo: boolean;
}

export interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  categoria?: { id: string; nombre: string } | null;
  marca?: { id: string; nombre: string } | null;
  sexo?: "HOMBRE" | "MUJER" | "UNISEX" | null;
  temporada?: string | null;
  coleccion?: string | null;
  activo: boolean;
  version: number;
  variantes: Variante[];
  imagenes: { id: string; url: string; esPrincipal: boolean }[];
  createdAt: string;
  updatedAt: string;
}

export type { PaginatedResponse } from "@/lib/types";
export interface CreateVarianteInput {
  sucursalId: string;
  talla: string;
  color: string;
  sku: string;
  codigoBarras?: string;
  stock: number;
  stockMinimo: number;
  costoCompra: number;
  precioVenta: number;
  precioMayorista?: number;
  precioVip?: number;
  iva?: number;
  descuentoMax?: number;
}

export interface CreateProductoInput {
  codigo: string;
  nombre: string;
  descripcion?: string;
  categoriaId?: string;
  marcaId?: string;
  sexo?: "HOMBRE" | "MUJER" | "UNISEX";
  temporada?: string;
  coleccion?: string;
  variantes: CreateVarianteInput[];
}
