/**
 * Tests de concurrencia: requieren una base de datos Postgres REAL (no
 * mocks) — el propósito es probar que el locking pesimista (`FOR UPDATE`)
 * y los constraints únicos realmente previenen condiciones de carrera bajo
 * requests paralelas simultáneas, algo que un test unitario con mocks no
 * puede demostrar (los mocks no tienen bloqueo de filas real).
 *
 * Requiere: DATABASE_URL apuntando a una BD de test y REDIS_HOST/PORT.
 * Se ejecutan en CI (ver .github/workflows/ci.yml) con servicios postgres
 * y redis reales. Localmente: `pnpm test:concurrencia` con docker-compose
 * levantado.
 */
import { PrismaClient } from "database";
import * as argon2 from "argon2";
import { randomUUID } from "node:crypto";

const prisma = new PrismaClient();

let empresaId: string;
let sucursalId: string;
let usuarioId: string;
let varianteId: string;

beforeAll(async () => {
  const empresa = await prisma.empresa.create({
    data: { nombre: "Test Concurrencia", nit: `TEST-${randomUUID().slice(0, 8)}` },
  });
  empresaId = empresa.id;

  const sucursal = await prisma.sucursal.create({
    data: { empresaId, nombre: "Sucursal Test", codigo: "TEST" },
  });
  sucursalId = sucursal.id;

  const usuario = await prisma.usuario.create({
    data: {
      empresaId,
      email: `test-${randomUUID()}@test.com`,
      passwordHash: await argon2.hash("Test1234!"),
      nombre: "Test",
      apellido: "User",
    },
  });
  usuarioId = usuario.id;

  const producto = await prisma.producto.create({
    data: { empresaId, codigo: `SKU-${randomUUID().slice(0, 8)}`, nombre: "Producto de prueba" },
  });

  const variante = await prisma.variante.create({
    data: {
      productoId: producto.id,
      sucursalId,
      talla: "M",
      color: "Negro",
      sku: `VAR-${randomUUID().slice(0, 8)}`,
      stock: 1, // A PROPÓSITO: solo 1 unidad — el caso límite real de concurrencia
      stockMinimo: 0,
      costoCompra: 10_000,
      costoPromedio: 10_000,
      precioVenta: 20_000,
      iva: 0,
    },
  });
  varianteId = variante.id;
});

afterAll(async () => {
  await prisma.empresa.deleteMany({ where: { id: empresaId } }); // cascada limpia el resto vía FKs manuales si aplica
  await prisma.$disconnect();
});

describe("Concurrencia: última unidad de stock", () => {
  it(
    "dos ventas simultáneas del último ítem en stock: solo UNA debe tener éxito, la otra debe rechazar por stock insuficiente",
    async () => {
      // Simula el mismo patrón que VentasService.crear usa en producción:
      // SELECT ... FOR UPDATE dentro de una transacción, luego decremento.
      const intentarVenta = async () => {
        try {
          return await prisma.$transaction(async (tx) => {
            const rows = await tx.$queryRaw<{ stock: number }[]>`
              SELECT stock FROM variantes WHERE id = ${varianteId} FOR UPDATE
            `;
            const stockActual = rows[0].stock;

            if (stockActual < 1) {
              throw new Error("STOCK_INSUFICIENTE");
            }

            // Simula trabajo real (cálculo de totales, etc.) para ampliar
            // la ventana de la condición de carrera si el locking fallara.
            await new Promise((r) => setTimeout(r, 50));

            await tx.variante.update({ where: { id: varianteId }, data: { stock: stockActual - 1 } });
            return "exito";
          });
        } catch (e) {
          return "rechazado";
        }
      };

      // Dos requests genuinamente paralelas — igual que dos cajeros
      // cobrando al mismo tiempo el último producto en el mostrador.
      const [resultado1, resultado2] = await Promise.all([intentarVenta(), intentarVenta()]);

      const resultados = [resultado1, resultado2];
      expect(resultados.filter((r) => r === "exito")).toHaveLength(1);
      expect(resultados.filter((r) => r === "rechazado")).toHaveLength(1);

      const varianteFinal = await prisma.variante.findUniqueOrThrow({ where: { id: varianteId } });
      expect(varianteFinal.stock).toBe(0); // nunca debe quedar negativo ni duplicarse la venta
    },
    15_000,
  );
});

describe("Concurrencia: numeración consecutiva de ventas", () => {
  it("10 requests paralelas nunca generan el mismo número de venta (constraint único + UPDATE atómico)", async () => {
    await prisma.numeracion.deleteMany({ where: { empresaId, sucursalId, tipo: "venta-test" } });

    const obtenerSiguienteNumero = async () => {
      return prisma.$transaction(async (tx) => {
        await tx.numeracion.upsert({
          where: { empresaId_sucursalId_tipo: { empresaId, sucursalId, tipo: "venta-test" } },
          update: {},
          create: { empresaId, sucursalId, tipo: "venta-test", consecutivoActual: 0 },
        });
        const actualizado = await tx.numeracion.update({
          where: { empresaId_sucursalId_tipo: { empresaId, sucursalId, tipo: "venta-test" } },
          data: { consecutivoActual: { increment: 1 } },
        });
        return actualizado.consecutivoActual;
      });
    };

    const numeros = await Promise.all(Array.from({ length: 10 }, () => obtenerSiguienteNumero()));
    const numerosUnicos = new Set(numeros);

    expect(numerosUnicos.size).toBe(10); // ningún número se repitió
    expect(Math.max(...numeros)).toBe(10); // el consecutivo terminó exactamente en 10, sin saltos ni huecos
  }, 15_000);
});

describe("Concurrencia: idempotencia bajo requests simultáneas", () => {
  it("dos requests con la misma idempotencyKey en paralelo: el constraint único garantiza una sola venta creada", async () => {
    const idempotencyKey = `idem-test-${randomUUID()}`;

    const crearVenta = async () => {
      try {
        return await prisma.venta.create({
          data: {
            empresaId,
            sucursalId,
            numero: Math.floor(Math.random() * 1_000_000), // evita colisión con el test de numeración
            vendedorId: usuarioId,
            subtotal: 100_000,
            ivaTotal: 0,
            total: 100_000,
            idempotencyKey,
          },
        });
      } catch {
        return null; // constraint único rechazó el duplicado — comportamiento esperado
      }
    };

    const [venta1, venta2] = await Promise.all([crearVenta(), crearVenta()]);
    const exitosas = [venta1, venta2].filter(Boolean);

    expect(exitosas).toHaveLength(1); // el constraint único (empresaId, idempotencyKey) rechazó al segundo
  }, 15_000);
});
