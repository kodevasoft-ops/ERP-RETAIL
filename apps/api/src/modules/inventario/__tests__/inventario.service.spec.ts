import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { InventarioService } from "../inventario.service";
import { AuditService } from "../../../common/services/audit.service";
import { createPrismaMock } from "../../../common/testing/prisma-mock";

describe("InventarioService", () => {
  let service: InventarioService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let audit: jest.Mocked<AuditService>;

  const ctx = { empresaId: "empresa-1", usuarioId: "user-1", permisos: [] as string[] };

  beforeEach(() => {
    prisma = createPrismaMock();
    audit = { registrar: jest.fn() } as never;
    service = new InventarioService(prisma, audit);
  });

  function mockVariante(stock: number) {
    (prisma.$queryRaw as jest.Mock).mockResolvedValueOnce([
      { id: "variante-1", stock, costo_compra: "50000", costo_promedio: "50000", sucursal_id: "sucursal-1" },
    ]);
  }

  describe("salida", () => {
    it("rechaza la salida si dejaría el stock en negativo sin el permiso de aprobación", async () => {
      mockVariante(3);

      await expect(
        service.salida(
          { varianteId: "variante-1", cantidad: 5, origen: "AJUSTE_MANUAL" },
          ctx,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.variante.update).not.toHaveBeenCalled();
    });

    it("permite stock negativo si permitirNegativo=true Y el usuario tiene el permiso inventario:aprobar", async () => {
      mockVariante(3);
      (prisma.variante.update as jest.Mock).mockResolvedValueOnce({});
      (prisma.movimientoInventario.create as jest.Mock).mockResolvedValueOnce({ id: "mov-1" });

      const ctxConPermiso = { ...ctx, permisos: ["inventario:aprobar"] };

      await expect(
        service.salida(
          { varianteId: "variante-1", cantidad: 5, origen: "AJUSTE_MANUAL", permitirNegativo: true },
          ctxConPermiso,
        ),
      ).resolves.toBeDefined();
    });

    it("ignora permitirNegativo si el usuario NO tiene el permiso de aprobación (nunca confía en el front)", async () => {
      mockVariante(3);

      // permitirNegativo=true en el body, pero sin el permiso -> debe rechazar igual.
      await expect(
        service.salida(
          { varianteId: "variante-1", cantidad: 5, origen: "AJUSTE_MANUAL", permitirNegativo: true },
          ctx, // ctx sin permisos
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("entrada", () => {
    it("recalcula el costo promedio ponderado correctamente al mezclar stock existente con nueva entrada", async () => {
      // 10 unidades a costo 50000 + 10 unidades nuevas a costo 70000
      // promedio esperado = (10*50000 + 10*70000) / 20 = 60000
      mockVariante(10);
      let dataActualizada: any;
      (prisma.variante.update as jest.Mock).mockImplementationOnce((args: any) => {
        dataActualizada = args.data;
        return {};
      });
      (prisma.movimientoInventario.create as jest.Mock).mockResolvedValueOnce({});

      await service.entrada(
        { varianteId: "variante-1", cantidad: 10, costoUnitario: 70_000, origen: "COMPRA" },
        ctx,
      );

      expect(dataActualizada.costoPromedio).toBeCloseTo(60_000);
      expect(dataActualizada.stock).toBe(20);
    });
  });

  describe("ajuste", () => {
    it("requiere el permiso inventario:aprobar para cualquier ajuste manual", async () => {
      await expect(
        service.ajuste({ varianteId: "variante-1", cantidad: -5, motivo: "Conteo físico" }, ctx),
      ).rejects.toThrow(ForbiddenException);
    });

    it("rechaza un ajuste que resultaría en stock negativo, incluso con permiso", async () => {
      mockVariante(3);
      const ctxConPermiso = { ...ctx, permisos: ["inventario:aprobar"] };

      await expect(
        service.ajuste({ varianteId: "variante-1", cantidad: -10, motivo: "Conteo físico" }, ctxConPermiso),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
