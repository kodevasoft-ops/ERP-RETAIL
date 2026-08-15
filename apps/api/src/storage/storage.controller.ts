import { Body, Controller, Post } from "@nestjs/common";
import { IsIn, IsInt, IsString, Max, MinLength } from "class-validator";
import { StorageService } from "./storage.service";
import { RequirePermissions } from "../common/decorators/permissions.decorator";

const CARPETAS_PERMITIDAS = ["productos", "garantias", "gastos", "empresa"] as const;

class PresignedUrlDto {
  @IsString()
  @MinLength(1)
  nombreArchivo!: string;

  @IsIn(["image/jpeg", "image/png", "image/webp", "application/pdf"])
  tipoContenido!: string;

  @IsIn(CARPETAS_PERMITIDAS)
  carpeta!: (typeof CARPETAS_PERMITIDAS)[number];

  @IsInt()
  @Max(8 * 1024 * 1024)
  tamanoBytes!: number;
}

@Controller({ path: "uploads", version: "1" })
export class StorageController {
  constructor(private readonly storage: StorageService) {}

  // Nota: el permiso exigido es deliberadamente amplio (cualquier usuario
  // autenticado con acceso al módulo correspondiente puede subir su propio
  // archivo); la restricción fina de "a qué entidad se asocia" ocurre en
  // el endpoint de negocio que recibe la URL resultante (ej. POST /productos/:id/imagenes).
  @RequirePermissions({ modulo: "productos", accion: "editar" })
  @Post("presigned-url")
  async generarUrl(@Body() dto: PresignedUrlDto) {
    this.storage.validarTamano(dto.tamanoBytes);
    return this.storage.generarUrlSubida(dto.nombreArchivo, dto.tipoContenido, dto.carpeta);
  }
}
