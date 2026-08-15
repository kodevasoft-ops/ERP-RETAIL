import { ArrayMinSize, IsArray, IsIn, IsInt, IsOptional, IsString, MinLength, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

const ACCIONES = ["ver", "crear", "editar", "eliminar", "exportar", "importar", "aprobar", "anular"] as const;

export class PermisoAsignadoDto {
  @IsString()
  modulo!: string;

  @IsIn(ACCIONES)
  accion!: (typeof ACCIONES)[number];
}

export class CreateRolDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "El rol debe tener al menos un permiso." })
  @ValidateNested({ each: true })
  @Type(() => PermisoAsignadoDto)
  permisos!: PermisoAsignadoDto[];
}

export class UpdateRolDto extends CreateRolDto {
  @IsInt()
  version!: number;
}
