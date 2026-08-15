import { PrismaClient } from "@prisma/client";

/**
 * Cliente único reutilizable en toda la app (NestJS lo envuelve en un
 * provider con lifecycle hooks — ver apps/api/src/database/prisma.service.ts).
 *
 * Decisión de rendimiento: los modelos con deletedAt implementan soft-delete
 * a nivel de QUERY (filtros explícitos en cada repositorio/servicio), no vía
 * middleware global, para evitar overhead en queries que ya excluyen por índice.
 */
export const createPrismaClient = () =>
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["error", "warn"]
        : ["error", "warn", "query"],
  });

export * from "@prisma/client";
