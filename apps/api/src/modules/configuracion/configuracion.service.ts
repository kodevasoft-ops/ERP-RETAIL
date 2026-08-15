import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";
import {
  CreateCategoriaDto,
  CreateMarcaDto,
  CreateSucursalDto,
  CreateTransportadoraDto,
  UpdateEmpresaDto,
  UpdateSucursalDto,
} from "./dto/configuracion.dto";

interface RequestContext {
  empresaId: string;
}

@Injectable()
export class ConfiguracionService {
  constructor(private readonly prisma: PrismaService) {}

  // ---- Empresa ----
  empresa(ctx: RequestContext) {
    return this.prisma.empresa.findUniqueOrThrow({ where: { id: ctx.empresaId } });
  }

  actualizarEmpresa(dto: UpdateEmpresaDto, ctx: RequestContext) {
    return this.prisma.empresa.update({ where: { id: ctx.empresaId }, data: dto });
  }

  // ---- Sucursales ----
  sucursales(ctx: RequestContext) {
    return this.prisma.sucursal.findMany({ where: { empresaId: ctx.empresaId, deletedAt: null }, orderBy: { nombre: "asc" } });
  }

  async crearSucursal(dto: CreateSucursalDto, ctx: RequestContext) {
    const existente = await this.prisma.sucursal.findFirst({
      where: { empresaId: ctx.empresaId, codigo: dto.codigo, deletedAt: null },
    });
    if (existente) throw new ConflictException("Ya existe una sucursal con ese código.");
    return this.prisma.sucursal.create({ data: { empresaId: ctx.empresaId, ...dto } });
  }

  async actualizarSucursal(id: string, dto: UpdateSucursalDto, ctx: RequestContext) {
    const actual = await this.prisma.sucursal.findFirst({ where: { id, empresaId: ctx.empresaId, deletedAt: null } });
    if (!actual) throw new NotFoundException("Sucursal no encontrada.");
    return this.prisma.sucursal.update({ where: { id }, data: dto });
  }

  // ---- Categorías ----
  categorias(ctx: RequestContext) {
    return this.prisma.categoria.findMany({ where: { empresaId: ctx.empresaId, deletedAt: null }, orderBy: { nombre: "asc" } });
  }

  async crearCategoria(dto: CreateCategoriaDto, ctx: RequestContext) {
    const existente = await this.prisma.categoria.findFirst({
      where: { empresaId: ctx.empresaId, nombre: dto.nombre, padreId: dto.padreId ?? null, deletedAt: null },
    });
    if (existente) throw new ConflictException("Ya existe una categoría con ese nombre en este nivel.");
    return this.prisma.categoria.create({ data: { empresaId: ctx.empresaId, ...dto } });
  }

  async eliminarCategoria(id: string, ctx: RequestContext) {
    const categoria = await this.prisma.categoria.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
      include: { _count: { select: { productos: true, subcategorias: true } } },
    });
    if (!categoria) throw new NotFoundException("Categoría no encontrada.");
    if (categoria._count.productos > 0 || categoria._count.subcategorias > 0) {
      throw new ConflictException("No se puede eliminar: tiene productos o subcategorías asociadas.");
    }
    await this.prisma.categoria.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // ---- Marcas ----
  marcas(ctx: RequestContext) {
    return this.prisma.marca.findMany({ where: { empresaId: ctx.empresaId, deletedAt: null }, orderBy: { nombre: "asc" } });
  }

  async crearMarca(dto: CreateMarcaDto, ctx: RequestContext) {
    const existente = await this.prisma.marca.findFirst({
      where: { empresaId: ctx.empresaId, nombre: dto.nombre, deletedAt: null },
    });
    if (existente) throw new ConflictException("Ya existe una marca con ese nombre.");
    return this.prisma.marca.create({ data: { empresaId: ctx.empresaId, ...dto } });
  }

  async eliminarMarca(id: string, ctx: RequestContext) {
    const marca = await this.prisma.marca.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
      include: { _count: { select: { productos: true } } },
    });
    if (!marca) throw new NotFoundException("Marca no encontrada.");
    if (marca._count.productos > 0) {
      throw new ConflictException("No se puede eliminar: tiene productos asociados.");
    }
    await this.prisma.marca.update({ where: { id }, data: { deletedAt: new Date() } });
    return { success: true };
  }

  // ---- Transportadoras ----
  transportadoras(ctx: RequestContext) {
    return this.prisma.transportadora.findMany({ where: { empresaId: ctx.empresaId }, orderBy: { nombre: "asc" } });
  }

  async crearTransportadora(dto: CreateTransportadoraDto, ctx: RequestContext) {
    const existente = await this.prisma.transportadora.findFirst({
      where: { empresaId: ctx.empresaId, nombre: dto.nombre },
    });
    if (existente) throw new ConflictException("Ya existe una transportadora con ese nombre.");
    return this.prisma.transportadora.create({ data: { empresaId: ctx.empresaId, ...dto } });
  }
}
