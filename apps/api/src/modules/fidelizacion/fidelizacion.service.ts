import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import { AcumularPuntosDto, RedimirPuntosDto } from "./dto/fidelizacion.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
}

@Injectable()
export class FidelizacionService {
  constructor(private readonly prisma: PrismaService) {}

  async historial(clienteId: string, ctx: RequestContext) {
    const cliente = await this.prisma.cliente.findFirst({ where: { id: clienteId, empresaId: ctx.empresaId } });
    if (!cliente) throw new NotFoundException("Cliente no encontrado.");

    const movimientos = await this.prisma.movimientoPuntos.findMany({
      where: { clienteId, empresaId: ctx.empresaId },
      orderBy: { createdAt: "desc" },
    });

    return { saldoActual: cliente.puntosFidelizacion, movimientos };
  }

  async acumular(clienteId: string, dto: AcumularPuntosDto, ctx: RequestContext) {
    return this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.findFirst({ where: { id: clienteId, empresaId: ctx.empresaId } });
      if (!cliente) throw new NotFoundException("Cliente no encontrado.");

      await tx.cliente.update({ where: { id: clienteId }, data: { puntosFidelizacion: { increment: dto.puntos } } });

      return tx.movimientoPuntos.create({
        data: {
          empresaId: ctx.empresaId,
          clienteId,
          tipo: "ACUMULACION",
          puntos: dto.puntos,
          motivo: dto.motivo,
          ventaId: dto.ventaId,
          usuarioId: ctx.usuarioId,
        },
      });
    });
  }

  async redimir(clienteId: string, dto: RedimirPuntosDto, ctx: RequestContext) {
    return this.prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.findFirst({ where: { id: clienteId, empresaId: ctx.empresaId } });
      if (!cliente) throw new NotFoundException("Cliente no encontrado.");
      if (cliente.puntosFidelizacion < dto.puntos) {
        throw new BadRequestException(
          `Puntos insuficientes. Disponibles: ${cliente.puntosFidelizacion}, solicitados: ${dto.puntos}.`,
        );
      }

      await tx.cliente.update({ where: { id: clienteId }, data: { puntosFidelizacion: { decrement: dto.puntos } } });

      return tx.movimientoPuntos.create({
        data: {
          empresaId: ctx.empresaId,
          clienteId,
          tipo: "REDENCION",
          puntos: -dto.puntos,
          motivo: dto.motivo,
          usuarioId: ctx.usuarioId,
        },
      });
    });
  }
}
