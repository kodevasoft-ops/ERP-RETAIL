import { BadRequestException, Controller, Get, Post, Req, Res } from "@nestjs/common";
import type { FastifyReply, FastifyRequest } from "fastify";
import { PlantillaImportacionService } from "./plantilla-importacion.service";
import { ImportacionProductosService } from "./importacion-productos.service";
import { RequirePermissions } from "../../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../../common/decorators/current-user.decorator";

const TIPOS_PERMITIDOS = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "application/vnd.ms-excel",
]);

@Controller({ path: "productos/importar", version: "1" })
export class ImportacionProductosController {
  constructor(
    private readonly plantilla: PlantillaImportacionService,
    private readonly importacion: ImportacionProductosService,
  ) {}

  private async leerArchivo(req: FastifyRequest): Promise<Buffer> {
    const archivo = await req.file();
    if (!archivo) throw new BadRequestException("No se recibió ningún archivo.");
    if (!TIPOS_PERMITIDOS.has(archivo.mimetype)) {
      throw new BadRequestException("El archivo debe ser un Excel (.xlsx).");
    }
    return archivo.toBuffer();
  }

  @RequirePermissions({ modulo: "productos", accion: "importar" })
  @Get("plantilla")
  async descargarPlantilla(@Res() res: FastifyReply) {
    const buffer = await this.plantilla.generar();
    res
      .header("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
      .header("Content-Disposition", 'attachment; filename="plantilla-productos.xlsx"')
      .send(buffer);
  }

  /** Sube el archivo y valida SIN crear nada — permite mostrar un preview antes de confirmar. */
  @RequirePermissions({ modulo: "productos", accion: "importar" })
  @Post("validar")
  async validar(@Req() req: FastifyRequest, @CurrentUser() user: AuthenticatedUser) {
    const buffer = await this.leerArchivo(req);
    const { filas, errores } = await this.importacion.validar(buffer, {
      empresaId: user.empresaId,
      sucursalId: "", // no se usa en validación, solo en ejecución
      usuarioId: user.id,
    });

    const productosUnicos = new Set(filas.map((f) => f.codigo)).size;

    return {
      filasValidas: filas.length,
      productosDetectados: productosUnicos,
      errores,
      listoParaImportar: filas.length > 0,
    };
  }

  @RequirePermissions({ modulo: "productos", accion: "importar" })
  @Post("ejecutar")
  async ejecutar(@Req() req: FastifyRequest, @CurrentUser() user: AuthenticatedUser) {
    const buffer = await this.leerArchivo(req);
    // La sucursal destino viaja como query param (?sucursalId=...) porque
    // el body multipart ya está ocupado por el archivo.
    const sucursalId = (req.query as { sucursalId?: string }).sucursalId;
    if (!sucursalId) throw new BadRequestException("Debes indicar la sucursal destino (?sucursalId=).");

    return this.importacion.ejecutar(buffer, { empresaId: user.empresaId, sucursalId, usuarioId: user.id });
  }
}
