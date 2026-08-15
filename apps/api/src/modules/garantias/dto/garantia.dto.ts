import { PartialType } from "@nestjs/mapped-types";
import { IsArray, IsIn, IsInt, IsOptional, IsPositive, IsString, IsUUID, MinLength } from "class-validator";

const ESTADOS = ["RECIBIDO", "EN_REVISION", "ENVIADO_PROVEEDOR", "APROBADO", "RECHAZADO", "ENTREGADO"] as const;

export class CreateGarantiaDto {
  @IsUUID()
  sucursalId!: string;

  @IsOptional()
  @IsUUID()
  ventaId?: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsUUID()
  varianteId!: string;

  @IsOptional()
  @IsPositive()
  cantidad?: number;

  @IsString()
  @MinLength(3)
  motivo!: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  fotos?: string[];
}

export class ActualizarEstadoGarantiaDto {
  @IsIn(ESTADOS)
  estado!: (typeof ESTADOS)[number];

  @IsOptional()
  @IsString()
  notas?: string;

  @IsInt()
  version!: number;
}
