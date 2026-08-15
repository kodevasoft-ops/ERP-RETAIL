import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { AbrirCajaDto, CerrarCajaDto, MovimientoCajaDto } from "./dto/caja.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

@Injectable()
export class CajaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async abrir(dto: AbrirCajaDto, ctx: RequestContext) {
    const abierta = await this.prisma.sesionCaja.findFirst({
      where: { cajaId: dto.cajaId, estado: "ABIERTA" },
    });
    if (abierta) {
      throw new ConflictException("Esta caja ya tiene una sesión abierta. Ciérrala antes de abrir una nueva.");
    }

    const sesion = await this.prisma.sesionCaja.create({
      data: {
        cajaId: dto.cajaId,
        usuarioId: ctx.usuarioId,
        montoApertura: dto.montoApertura,
        observacionesApertura: dto.observaciones,
      },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "caja",
      accion: "abrir",
      entidadId: sesion.id,
      despues: sesion,
      resultado: "exito",
    });

    return sesion;
  }

  async registrarMovimiento(sesionId: string, dto: MovimientoCajaDto, ctx: RequestContext) {
    const sesion = await this.prisma.sesionCaja.findFirst({ where: { id: sesionId, estado: "ABIERTA" } });
    if (!sesion) throw new NotFoundException("Sesión de caja no encontrada o ya cerrada.");

    const movimiento = await this.prisma.movimientoCaja.create({
      data: { sesionCajaId: sesionId, tipo: dto.tipo, monto: dto.monto, motivo: dto.motivo, usuarioId: ctx.usuarioId },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "caja",
      accion: dto.tipo === "INGRESO" ? "ingreso" : "retiro",
      entidadId: sesionId,
      despues: movimiento,
      resultado: "exito",
    });

    return movimiento;
  }

  /** Vista en vivo del estado de la caja (para mostrar antes de cerrar). */
  async resumen(sesionId: string) {
    const sesion = await this.prisma.sesionCaja.findFirst({
      where: { id: sesionId },
      include: { movimientos: { orderBy: { createdAt: "desc" } } },
    });
    if (!sesion) throw new NotFoundException("Sesión de caja no encontrada.");

    const montoEsperado = await this.calcularMontoEsperado(sesion.id, Number(sesion.montoApertura));
    return { ...sesion, montoEsperado };
  }

  private async calcularMontoEsperado(sesionId: string, montoApertura: number) {
    const [ventasEfectivo, ingresos, retiros] = await Promise.all([
      this.prisma.pago.aggregate({
        where: { metodo: "EFECTIVO", venta: { cajaId: sesionId, estado: "COMPLETADA" } },
        _sum: { monto: true },
      }),
      this.prisma.movimientoCaja.aggregate({
        where: { sesionCajaId: sesionId, tipo: "INGRESO" },
        _sum: { monto: true },
      }),
      this.prisma.movimientoCaja.aggregate({
        where: { sesionCajaId: sesionId, tipo: "RETIRO" },
        _sum: { monto: true },
      }),
    ]);

    return (
      montoApertura +
      Number(ventasEfectivo._sum.monto ?? 0) +
      Number(ingresos._sum.monto ?? 0) -
      Number(retiros._sum.monto ?? 0)
    );
  }

  async cerrar(sesionId: string, dto: CerrarCajaDto, ctx: RequestContext) {
    const sesion = await this.prisma.sesionCaja.findFirst({ where: { id: sesionId, estado: "ABIERTA" } });
    if (!sesion) throw new NotFoundException("Sesión de caja no encontrada o ya cerrada.");

    const montoCierreSistema = await this.calcularMontoEsperado(sesionId, Number(sesion.montoApertura));
    const diferencia = dto.montoCierreReal - montoCierreSistema;

    const cerrada = await this.prisma.sesionCaja.update({
      where: { id: sesionId },
      data: {
        estado: "CERRADA",
        montoCierreSistema,
        montoCierreReal: dto.montoCierreReal,
        diferencia,
        observacionesCierre: dto.observaciones,
        cerradaAt: new Date(),
      },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "caja",
      accion: "cerrar",
      entidadId: sesionId,
      despues: cerrada,
      resultado: "exito",
    });

    return cerrada;
  }

  async sesionActiva(cajaId: string) {
    return this.prisma.sesionCaja.findFirst({ where: { cajaId, estado: "ABIERTA" } });
  }
}
