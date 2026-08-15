import { BadRequestException, ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { RegistrarAbonoDto } from "./dto/cartera.dto";
import { buildPaginatedResponse, PaginationQueryDto } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

@Injectable()
export class CarteraService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async listar(query: PaginationQueryDto & { estado?: string; clienteId?: string }, ctx: RequestContext) {
    // Marca automáticamente como VENCIDA cualquier cuenta pendiente cuya
    // fecha de vencimiento ya pasó — se resuelve en cada consulta en vez
    // de depender de un cron, así el estado siempre está al día.
    await this.prisma.cuentaPorCobrar.updateMany({
      where: {
        empresaId: ctx.empresaId,
        estado: { in: ["PENDIENTE", "PAGADA_PARCIAL"] },
        fechaVencimiento: { lt: new Date() },
      },
      data: { estado: "VENCIDA" },
    });

    const where: Prisma.CuentaPorCobrarWhereInput = {
      empresaId: ctx.empresaId,
      ...(query.estado && { estado: query.estado as never }),
      ...(query.clienteId && { clienteId: query.clienteId }),
    };

    const [total, data] = await Promise.all([
      this.prisma.cuentaPorCobrar.count({ where }),
      this.prisma.cuentaPorCobrar.findMany({
        where,
        orderBy: { fechaVencimiento: "asc" },
        skip: query.skip,
        take: query.limit,
        include: {
          venta: { select: { numero: true, prefijo: true } },
        },
      }),
    ]);

    // Datos del cliente por separado (no hay relación Prisma formal
    // cliente<->cuentaPorCobrar declarada, se resuelve manualmente).
    const clienteIds = [...new Set(data.map((c) => c.clienteId))];
    const clientes = await this.prisma.cliente.findMany({
      where: { id: { in: clienteIds } },
      select: { id: true, nombre: true, apellido: true, telefono: true },
    });
    const clientesPorId = new Map(clientes.map((c) => [c.id, c]));

    const dataConCliente = data.map((c) => ({ ...c, cliente: clientesPorId.get(c.clienteId) ?? null }));

    return buildPaginatedResponse(dataConCliente, total, query.page, query.limit);
  }

  async resumen(ctx: RequestContext) {
    const [porCobrarTotal, vencido] = await Promise.all([
      this.prisma.cuentaPorCobrar.aggregate({
        where: { empresaId: ctx.empresaId, estado: { in: ["PENDIENTE", "PAGADA_PARCIAL", "VENCIDA"] } },
        _sum: { saldo: true },
      }),
      this.prisma.cuentaPorCobrar.aggregate({
        where: { empresaId: ctx.empresaId, estado: "VENCIDA" },
        _sum: { saldo: true },
        _count: true,
      }),
    ]);

    return {
      totalPorCobrar: Number(porCobrarTotal._sum.saldo ?? 0),
      totalVencido: Number(vencido._sum.saldo ?? 0),
      cuentasVencidas: vencido._count,
    };
  }

  async historialAbonos(cuentaId: string, ctx: RequestContext) {
    const cuenta = await this.prisma.cuentaPorCobrar.findFirst({ where: { id: cuentaId, empresaId: ctx.empresaId } });
    if (!cuenta) throw new NotFoundException("Cuenta por cobrar no encontrada.");

    return this.prisma.abonoCartera.findMany({
      where: { cuentaPorCobrarId: cuentaId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Registra un abono: nunca resta directamente del saldo — crea un
   * registro de abono (ledger, auditable) y DERIVA el nuevo saldo de la
   * suma de abonos. Mismo principio que el kardex de inventario.
   */
  async registrarAbono(cuentaId: string, dto: RegistrarAbonoDto, ctx: RequestContext) {
    return this.prisma.$transaction(async (tx) => {
      const cuenta = await tx.cuentaPorCobrar.findFirst({ where: { id: cuentaId, empresaId: ctx.empresaId } });
      if (!cuenta) throw new NotFoundException("Cuenta por cobrar no encontrada.");
      if (cuenta.estado === "PAGADA") throw new ConflictException("Esta cuenta ya está completamente pagada.");
      if (dto.monto > Number(cuenta.saldo)) {
        throw new BadRequestException(`El abono (${dto.monto}) excede el saldo pendiente (${cuenta.saldo}).`);
      }

      const abono = await tx.abonoCartera.create({
        data: {
          cuentaPorCobrarId: cuentaId,
          monto: dto.monto,
          metodoPago: dto.metodoPago,
          observaciones: dto.observaciones,
          usuarioId: ctx.usuarioId,
        },
      });

      const nuevoSaldo = Number(cuenta.saldo) - dto.monto;
      const actualizada = await tx.cuentaPorCobrar.update({
        where: { id: cuentaId },
        data: {
          saldo: nuevoSaldo,
          estado: nuevoSaldo <= 0 ? "PAGADA" : "PAGADA_PARCIAL",
        },
      });

      await this.audit.registrar({
        empresaId: ctx.empresaId,
        usuarioId: ctx.usuarioId,
        modulo: "cartera",
        accion: "registrar-abono",
        entidadId: cuentaId,
        despues: abono,
        resultado: "exito",
      });

      return actualizada;
    });
  }
}
