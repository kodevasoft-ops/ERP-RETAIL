import { IsEnum, IsInt, IsOptional, IsPositive, IsString, IsUUID, Min } from "class-validator";
import { OrigenMovimiento } from "database";

export class EntradaInventarioDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @IsPositive()
  cantidad!: number;

  @IsOptional()
  @Min(0)
  costoUnitario?: number;

  @IsEnum(OrigenMovimiento)
  origen!: OrigenMovimiento;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsString()
  referenciaTipo?: string;

  @IsOptional()
  @IsUUID()
  referenciaId?: string;
}

export class SalidaInventarioDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @IsPositive()
  cantidad!: number;

  @IsEnum(OrigenMovimiento)
  origen!: OrigenMovimiento;

  @IsOptional()
  @IsString()
  motivo?: string;

  @IsOptional()
  @IsString()
  referenciaTipo?: string;

  @IsOptional()
  @IsUUID()
  referenciaId?: string;

  @IsOptional()
  permitirNegativo?: boolean; // solo honrado si el usuario tiene el permiso correspondiente
}

export class TransferenciaInventarioDto {
  @IsUUID()
  varianteId!: string;

  @IsUUID()
  sucursalDestinoId!: string;

  @IsInt()
  @IsPositive()
  cantidad!: number;

  @IsOptional()
  @IsString()
  motivo?: string;
}

export class AjusteInventarioDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  cantidad!: number; // positivo o negativo; el servicio determina el tipo de movimiento

  @IsString()
  motivo!: string; // obligatorio: todo ajuste manual debe justificarse
}
