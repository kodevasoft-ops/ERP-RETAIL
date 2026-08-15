import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma, TipoMovimiento, OrigenMovimiento } from "database";
import { randomUUID } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import {
  AjusteInventarioDto,
  EntradaInventarioDto,
  SalidaInventarioDto,
  TransferenciaInventarioDto,
} from "./dto/movimientos.dto";
import { QueryKardexDto } from "./dto/query-kardex.dto";
import { buildPaginatedResponse } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
  ip?: string;
  userAgent?: string;
  correlationId?: string;
  permisos: string[];
}

interface VarianteRow {
  id: string;
  stock: number;
  costo_compra: string;
  costo_promedio: string;
  producto_id: string;
  sucursal_id: string;
  talla: string;
  color: string;
}

@Injectable()
export class InventarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Lockea la fila de la variante con SELECT ... FOR UPDATE dentro de la
   * transacción activa. Evita que dos requests concurrentes (ej. dos ventas
   * simultáneas del último ítem en stock) lean el mismo stock "viejo" y
   * ambas lo den por disponible (race condition clásica de inventario).
   */
  private async lockVariante(tx: Prisma.TransactionClient, varianteId: string, empresaId: string) {
    const rows = await tx.$queryRaw<VarianteRow[]>`
      SELECT v.id, v.stock, v.costo_compra, v.costo_promedio, v.producto_id,
             v.sucursal_id, v.talla, v.color
      FROM variantes v
      INNER JOIN productos p ON p.id = v.producto_id
      WHERE v.id = ${varianteId} AND p.empresa_id = ${empresaId} AND v.deleted_at IS NULL
      FOR UPDATE
    `;
    if (rows.length === 0) throw new NotFoundException("Variante no encontrada.");
    return rows[0];
  }

  async entrada(dto: EntradaInventarioDto, ctx: RequestContext) {
    return this.prisma.$transaction(async (tx) => {
      const variante = await this.lockVariante(tx, dto.varianteId, ctx.empresaId);
      const stockAnterior = variante.stock;
      const stockNuevo = stockAnterior + dto.cantidad;

      // Costeo promedio ponderado: recalcula el costo promedio del inventario
      // al mezclar el costo existente con el costo de la nueva entrada.
      const costoUnitario = dto.costoUnitario ?? Number(variante.costo_compra);
      const costoPromedioNuevo =
        stockAnterior > 0
          ? (stockAnterior * Number(variante.costo_promedio) + dto.cantidad * costoUnitario) / stockNuevo
          : costoUnitario;

      await tx.variante.update({
        where: { id: dto.varianteId },
        data: { stock: stockNuevo, costoPromedio: costoPromedioNuevo, costoCompra: costoUnitario },
      });

      const movimiento = await tx.movimientoInventario.create({
        data: {
          empresaId: ctx.empresaId,
          varianteId: dto.varianteId,
          sucursalId: variante.sucursal_id,
          tipo: TipoMovimiento.ENTRADA,
          origen: dto.origen,
          cantidad: dto.cantidad,
          stockAnterior,
          stockNuevo,
          costoUnitario,
          motivo: dto.motivo,
          referenciaTipo: dto.referenciaTipo,
          referenciaId: dto.referenciaId,
          usuarioId: ctx.usuarioId,
        },
      });

      await this.audit.registrar({
        empresaId: ctx.empresaId,
        usuarioId: ctx.usuarioId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        correlationId: ctx.correlationId,
        modulo: "inventario",
        accion: "entrada",
        entidadId: dto.varianteId,
        despues: movimiento,
        resultado: "exito",
      });

      return movimiento;
    });
  }

  async salida(dto: SalidaInventarioDto, ctx: RequestContext) {
    const permitirNegativo = dto.permitirNegativo && ctx.permisos.includes("inventario:aprobar");

    return this.prisma.$transaction(async (tx) => {
      const variante = await this.lockVariante(tx, dto.varianteId, ctx.empresaId);
      const stockAnterior = variante.stock;
      const stockNuevo = stockAnterior - dto.cantidad;

      if (stockNuevo < 0 && !permitirNegativo) {
        throw new BadRequestException(
          `Stock insuficiente. Disponible: ${stockAnterior}, solicitado: ${dto.cantidad}.`,
        );
      }

      await tx.variante.update({ where: { id: dto.varianteId }, data: { stock: stockNuevo } });

      const movimiento = await tx.movimientoInventario.create({
        data: {
          empresaId: ctx.empresaId,
          varianteId: dto.varianteId,
          sucursalId: variante.sucursal_id,
          tipo: TipoMovimiento.SALIDA,
          origen: dto.origen,
          cantidad: dto.cantidad,
          stockAnterior,
          stockNuevo,
          motivo: dto.motivo,
          referenciaTipo: dto.referenciaTipo,
          referenciaId: dto.referenciaId,
          usuarioId: ctx.usuarioId,
        },
      });

      await this.audit.registrar({
        empresaId: ctx.empresaId,
        usuarioId: ctx.usuarioId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        correlationId: ctx.correlationId,
        modulo: "inventario",
        accion: "salida",
        entidadId: dto.varianteId,
        despues: movimiento,
        resultado: "exito",
      });

      return movimiento;
    });
  }

  /**
   * Transferencia entre sucursales: la variante origen se decrementa y se
   * localiza (o crea) la variante equivalente (mismo producto/talla/color)
   * en la sucursal destino, incrementándola. Ambos movimientos comparten
   * `referenciaId` para poder reconstruir la operación completa en el kardex.
   */
  async transferencia(dto: TransferenciaInventarioDto, ctx: RequestContext) {
    return this.prisma.$transaction(async (tx) => {
      const origen = await this.lockVariante(tx, dto.varianteId, ctx.empresaId);

      if (origen.sucursal_id === dto.sucursalDestinoId) {
        throw new BadRequestException("La sucursal destino debe ser diferente a la de origen.");
      }
      if (origen.stock < dto.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para transferir. Disponible: ${origen.stock}.`,
        );
      }

      const referenciaId = randomUUID();

      // Salida en origen
      const stockAnteriorOrigen = origen.stock;
      const stockNuevoOrigen = stockAnteriorOrigen - dto.cantidad;
      await tx.variante.update({ where: { id: origen.id }, data: { stock: stockNuevoOrigen } });
      const movOrigen = await tx.movimientoInventario.create({
        data: {
          empresaId: ctx.empresaId,
          varianteId: origen.id,
          sucursalId: origen.sucursal_id,
          sucursalDestinoId: dto.sucursalDestinoId,
          tipo: TipoMovimiento.TRANSFERENCIA_SALIDA,
          origen: OrigenMovimiento.TRANSFERENCIA,
          cantidad: dto.cantidad,
          stockAnterior: stockAnteriorOrigen,
          stockNuevo: stockNuevoOrigen,
          motivo: dto.motivo,
          referenciaTipo: "transferencia",
          referenciaId,
          usuarioId: ctx.usuarioId,
        },
      });

      // Buscar o crear variante equivalente en destino
      let destino = await tx.variante.findFirst({
        where: {
          productoId: origen.producto_id,
          sucursalId: dto.sucursalDestinoId,
          talla: origen.talla,
          color: origen.color,
          deletedAt: null,
        },
      });

      if (!destino) {
        const original = await tx.variante.findUniqueOrThrow({ where: { id: origen.id } });
        destino = await tx.variante.create({
          data: {
            productoId: origen.producto_id,
            sucursalId: dto.sucursalDestinoId,
            talla: origen.talla,
            color: origen.color,
            sku: `${original.sku}-${dto.sucursalDestinoId.slice(0, 4)}`,
            stock: 0,
            stockMinimo: original.stockMinimo,
            costoCompra: original.costoCompra,
            costoPromedio: original.costoPromedio,
            precioVenta: original.precioVenta,
            precioMayorista: original.precioMayorista,
            precioVip: original.precioVip,
            iva: original.iva,
            descuentoMax: original.descuentoMax,
          },
        });
      }

      const stockAnteriorDestino = destino.stock;
      const stockNuevoDestino = stockAnteriorDestino + dto.cantidad;
      await tx.variante.update({ where: { id: destino.id }, data: { stock: stockNuevoDestino } });
      const movDestino = await tx.movimientoInventario.create({
        data: {
          empresaId: ctx.empresaId,
          varianteId: destino.id,
          sucursalId: dto.sucursalDestinoId,
          tipo: TipoMovimiento.TRANSFERENCIA_ENTRADA,
          origen: OrigenMovimiento.TRANSFERENCIA,
          cantidad: dto.cantidad,
          stockAnterior: stockAnteriorDestino,
          stockNuevo: stockNuevoDestino,
          motivo: dto.motivo,
          referenciaTipo: "transferencia",
          referenciaId,
          usuarioId: ctx.usuarioId,
        },
      });

      await this.audit.registrar({
        empresaId: ctx.empresaId,
        usuarioId: ctx.usuarioId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        correlationId: ctx.correlationId,
        modulo: "inventario",
        accion: "transferencia",
        entidadId: referenciaId,
        despues: { movOrigen, movDestino },
        resultado: "exito",
      });

      return { movOrigen, movDestino };
    });
  }

  async ajuste(dto: AjusteInventarioDto, ctx: RequestContext) {
    if (!ctx.permisos.includes("inventario:aprobar")) {
      throw new ForbiddenException("Requiere permiso de aprobación para ajustar inventario.");
    }

    return this.prisma.$transaction(async (tx) => {
      const variante = await this.lockVariante(tx, dto.varianteId, ctx.empresaId);
      const stockAnterior = variante.stock;
      const stockNuevo = stockAnterior + dto.cantidad;

      if (stockNuevo < 0) {
        throw new BadRequestException("El ajuste resultaría en stock negativo.");
      }

      await tx.variante.update({ where: { id: dto.varianteId }, data: { stock: stockNuevo } });

      const movimiento = await tx.movimientoInventario.create({
        data: {
          empresaId: ctx.empresaId,
          varianteId: dto.varianteId,
          sucursalId: variante.sucursal_id,
          tipo: dto.cantidad >= 0 ? TipoMovimiento.AJUSTE_POSITIVO : TipoMovimiento.AJUSTE_NEGATIVO,
          origen: OrigenMovimiento.AJUSTE_MANUAL,
          cantidad: Math.abs(dto.cantidad),
          stockAnterior,
          stockNuevo,
          motivo: dto.motivo,
          usuarioId: ctx.usuarioId,
        },
      });

      await this.audit.registrar({
        empresaId: ctx.empresaId,
        usuarioId: ctx.usuarioId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        correlationId: ctx.correlationId,
        modulo: "inventario",
        accion: "ajuste",
        entidadId: dto.varianteId,
        despues: movimiento,
        resultado: "exito",
      });

      return movimiento;
    });
  }

  async kardex(query: QueryKardexDto, ctx: RequestContext) {
    const where: Prisma.MovimientoInventarioWhereInput = {
      empresaId: ctx.empresaId,
      ...(query.varianteId && { varianteId: query.varianteId }),
      ...(query.sucursalId && { sucursalId: query.sucursalId }),
    };

    const [total, data] = await Promise.all([
      this.prisma.movimientoInventario.count({ where }),
      this.prisma.movimientoInventario.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.limit,
        include: {
          variante: {
            select: { talla: true, color: true, sku: true, producto: { select: { nombre: true } } },
          },
        },
      }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async alertasStockBajo(ctx: RequestContext) {
    return this.prisma.$queryRaw`
      SELECT v.id, v.sku, v.talla, v.color, v.stock, v.stock_minimo,
             p.nombre AS producto_nombre, v.sucursal_id
      FROM variantes v
      INNER JOIN productos p ON p.id = v.producto_id
      WHERE p.empresa_id = ${ctx.empresaId}
        AND v.deleted_at IS NULL
        AND v.stock <= v.stock_minimo
      ORDER BY v.stock ASC
      LIMIT 100
    `;
  }
}
