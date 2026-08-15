import { IsEnum, IsNumber, IsOptional, IsPositive, IsString, IsUUID, Min, MinLength } from "class-validator";
import { TipoMovimientoCaja } from "database";

export class AbrirCajaDto {
  @IsUUID()
  cajaId!: string;

  @IsNumber()
  @Min(0)
  montoApertura!: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class CerrarCajaDto {
  @IsNumber()
  @Min(0)
  montoCierreReal!: number;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class MovimientoCajaDto {
  @IsEnum(TipoMovimientoCaja)
  tipo!: TipoMovimientoCaja;

  @IsNumber()
  @IsPositive()
  monto!: number;

  @IsString()
  @MinLength(3, { message: "El motivo es obligatorio." })
  motivo!: string;
}
