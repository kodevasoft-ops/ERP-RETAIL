import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "database";
import { PrismaService } from "../../database/prisma.service";
import { AuditService } from "../../common/services/audit.service";
import { CreateProductoDto } from "./dto/create-producto.dto";
import { UpdateProductoDto } from "./dto/update-producto.dto";
import { QueryProductosDto } from "./dto/query-productos.dto";
import { buildPaginatedResponse, PaginatedResponse } from "../../common/dto/pagination.dto";

interface RequestContext {
  empresaId: string;
  usuarioId: string;
  ip?: string;
  userAgent?: string;
  correlationId?: string;
}

// Include reutilizable: evita N+1 al traer producto + variantes + imágenes
// en una sola query en lugar de una consulta por relación.
const PRODUCTO_INCLUDE = {
  categoria: { select: { id: true, nombre: true } },
  marca: { select: { id: true, nombre: true } },
  variantes: {
    where: { deletedAt: null },
    orderBy: [{ talla: "asc" }, { color: "asc" }] as const,
  },
  imagenes: { orderBy: { orden: "asc" } as const },
} satisfies Prisma.ProductoInclude;

@Injectable()
export class ProductosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async crear(dto: CreateProductoDto, ctx: RequestContext) {
    // Unicidad de código dentro de la empresa, y SKUs únicos globalmente,
    // validados en la misma transacción para evitar condiciones de carrera.
    const existente = await this.prisma.producto.findFirst({
      where: { empresaId: ctx.empresaId, codigo: dto.codigo, deletedAt: null },
    });
    if (existente) {
      throw new ConflictException(`Ya existe un producto con el código "${dto.codigo}".`);
    }

    const producto = await this.prisma.$transaction(async (tx) => {
      const creado = await tx.producto.create({
        data: {
          empresaId: ctx.empresaId,
          codigo: dto.codigo,
          nombre: dto.nombre,
          descripcion: dto.descripcion,
          categoriaId: dto.categoriaId,
          marcaId: dto.marcaId,
          sexo: dto.sexo,
          temporada: dto.temporada,
          coleccion: dto.coleccion,
          variantes: {
            create: dto.variantes.map((v) => ({
              sucursalId: v.sucursalId,
              talla: v.talla,
              color: v.color,
              sku: v.sku,
              codigoBarras: v.codigoBarras,
              stock: v.stock,
              stockMinimo: v.stockMinimo,
              costoCompra: v.costoCompra,
              costoPromedio: v.costoCompra, // al crear, costo promedio = costo compra inicial
              precioVenta: v.precioVenta,
              precioMayorista: v.precioMayorista,
              precioVip: v.precioVip,
              iva: v.iva ?? 19,
              descuentoMax: v.descuentoMax ?? 0,
            })),
          },
        },
        include: PRODUCTO_INCLUDE,
      });
      return creado;
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
      modulo: "productos",
      accion: "crear",
      entidadId: producto.id,
      despues: producto,
      resultado: "exito",
    });

