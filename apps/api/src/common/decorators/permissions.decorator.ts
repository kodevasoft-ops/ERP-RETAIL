import { SetMetadata } from "@nestjs/common";

export const PERMISSIONS_KEY = "permissions";

export interface RequiredPermission {
  modulo: string;
  accion: "ver" | "crear" | "editar" | "eliminar" | "exportar" | "importar" | "aprobar" | "anular";
}

/**
 * Uso: @RequirePermissions({ modulo: 'productos', accion: 'crear' })
 * Múltiples permisos = requiere TODOS (AND).
 */
export const RequirePermissions = (...permissions: RequiredPermission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
