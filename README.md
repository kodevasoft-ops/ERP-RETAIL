# ERP Retail — Fundación del Sistema

Base arquitectónica del ERP+CRM. Todo módulo de negocio (Productos, Ventas,
CRM, Inventario, etc.) se construye **sobre** esta fundación, reutilizando
sus mismos patrones.

## Decisiones clave y por qué

| Área | Decisión | Razón |
|---|---|---|
| Monorepo | pnpm workspaces + Turborepo | Cache de builds, ejecución paralela, un solo lockfile |
| HTTP | NestJS + **Fastify** (no Express) | ~2x throughput, menor latencia por request |
| ORM | Prisma | Type-safety end-to-end, previene N+1 con `include` explícito, migraciones versionadas |
| DB | PostgreSQL con RLS lógica por `empresaId`/`sucursalId` | Multi-tenant sin duplicar infraestructura |
| Cache | Redis (cache-aside, TTL por dominio) | Reduce carga a Postgres en lecturas frecuentes |
| Auth | JWT access (15 min) + refresh rotativo con **detección de reuso** | Revocación real; si un refresh token robado se reutiliza, se cierra toda la sesión |
| Passwords | Argon2id (params OWASP) | Resistente a GPU-cracking, superior a bcrypt |
| Frontend build | Vite + manualChunks (vendor split) + Brotli | Cache de largo plazo para libs, bundles iniciales pequeños |
| Rutas | Lazy loading por página | Cada pantalla es su propio chunk — el usuario no descarga el ERP completo en el primer load |
| Logs | Pino (no Winston) | Logging asíncrono de bajísimo overhead |
| Estado auth (front) | Access token en memoria (Zustand), refresh en cookie HttpOnly | Mitiga robo persistente vía XSS |

## Seguridad ya implementada en la base

- RBAC granular por módulo+acción (`PermissionsGuard`, fail-closed por defecto)
- Rate limiting global + reforzado en `/auth/login` (anti brute-force)
- Lockout de cuenta tras 5 intentos fallidos (15 min)
- Helmet + CSP + HSTS + CORS whitelist (nunca `*`)
- Validación estricta de entrada (`class-validator` + `whitelist: true`)
- Filtro global de excepciones: nunca expone stack traces ni errores internos
- Correlation ID en cada request (trazabilidad end-to-end)
- Auditoría estructurada (`AuditLog`) lista para usarse desde cualquier módulo
- Variables de entorno validadas con Zod al boot (falla rápido si falta config)
- Soft delete (`deletedAt`) + optimistic locking (`version`) en entidades críticas

## Arranque local

```bash
cp apps/api/.env.example apps/api/.env   # y generar secrets reales
docker compose up -d                     # Postgres + Redis + MinIO
pnpm install
pnpm db:generate
pnpm db:migrate
pnpm dev                                 # API en :3000, Web en :5173
```

Docs de API: `http://localhost:3000/api/docs` (Swagger, solo fuera de producción).

## Siguiente paso

Con la fundación lista, cada módulo de negocio sigue el mismo patrón:
`modules/<dominio>/` con su propio controller, service, DTOs validados,
`@RequirePermissions`, y entidades Prisma agregadas al schema con sus índices.

## Estado del sistema (22 módulos backend, 21 páginas frontend)

**Operación diaria**: Productos (variantes talla/color), Inventario (kardex
con locking pesimista `FOR UPDATE`), Clientes, CRM (Kanban drag&drop),
POS/Ventas (checkout idempotente + numeración atómica), Compras/Proveedores
(recepción parcial + costeo promedio ponderado), Usuarios/Roles (matriz de
permisos), Caja (arqueo automático), Cotizaciones (conversión real a venta
enlazada 1-a-1), Garantías/Devoluciones (reversa/intercambio de inventario
transaccional), Envíos (máquina de estados + tracking).

**Analítica y finanzas**: Reportes (exportación real a `.xlsx` con ExcelJS
—formato moneda, autofiltro, totales— y `.pdf` con PDFKit —paginado,
encabezado repetido, pie de página—), Gastos (con retiro automático de Caja),
Finanzas (utilidad bruta/neta real, flujo de caja diario).

**Soporte**: Configuración (categorías/marcas/transportadoras/sucursales),
Fidelización (ledger de puntos, nunca sobreescribe saldo), Notificaciones
(disparadores reales: stock bajo tras venta, lead asignado — visibles en el
dropdown del header).

### Decisiones de diseño que vale la pena conocer antes de extender

- **Costo histórico aproximado**: el costo de venta en Finanzas usa el
  `costoPromedio` *actual* de la variante, no un valor congelado por línea de
  venta. Es la aproximación estándar en sistemas sin costeo histórico por
  transacción; si se necesita exactitud contable estricta, agregar un campo
  `costoUnitarioHistorico` a `VentaItem` capturado en el momento del checkout.
- **Referencias "sueltas" entre sucursal/empresa**: campos como
  `Usuario.sucursalId` o `MovimientoInventario.sucursalId` son strings sin
  relación Prisma formal (no FK). Es intencional para mantener el schema
  ágil; Postgres no valida la integridad referencial ahí — si se requiere,
  se puede añadir la relación explícita sin romper nada existente.
- **IDs de sucursal/caja hardcodeados en el frontend** (`00000000-...`):
  marcados con `// TODO` en cada archivo. Deben reemplazarse por el
  contexto real de sesión (sucursal activa del usuario) una vez exista.
- **Notificaciones**: el servicio es `@Global()`, así que cualquier módulo
  nuevo puede inyectar `NotificacionesService` sin declarar el import. Solo
  dos disparadores están conectados (stock bajo, lead asignado) como
  demostración del patrón — extenderlo a cumpleaños, cotizaciones vencidas,
  etc. es agregar una llamada a `.crear()` en el servicio correspondiente.

### Para producción, antes de ir en vivo

1. Generar secrets reales (`openssl rand -base64 48`) para JWT/cookies/AES.
2. Reemplazar los `SUCURSAL_DEFAULT`/`CAJA_DEFAULT` hardcodeados por el
   contexto de sesión real.
3. Correr `pnpm db:generate && pnpm db:migrate` y revisar el plan de
   migración antes de aplicarlo (schema con 65 modelos/enums).
4. Configurar MinIO/S3 real para `comprobanteUrl`, fotos de garantías, etc.
   (por ahora esos campos son solo `String` esperando una URL).
5. Escribir tests — el sistema no incluye suite de tests todavía; es la
   brecha más importante para llevar esto a producción con confianza.
