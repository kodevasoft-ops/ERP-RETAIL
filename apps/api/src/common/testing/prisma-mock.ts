/**
 * Mock profundo de PrismaService para tests unitarios. Cada método usado
 * en los servicios se expone como jest.fn() — los tests configuran el
 * valor de retorno específico que necesitan con mockResolvedValueOnce.
 *
 * Para $transaction: ejecuta el callback pasándole el mismo mock como
 * "tx", simulando que toda la transacción ocurre sobre el mismo cliente
 * mockeado (suficiente para verificar lógica de negocio sin una BD real).
 */
export function createPrismaMock() {
  const mock: Record<string, unknown> = {
    $transaction: jest.fn((callback: (tx: unknown) => unknown) => callback(mock)),
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
    $connect: jest.fn(),
  };

  const modelos = [
    "usuario", "sesion", "refreshToken", "rol", "permiso", "usuarioRol", "rolPermiso",
    "producto", "variante", "categoria", "marca",
    "movimientoInventario",
    "cliente",
    "lead", "leadSeguimiento",
    "venta", "ventaItem", "pago", "numeracion",
    "proveedor", "ordenCompra", "ordenCompraItem", "cuentaPorPagar",
    "cotizacion", "cotizacionItem",
    "garantia",
    "devolucion", "devolucionItem",
    "sesionCaja", "movimientoCaja", "caja",
    "gasto",
    "auditLog", "notificacion",
  ];

  for (const modelo of modelos) {
    mock[modelo] = {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      createMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      groupBy: jest.fn(),
      upsert: jest.fn(),
    };
  }

  return mock as any; // eslint-disable-line @typescript-eslint/no-explicit-any -- mock de test: se necesita acceso laxo a cualquier modelo/método
}
