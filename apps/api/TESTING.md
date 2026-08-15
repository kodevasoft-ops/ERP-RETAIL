# Estrategia de Testing

## Mapeo de lo solicitado a la terminología estándar de la industria

| Pediste | Nombre técnico | Dónde está | Qué prueba |
|---|---|---|---|
| Unitarias | Unit tests | `src/**/__tests__/*.spec.ts` | Lógica de negocio aislada (mocks), corre en milisegundos |
| Paralelas / de estrés | Concurrency tests | `test/concurrencia/*.e2e-spec.ts` | Condiciones de carrera reales contra Postgres |
| Congruentes | Consistency / integration tests | Mismo archivo de concurrencia | Invariantes: stock nunca negativo, numeración sin duplicados, idempotencia real |
| De tráfico | Load tests (k6) | `load-tests/k6-checkout.js` | 100 usuarios concurrentes sostenidos, umbrales de latencia p95/p99 |
| De sublimación | Smoke tests | `test/smoke/*.e2e-spec.ts` | ¿El sistema levantó correctamente tras un despliegue? |
| Fluidez/velocidad | Spike + Soak tests (k6) | `load-tests/k6-spike.js`, `k6-soak.js` | Picos súbitos de tráfico y degradación en carga sostenida por tiempo largo |

*(Nota honesta: "de sublimación" no es un término estándar de testing — lo interpreté como **smoke tests**, que es el concepto más cercano: una verificación rápida de que el sistema "sobrevivió" el despliegue antes de recibir tráfico real. Si te referías a otra cosa, dime y lo ajusto.)*

## Cómo correr cada batería

```bash
# Unitarias (rápidas, sin BD, corren en cada commit)
pnpm --filter api test
pnpm --filter api test:cov        # con reporte de cobertura

# Integración/concurrencia (requieren Postgres + Redis reales)
docker compose up -d postgres redis
pnpm --filter api test:concurrencia

# Smoke (requiere el mismo entorno arriba con .env configurado)
pnpm --filter api test:smoke

# Carga — requiere k6 instalado (https://k6.io/docs/get-started/installation/)
k6 run --env BASE_URL=http://localhost --env EMPRESA_ID=<uuid> load-tests/k6-checkout.js   # tráfico sostenido, 100 usuarios
k6 run --env BASE_URL=http://localhost load-tests/k6-spike.js                              # pico súbito (Black Friday)
k6 run --env BASE_URL=http://localhost load-tests/k6-soak.js                               # resistencia (fugas de memoria)
```

## Qué cubre cada test de concurrencia (el más importante de todos)

`test/concurrencia/checkout-concurrencia.e2e-spec.ts` demuestra tres invariantes
del sistema bajo condiciones de carrera **reales** (no simuladas con mocks —
usa Postgres real, porque el locking pesimista `FOR UPDATE` solo se puede
probar contra un motor de base de datos de verdad):

1. **Última unidad de stock**: dos ventas simultáneas del mismo producto con
   stock=1 → exactamente una tiene éxito, la otra rechaza. Stock final nunca
   queda en negativo.
2. **Numeración consecutiva**: 10 requests paralelas nunca generan el mismo
   número de factura — ni un salto, ni una repetición.
3. **Idempotencia bajo carrera real**: dos requests simultáneas con la misma
   `idempotencyKey` → el constraint único de Postgres garantiza que solo una
   venta se crea, incluso si ambas llegan en el mismo milisegundo.

## Honestidad sobre lo que pude verificar en este entorno

El sandbox donde trabajo no tiene Docker ni acceso a un Postgres real, así
que **escribí y razoné estos tests cuidadosamente, pero no pude ejecutarlos
aquí para confirmar que pasan tal cual**. Sí corren automáticamente en el
pipeline de CI (`.github/workflows/ci.yml`) contra Postgres y Redis reales
en cada push — ahí es donde se validan de verdad. Antes de confiar en ellos
en producción, córrelos localmente una vez con `docker compose up -d` y
revisa que el pipeline de CI esté en verde.

## Cobertura actual vs. pendiente

**Con tests reales**: Auth (hashing, lockout, rotación de refresh tokens),
Ventas (matemática de checkout, idempotencia, validación de stock/descuento),
Inventario (stock negativo, costeo promedio, permisos), Exportación
(Excel/PDF generados y verificados byte a byte), arranque de la app (smoke).

**Sin tests todavía** (incluyen el mismo patrón, solo falta escribirlos):
CRM, Compras, Devoluciones, Garantías, Caja, Cotizaciones, Fidelización,
Reportes (las consultas SQL), Configuración. El patrón en
`src/common/testing/prisma-mock.ts` + los specs existentes es la plantilla
a seguir para extender cobertura a estos módulos.