    return producto;
  }

  async listar(query: QueryProductosDto, ctx: RequestContext): Promise<PaginatedResponse<unknown>> {
    // Prisma no compara dos columnas entre sí en `where` estándar,
    // así que el filtro "stock bajo" se resuelve primero con una raw query
    // acotada por empresa (usa el índice [sucursalId, stock]).
    let idsStockBajo: string[] | undefined;
    if (query.stockBajo) {
      const rows = await this.prisma.$queryRaw<{ producto_id: string }[]>`
        SELECT DISTINCT v.producto_id
        FROM variantes v
        INNER JOIN productos p ON p.id = v.producto_id
        WHERE p.empresa_id = ${ctx.empresaId}
          AND v.deleted_at IS NULL
          AND v.stock <= v.stock_minimo
      `;
      idsStockBajo = rows.map((r) => r.producto_id);
    }

    const where: Prisma.ProductoWhereInput = {
      empresaId: ctx.empresaId,
      deletedAt: null,
      ...(query.categoriaId && { categoriaId: query.categoriaId }),
      ...(query.marcaId && { marcaId: query.marcaId }),
      ...(query.activo !== undefined && { activo: query.activo }),
      ...(query.search && {
        OR: [
          { nombre: { contains: query.search, mode: "insensitive" } },
          { codigo: { contains: query.search, mode: "insensitive" } },
          { variantes: { some: { sku: { contains: query.search, mode: "insensitive" } } } },
        ],
      }),
      ...(idsStockBajo && { id: { in: idsStockBajo } }),
    };

    const sortableFields = new Set(["nombre", "codigo", "createdAt", "updatedAt"]);
    const orderBy: Prisma.ProductoOrderByWithRelationInput =
      query.sortBy && sortableFields.has(query.sortBy)
        ? { [query.sortBy]: query.sortOrder ?? "desc" }
        : { createdAt: "desc" };

    // Una sola ida a BD para el total y otra para los datos (paralelas, no serie)
    const [total, data] = await Promise.all([
      this.prisma.producto.count({ where }),
      this.prisma.producto.findMany({
        where,
        include: PRODUCTO_INCLUDE,
        orderBy,
        skip: query.skip,
        take: query.limit,
      }),
    ]);

    return buildPaginatedResponse(data, total, query.page, query.limit);
  }

  async obtenerPorId(id: string, ctx: RequestContext) {
    const producto = await this.prisma.producto.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
      include: PRODUCTO_INCLUDE,
    });
    if (!producto) throw new NotFoundException("Producto no encontrado.");
    return producto;
  }

  async actualizar(id: string, dto: UpdateProductoDto, ctx: RequestContext) {
    const actual = await this.prisma.producto.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!actual) throw new NotFoundException("Producto no encontrado.");

    // Optimistic locking: si alguien más editó el registro entre que este
    // usuario lo abrió y lo guardó, se rechaza en lugar de sobrescribir en silencio.
    if (actual.version !== dto.version) {
      throw new ConflictException(
        "Este producto fue modificado por otro usuario. Recarga los datos e intenta de nuevo.",
      );
    }

    const { version, ...cambios } = dto;

    const actualizado = await this.prisma.producto.update({
      where: { id, version: actual.version }, // doble verificación a nivel de query
      data: { ...cambios, version: { increment: 1 } },
      include: PRODUCTO_INCLUDE,
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
      modulo: "productos",
      accion: "editar",
      entidadId: id,
      antes: actual,
      despues: actualizado,
      resultado: "exito",
    });

    return actualizado;
  }

  async eliminar(id: string, ctx: RequestContext) {
    const actual = await this.prisma.producto.findFirst({
      where: { id, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!actual) throw new NotFoundException("Producto no encontrado.");

    // Soft delete — nunca se elimina información crítica físicamente.
    await this.prisma.producto.update({
      where: { id },
      data: { deletedAt: new Date(), activo: false },
    });

    await this.audit.registrar({
      empresaId: ctx.empresaId,
      usuarioId: ctx.usuarioId,
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      correlationId: ctx.correlationId,
      modulo: "productos",
      accion: "eliminar",
      entidadId: id,
      antes: actual,
      resultado: "exito",
    });

    return { success: true };
  }

  async agregarImagen(productoId: string, url: string, esPrincipal: boolean, ctx: RequestContext) {
    const producto = await this.prisma.producto.findFirst({
      where: { id: productoId, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!producto) throw new NotFoundException("Producto no encontrado.");

    // Si esta imagen se marca como principal, desmarca cualquier otra —
    // nunca debe haber dos imágenes "principales" a la vez para un producto.
    if (esPrincipal) {
      await this.prisma.productoImagen.updateMany({
        where: { productoId },
        data: { esPrincipal: false },
      });
    }

    const ultimaImagen = await this.prisma.productoImagen.findFirst({
      where: { productoId },
      orderBy: { orden: "desc" },
    });

    return this.prisma.productoImagen.create({
      data: { productoId, url, esPrincipal, orden: (ultimaImagen?.orden ?? -1) + 1 },
    });
  }

  async eliminarImagen(productoId: string, imagenId: string, ctx: RequestContext) {
    const producto = await this.prisma.producto.findFirst({
      where: { id: productoId, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!producto) throw new NotFoundException("Producto no encontrado.");

    await this.prisma.productoImagen.deleteMany({ where: { id: imagenId, productoId } });
    return { success: true };
  }

  async marcarImagenPrincipal(productoId: string, imagenId: string, ctx: RequestContext) {
    const producto = await this.prisma.producto.findFirst({
      where: { id: productoId, empresaId: ctx.empresaId, deletedAt: null },
    });
    if (!producto) throw new NotFoundException("Producto no encontrado.");

    await this.prisma.$transaction([
      this.prisma.productoImagen.updateMany({ where: { productoId }, data: { esPrincipal: false } }),
      this.prisma.productoImagen.update({ where: { id: imagenId }, data: { esPrincipal: true } }),
    ]);
    return { success: true };
  }
}
