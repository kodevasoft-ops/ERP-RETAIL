import { Injectable } from "@nestjs/common";
import { TipoNotificacion } from "database";
import { PrismaService } from "../../database/prisma.service";

interface CrearNotificacion {
  empresaId: string;
  usuarioId?: string;
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  entidadTipo?: string;
  entidadId?: string;
}

@Injectable()
export class NotificacionesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Crea una notificación. Nunca debe romper el flujo que la origina. */
  async crear(data: CrearNotificacion) {
    try {
      return await this.prisma.notificacion.create({ data });
    } catch {
      return null;
    }
  }

  async listar(empresaId: string, usuarioId: string, soloNoLeidas = false) {
    return this.prisma.notificacion.findMany({
      where: {
        empresaId,
        OR: [{ usuarioId }, { usuarioId: null }],
        ...(soloNoLeidas && { leida: false }),
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  }

  async contarNoLeidas(empresaId: string, usuarioId: string) {
    return this.prisma.notificacion.count({
      where: { empresaId, OR: [{ usuarioId }, { usuarioId: null }], leida: false },
    });
  }

  async marcarLeida(id: string, empresaId: string) {
    await this.prisma.notificacion.updateMany({ where: { id, empresaId }, data: { leida: true } });
    return { success: true };
  }

  async marcarTodasLeidas(empresaId: string, usuarioId: string) {
    await this.prisma.notificacion.updateMany({
      where: { empresaId, OR: [{ usuarioId }, { usuarioId: null }], leida: false },
      data: { leida: true },
    });
    return { success: true };
  }
}
