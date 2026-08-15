import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "database";

/**
 * Pool de conexiones controlado: con múltiples réplicas del API, cada
 * proceso Node abre su propio pool hacia Postgres. Sin límite explícito,
 * N réplicas × pool_default pueden agotar `max_connections` de Postgres
 * y tumbar la base bajo carga — el peor escenario posible en producción.
 *
 * Estrategia recomendada:
 *  - Cada réplica del API se conecta a PgBouncer (puerto 6432), no directo
 *    a Postgres (ver docker-compose.prod.yml).
 *  - `connection_limit` en DATABASE_URL acota cuántas conexiones abre
 *    ESTE proceso hacia PgBouncer (no hacia Postgres directamente).
 *  - PgBouncer multiplexa cientos de conexiones lógicas sobre un pool
 *    pequeño de conexiones reales a Postgres (modo transaction pooling).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: process.env.NODE_ENV === "production" ? ["error", "warn"] : ["error", "warn", "query"],
      datasources: {
        db: { url: PrismaService.buildPooledUrl(process.env.DATABASE_URL!) },
      },
    });
  }

  private static buildPooledUrl(baseUrl: string): string {
    const url = new URL(baseUrl);
    // Por réplica: pool pequeño y acotado. 3-5 conexiones por instancia
    // es suficiente cuando PgBouncer está en modo transaction pooling.
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", process.env.DB_POOL_SIZE ?? "5");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "10"); // segundos — falla rápido en vez de encolar indefinidamente
    }
    return url.toString();
  }

  async onModuleInit() {
    await this.$connect();
    this.logger.log("Conexión a PostgreSQL establecida (pool controlado)");
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async enableShutdownHooks(app: INestApplication) {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }
}
