import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { CreateClienteDto } from "./dto/create-cliente.dto";
import { UpdateClienteDto } from "./dto/update-cliente.dto";
import { QueryClientesDto } from "./dto/query-clientes.dto";
import { buildPaginatedResponse, PaginatedResponse } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
  ip?: string;
  userAgent?: string;
  correlationId?: string;
}

@Injectable()
export class ClientesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async crear(dto: CreateClienteDto, ctx: RequestContext) {
    const existente = await this.prisma.cliente.findFirst({
      where: {
        empresaId: ctx.empresaId,
        tipoDocumento: dto.tipoDocumento,
        numeroDocumento: dto.numeroDocumento,
        deletedAt: null,
      },
    });
    if (existente) {
      throw new ConflictException("Ya existe un cliente registrado con ese documento.");
    }

    const cliente = await this.prisma.cliente.create({
      data: {
        empresaId: ctx.empresaId,
        tipoDocumento: dto.tipoDocumento,
        numeroDocumento: dto.numeroDocumento,
        nombre: dto.nombre,
        apellido: dto.apellido,
        email: dto.email,
        telefono: dto.telefono,
        whatsapp: dto.whatsapp,
        direccion: dto.direccion,
        ciudad: dto.ciudad,
        fechaNacimiento: dto.fechaNacimiento ? new Date(dto.fechaNacimiento) : undefined,
        etiquetas: dto.etiquetas ?? ["NUEVO"],
        notas: dto.notas,
      },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
      modulo: "clientes",
      accion: "crear",
      entidadId: cliente.id,
      despues: cliente,
      resultado: "exito",
    });

    return cliente;
  }

  async listar(query: QueryClientesDto, ctx: RequestContext): Promise<PaginatedResponse<unknown>> {
    const where: Prisma.ClienteWhereInput = {
      empresaId: ctx.empresaId,
      deletedAt: null,
      ...(query.etiquetas?.length && { etiquetas: { hasSome: query.etiquetas } }),
      ...(query.search && {
        OR: [
          { nombre: { contains: query.search, mode: "insensitive" } },
          { apellido: { contains: query.search, mode: "insensitive" } },
          { numeroDocumento: { contains: query.search, mode: "insensitive" } },
          { telefono: { contains: query.search, mode: "insensitive" } },
          { email: { contains: query.search, mode: "insensitive" } },
        ],
      }),
    };

    const sortableFields = new Set(["nombre", "createdAt", "puntosFidelizacion"]);
    const orderBy: Prisma.ClienteOrderByWithRelationInput =
      query.sortBy && sortableFields.has(query.sortBy)
        ? { [query.sortBy]: query.sortOrder ?? "desc" }
        : { createdAt: "desc" };

    const [total, data] = await Promise.all([
      this.prisma.cliente.count({ where }),
      this.prisma.cliente.findMany({ where, orderBy, skip: query.skip, take: query.limit }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async obtenerPorId(id: string, ctx: RequestContext) {
    const cliente = await this.prisma.cliente.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
      include: { documentos: true },
    });
    if (!cliente) throw new NotFoundException("Cliente no encontrado.");
    return cliente;
  }

  async actualizar(id: string, dto: UpdateClienteDto, ctx: RequestContext) {
    const actual = await this.prisma.cliente.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!actual) throw new NotFoundException("Cliente no encontrado.");

    if (actual.version !== dto.version) {
      throw new ConflictException(
        "Este cliente fue modificado por otro usuario. Recarga los datos e intenta de nuevo.",
      );
    }

    const { version, fechaNacimiento, ...cambios } = dto;

    const actualizado = await this.prisma.cliente.update({
      where: { id, version: actual.version },
      data: {
        ...cambios,
        ...(fechaNacimiento && { fechaNacimiento: new Date(fechaNacimiento) }),
        version: { increment: 1 },
      },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
      modulo: "clientes",
      accion: "editar",
      entidadId: id,
      antes: actual,
      despues: actualizado,
      resultado: "exito",
    });

    return actualizado;
  }

  async eliminar(id: string, ctx: RequestContext) {
    const actual = await this.prisma.cliente.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!actual) throw new NotFoundException("Cliente no encontrado.");

    await this.prisma.cliente.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
      modulo: "clientes",
      accion: "eliminar",
      entidadId: id,
      antes: actual,
      resultado: "exito",
    });

    return { success: true };
  }
}
