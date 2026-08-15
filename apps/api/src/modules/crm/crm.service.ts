import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { EstadoLead, Prisma } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { NotificacionesService } from "../notificaciones/notificaciones.service";
import { CreateLeadDto, CreateSeguimientoDto, MoverLeadDto, UpdateLeadDto } from "./dto/lead.dto";
import { buildPaginatedResponse } from "../../common/dto/pagination.dto";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
  ip?: string;
  userAgent?: string;
  correlationId?: string;
}

const ESTADOS_ORDEN: EstadoLead[] = [
  "NUEVO",
  "CONTACTADO",
  "INTERESADO",
  "COTIZACION_ENVIADA",
  "NEGOCIACION",
  "APARTADO",
  "GANADO",
  "PERDIDO",
  "NO_INTERESADO",
];

@Injectable()
export class CrmService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly notificaciones: NotificacionesService,
  ) {}

  async crear(dto: CreateLeadDto, ctx: RequestContext) {
    // Nuevo lead entra siempre al final de la columna NUEVO.
    const ultimo = await this.prisma.lead.findFirst({
      where: { empresaId: ctx.empresaId, estado: "NUEVO", deletedAt: null },
      orderBy: { orden: "desc" },
    });

    const lead = await this.prisma.lead.create({
      data: {
        empresaId: ctx.empresaId,
        nombre: dto.nombre,
        telefono: dto.telefono,
        whatsapp: dto.whatsapp,
        correo: dto.correo,
        ciudad: dto.ciudad,
        fuente: dto.fuente,
        vendedorId: dto.vendedorId,
        observaciones: dto.observaciones,
        proximoContacto: dto.proximoContacto ? new Date(dto.proximoContacto) : undefined,
        orden: (ultimo?.orden ?? -1) + 1,
      },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
      modulo: "crm",
      accion: "crear",
      entidadId: lead.id,
      despues: lead,
      resultado: "exito",
    });

    if (lead.vendedorId) {
      await this.notificaciones.crear({
        empresaId: ctx.empresaId,
        usuarioId: lead.vendedorId,
        tipo: "SEGUIMIENTO_CRM",
        titulo: "Nuevo lead asignado",
        mensaje: `Se te asignó el lead "${lead.nombre}".`,
        entidadTipo: "lead",
        entidadId: lead.id,
      });
    }

    return lead;
  }

  /** Vista Kanban: todos los leads activos agrupados por columna, ordenados. */
  async kanban(ctx: RequestContext, vendedorId?: string) {
    const leads = await this.prisma.lead.findMany({
      where: {
        empresaId: ctx.empresaId,
        deletedAt: null,
        ...(vendedorId && { vendedorId }),
      },
      orderBy: [{ estado: "asc" }, { orden: "asc" }],
    });

    const columnas = Object.fromEntries(ESTADOS_ORDEN.map((estado) => [estado, [] as typeof leads]));
    for (const lead of leads) columnas[lead.estado].push(lead);

    return columnas;
  }

  async listar(query: PaginationQueryDto & { estado?: EstadoLead; vendedorId?: string }, ctx: RequestContext) {
    const where: Prisma.LeadWhereInput = {
      empresaId: ctx.empresaId,
      deletedAt: null,
      ...(query.estado && { estado: query.estado }),
      ...(query.vendedorId && { vendedorId: query.vendedorId }),
      ...(query.search && {
        OR: [
          { nombre: { contains: query.search, mode: "insensitive" } },
          { telefono: { contains: query.search, mode: "insensitive" } },
          { correo: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const [total, data] = await Promise.all([
      this.prisma.lead.count({ where }),
      this.prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.skip,
        take: query.limit,
      }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async obtenerPorId(id: string, ctx: RequestContext) {
    const lead = await this.prisma.lead.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
      include: { seguimientos: { orderBy: { createdAt: "desc" } } },
    });
    if (!lead) throw new NotFoundException("Lead no encontrado.");
    return lead;
  }

  async actualizar(id: string, dto: UpdateLeadDto, ctx: RequestContext) {
    const actual = await this.prisma.lead.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!actual) throw new NotFoundException("Lead no encontrado.");
    if (actual.version !== dto.version) {
      throw new ConflictException("Este lead fue modificado por otro usuario. Recarga e intenta de nuevo.");
    }

    const { version, proximoContacto, ...cambios } = dto;

    const actualizado = await this.prisma.lead.update({
      where: { id, version: actual.version },
      data: {
        ...cambios,
        ...(proximoContacto && { proximoContacto: new Date(proximoContacto) }),
        version: { increment: 1 },
      },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "crm",
      accion: "editar",
      entidadId: id,
      antes: actual,
      despues: actualizado,
      resultado: "exito",
    });

    return actualizado;
  }

  /**
   * Mover lead entre columnas del Kanban (drag & drop). Reordena por
   * transacción: hace espacio en la columna destino desplazando los leads
   * con `orden >= nuevoOrden` una posición hacia abajo.
   */
  async mover(id: string, dto: MoverLeadDto, ctx: RequestContext) {
    return this.prisma.$transaction(async (tx) => {
      const actual = await tx.lead.findFirst({ where: { id, empresaId: ctx.empresaId, deletedAt: null } });
      if (!actual) throw new NotFoundException("Lead no encontrado.");
      if (actual.version !== dto.version) {
        throw new ConflictException("Este lead fue modificado por otro usuario. Recarga e intenta de nuevo.");
      }

      if (dto.estado === "PERDIDO" && !dto.motivoPerdida) {
        throw new ConflictException("Debes indicar el motivo de pérdida.");
      }

      await tx.lead.updateMany({
        where: {
          empresaId: ctx.empresaId,
          estado: dto.estado,
          orden: { gte: dto.orden },
          id: { not: id },
        },
        data: { orden: { increment: 1 } },
      });

      const movido = await tx.lead.update({
        where: { id, version: actual.version },
        data: {
          estado: dto.estado,
          orden: dto.orden,
          motivoPerdida: dto.estado === "PERDIDO" ? dto.motivoPerdida : null,
          version: { increment: 1 },
        },
      });

      await this.audit.registrar({
        empresaId: ctx.empresaId,
        usuarioId: ctx.usuarioId,
        modulo: "crm",
        accion: "mover-estado",
        entidadId: id,
        antes: { estado: actual.estado, orden: actual.orden },
        despues: { estado: movido.estado, orden: movido.orden },
        resultado: "exito",
      });

      return movido;
    });
  }

  async agregarSeguimiento(leadId: string, dto: CreateSeguimientoDto, ctx: RequestContext) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!lead) throw new NotFoundException("Lead no encontrado.");

    const [seguimiento] = await this.prisma.$transaction([
      this.prisma.leadSeguimiento.create({
        data: { leadId, tipo: dto.tipo, notas: dto.notas, usuarioId: ctx.usuarioId },
      }),
      this.prisma.lead.update({
        where: { id: leadId },
        data: {
          ...(dto.proximoContacto && { proximoContacto: new Date(dto.proximoContacto) }),
        },
      }),
    ]);

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "crm",
      accion: "seguimiento",
      entidadId: leadId,
      despues: seguimiento,
      resultado: "exito",
    });

    return seguimiento;
  }

  async eliminar(id: string, ctx: RequestContext) {
    const actual = await this.prisma.lead.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!actual) throw new NotFoundException("Lead no encontrado.");

    await this.prisma.lead.update({ where: { id }, data: { deletedAt: new Date() } });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      modulo: "crm",
      accion: "eliminar",
      entidadId: id,
      antes: actual,
      resultado: "exito",
    });

    return { success: true };
  }
}
