import { BadRequestException } from "@nestjs/common";
import { VentasService } from "../ventas.service";
import { AuditService } from "../../../common/services/audit.service";
import { NotificacionesService } from "../../notificaciones/notificaciones.service";
import { createPrismaMock } from "../../../common/testing/prisma-mock";

describe("VentasService", () => {
  let service: VentasService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let audit: jest.Mocked<AuditService>;
  let notificaciones: jest.Mocked<NotificacionesService>;

  const ctx = { empresaId: "empresa-1", usuarioId: "user-1", permisos: [] as string[] };

  beforeEach(() => {
    prisma = createPrismaMock();
    audit = { registrar: jest.fn() } as never;
    notificaciones = { crear: jest.fn() } as never;
    service = new VentasService(prisma, audit, notificaciones);
  });

  describe("crear", () => {
    const dtoBase = {
      sucursalId: "sucursal-1",
      items: [{ varianteId: "variante-1", cantidad: 2 }],
      pagos: [{ metodo: "EFECTIVO" as const, monto: 232_000 }],
      idempotencyKey: "clave-idempotencia-unica-123",
    };

    function mockVarianteDisponible(overrides: Partial<Record<string, unknown>> = {}) {
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([
        {
          id: "variante-1",
          stock: 10,
          precio_venta: "100000",
          iva: "16",
          descuento_max: "10",
          sucursal_id: "sucursal-1",
          ...overrides,
        },
      ]);
    }

    it("es idempotente: si la idempotencyKey ya existe, devuelve la venta previa sin reejecutar la lógica", async () => {
      const ventaExistente = { id: "venta-existente", items: [], pagos: [] };
      (prisma.venta.findUnique as jest.Mock).mockResolvedValueOnce(ventaExistente);

      const resultado = await service.crear(dtoBase, ctx);

      expect(resultado).toBe(ventaExistente);
      // Nunca debió intentar tocar el stock de nuevo.
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it("calcula subtotal, IVA y total correctamente con descuento aplicado", async () => {
      (prisma.venta.findUnique as jest.Mock).mockResolvedValueOnce(null);
      mockVarianteDisponible();
      (prisma.numeracion.upsert as jest.Mock).mockResolvedValueOnce({});
      (prisma.numeracion.update as jest.Mock).mockResolvedValueOnce({ consecutivoActual: 1 });

      let ventaCreadaConData: any;
      (prisma.venta.create as jest.Mock).mockImplementationOnce((args: any) => {
        ventaCreadaConData = args.data;
        return { id: "venta-1", prefijo: "", numero: 1, items: [], pagos: [] };
      });
      (prisma.variante.findUniqueOrThrow as jest.Mock).mockResolvedValue({ stock: 8 });
      (prisma.movimientoInventario.create as jest.Mock).mockResolvedValue({});
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]); // notificarStockBajo: sin resultados

      await service.crear(
        {
          ...dtoBase,
          items: [{ varianteId: "variante-1", cantidad: 2, descuentoPorcentaje: 10 }],
          pagos: [{ metodo: "EFECTIVO", monto: 208_800 }], // 100000*2*0.9 = 180000; +16% IVA = 208800
        },
        ctx,
      );

      // subtotal = 180000 (con descuento), iva = 28800, total = 208800
      expect(Number(ventaCreadaConData.subtotal)).toBeCloseTo(180_000);
      expect(Number(ventaCreadaConData.ivaTotal)).toBeCloseTo(28_800);
      expect(Number(ventaCreadaConData.total)).toBeCloseTo(208_800);
    });

    it("rechaza la venta si el stock disponible es menor a la cantidad solicitada", async () => {
      (prisma.venta.findUnique as jest.Mock).mockResolvedValueOnce(null);
      mockVarianteDisponible({ stock: 1 }); // solo 1 disponible, se piden 2

      await expect(service.crear(dtoBase, ctx)).rejects.toThrow(BadRequestException);
      // No debe haber intentado crear la venta si el stock no alcanza.
      expect(prisma.venta.create).not.toHaveBeenCalled();
    });

    it("rechaza la venta si el descuento solicitado excede el descuento máximo permitido", async () => {
      (prisma.venta.findUnique as jest.Mock).mockResolvedValueOnce(null);
      mockVarianteDisponible({ descuento_max: "5" });

      await expect(
        service.crear(
          { ...dtoBase, items: [{ varianteId: "variante-1", cantidad: 1, descuentoPorcentaje: 20 }] },
          ctx,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it("rechaza la venta si la suma de pagos no coincide con el total", async () => {
      (prisma.venta.findUnique as jest.Mock).mockResolvedValueOnce(null);
      mockVarianteDisponible();

      await expect(
        service.crear({ ...dtoBase, pagos: [{ metodo: "EFECTIVO", monto: 1_000 }] }, ctx),
      ).rejects.toThrow(BadRequestException);
    });

    it("tolera diferencias de redondeo menores a 1 unidad monetaria", async () => {
      (prisma.venta.findUnique as jest.Mock).mockResolvedValueOnce(null);
      mockVarianteDisponible();
      (prisma.numeracion.upsert as jest.Mock).mockResolvedValueOnce({});
      (prisma.numeracion.update as jest.Mock).mockResolvedValueOnce({ consecutivoActual: 1 });
      (prisma.venta.create as jest.Mock).mockResolvedValueOnce({ id: "venta-1", prefijo: "", numero: 1, items: [], pagos: [] });
      (prisma.variante.findUniqueOrThrow as jest.Mock).mockResolvedValue({ stock: 8 });
      (prisma.movimientoInventario.create as jest.Mock).mockResolvedValue({});
      (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([]);

      // Total real: 100000*2*1.16 = 232000. Pago con 0.5 de diferencia por redondeo.
      await expect(
        service.crear({ ...dtoBase, pagos: [{ metodo: "EFECTIVO", monto: 232_000.5 }] }, ctx),
      ).resolves.toBeDefined();
    });
  });
});
