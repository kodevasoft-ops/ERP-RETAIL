import { Controller, Get, NotFoundException, Param, Query } from "@nestjs/common";
import { Public } from "../../common/decorators/public.decorator";
import { PrismaService } from "../../database/prisma.service";
import { PaginationQueryDto } from "../../common/dto/pagination.dto";

/**
 * API pública de la tienda en línea. Deliberadamente NO usa JwtAuthGuard
 * (marcada @Public()) — cualquier visitante sin cuenta puede consultarla.
 *
 * Regla de seguridad estricta: nunca se exponen costos (costoCompra,
 * costoPromedio), ni SKUs internos, ni ubicación de bodega, ni ningún
 * campo que un cliente final no debería ver. Se seleccionan campos
 * explícitamente (select), nunca se hace spread de la entidad completa.
 */
@Controller({ path: "tienda", version: "1" })
export class TiendaController {
  constructor(private readonly prisma: PrismaService) {}

  @Public()
  @Get(":empresaId/info")
  async info(@Param("empresaId") empresaId: string) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: empresaId, activo: true, tiendaActiva: true },
      select: { id: true, nombre: true, logoUrl: true, descripcionTienda: true, whatsappVentas: true },
    });
    if (!empresa) throw new NotFoundException("Esta tienda no está disponible.");
    return empresa;
  }

  @Public()
  @Get(":empresaId/productos")
  async productos(@Param("empresaId") empresaId: string, @Query() query: PaginationQueryDto) {
    const empresa = await this.prisma.empresa.findFirst({
      where: { id: empresaId, activo: true, tiendaActiva: true },
    });
    if (!empresa) throw new NotFoundException("Esta tienda no está disponible.");

    const where = {
      empresaId,
      activo: true,
      deletedAt: null,
      variantes: { some: { stock: { gt: 0 }, deletedAt: null } },
      ...(query.search && {
        nombre: { contains: query.search, mode: "insensitive" as const },
      }),
    };

    const [total, productos] = await Promise.all([
      this.prisma.producto.count({ where }),
      this.prisma.producto.findMany({
        where,
        skip: query.skip,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          nombre: true,
          descripcion: true,
          categoria: { select: { nombre: true } },
          imagenes: { select: { url: true, esPrincipal: true }, orderBy: { orden: "asc" } },
          variantes: {
            where: { stock: { gt: 0 }, deletedAt: null },
            select: {
              id: true,
              talla: true,
              color: true,
              precioVenta: true,
              // Deliberadamente NO se incluye: stock exacto, costo, SKU interno, ubicación.
            },
          },
        },
      }),
    ]);

    return {
      data: productos,
      meta: { total, page: query.page, limit: query.limit, totalPages: Math.ceil(total / query.limit) },
    };
  }
}
