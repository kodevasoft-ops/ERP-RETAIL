import { SetMetadata } from "@nestjs/common";

export const IDEMPOTENT_KEY = "isIdempotent";

/**
 * Marca un endpoint mutante (POST/PATCH) como idempotente: si el cliente
 * reenvía la misma request con el mismo header `Idempotency-Key` (ej. tras
 * un timeout de red sin saber si la primera llegó), el backend devuelve
 * la respuesta original guardada en Redis en vez de reejecutar la acción.
 *
 * Para checkout de ventas ya existe una garantía más fuerte a nivel de
 * base de datos (constraint único). Este decorador cubre el resto de
 * acciones críticas de un solo disparo: recepción de compras, procesar
 * devolución, crear garantía, etc.
 */
export const Idempotent = () => SetMetadata(IDEMPOTENT_KEY, true);
