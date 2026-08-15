import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ThrottlerModule, ThrottlerGuard } from "@nestjs/throttler";
import { ThrottlerStorageRedisService } from "@nest-lab/throttler-storage-redis";
import { CacheModule } from "@nestjs/cache-manager";
import { redisStore } from "cache-manager-ioredis-yet";
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";
import { LoggerModule } from "nestjs-pino";
import { validateEnv } from "./config/env.validation";
import { RedisModule } from "./redis/redis.module";
import { DatabaseModule } from "./database/database.module";
import { AuthModule } from "./modules/auth/auth.module";
import { HealthModule } from "./modules/health/health.module";
import { ProductosModule } from "./modules/productos/productos.module";
import { InventarioModule } from "./modules/inventario/inventario.module";
import { ClientesModule } from "./modules/clientes/clientes.module";
import { CrmModule } from "./modules/crm/crm.module";
import { VentasModule } from "./modules/ventas/ventas.module";
import { ProveedoresModule } from "./modules/proveedores/proveedores.module";
import { ComprasModule } from "./modules/compras/compras.module";
import { UsuariosModule } from "./modules/usuarios/usuarios.module";
import { RolesModule } from "./modules/roles/roles.module";
import { CajaModule } from "./modules/caja/caja.module";
import { CotizacionesModule } from "./modules/cotizaciones/cotizaciones.module";
import { GarantiasModule } from "./modules/garantias/garantias.module";
import { DevolucionesModule } from "./modules/devoluciones/devoluciones.module";
import { ReportesModule } from "./modules/reportes/reportes.module";
import { GastosModule } from "./modules/gastos/gastos.module";
import { FinanzasModule } from "./modules/finanzas/finanzas.module";
import { EnviosModule } from "./modules/envios/envios.module";
import { ConfiguracionModule } from "./modules/configuracion/configuracion.module";
import { FidelizacionModule } from "./modules/fidelizacion/fidelizacion.module";
import { NotificacionesModule } from "./modules/notificaciones/notificaciones.module";
import { GlobalExceptionFilter } from "./common/filters/global-exception.filter";
import { CorrelationIdInterceptor } from "./common/interceptors/correlation-id.interceptor";
import { TimeoutInterceptor } from "./common/interceptors/timeout.interceptor";
import { IdempotencyInterceptor } from "./common/interceptors/idempotency.interceptor";
import { JwtAuthGuard } from "./common/guards/jwt-auth.guard";
import { PermissionsGuard } from "./common/guards/permissions.guard";
import { TiendaModule } from "./modules/tienda/tienda.module";
import { StorageModule } from "./storage/storage.module";
import { CarteraModule } from "./modules/cartera/cartera.module";
import { AuditoriaModule } from "./modules/auditoria/auditoria.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      cache: true,
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.NODE_ENV === "production" ? "info" : "debug",
        redact: ["req.headers.authorization", "req.headers.cookie"],
        autoLogging: true,
      },
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [{ ttl: 60_000, limit: 100 }],
        // Storage compartido en Redis: el rate limit es correcto sin
        // importar cuántas réplicas del API estén corriendo detrás del LB.
        storage: new ThrottlerStorageRedisService(
          `redis://${config.get("REDIS_PASSWORD") ? ":" + config.get("REDIS_PASSWORD") + "@" : ""}${config.get("REDIS_HOST")}:${config.get("REDIS_PORT")}`,
        ),
      }),
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => ({
        store: await redisStore({
          host: config.get<string>("REDIS_HOST"),
          port: config.get<number>("REDIS_PORT"),
          password: config.get<string>("REDIS_PASSWORD") || undefined,
        }),
        ttl: 30_000, // default; cada endpoint puede sobreescribir con @CacheTTL
      }),
    }),
    RedisModule,
    DatabaseModule,
    NotificacionesModule,
    AuthModule,
    HealthModule,
    ProductosModule,
    InventarioModule,
    ClientesModule,
    CrmModule,
    VentasModule,
    ProveedoresModule,
    ComprasModule,
    UsuariosModule,
    RolesModule,
    CajaModule,
    CotizacionesModule,
    GarantiasModule,
    DevolucionesModule,
    ReportesModule,
    GastosModule,
    FinanzasModule,
    EnviosModule,
    ConfiguracionModule,
    FidelizacionModule,
    TiendaModule,
    StorageModule,
    CarteraModule,
    AuditoriaModule,
  ],
  providers: [
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: CorrelationIdInterceptor },
    { provide: APP_INTERCEPTOR, useClass: TimeoutInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // autenticación por defecto
    { provide: APP_GUARD, useClass: PermissionsGuard }, // RBAC por defecto
  ],
})
export class AppModule {}
