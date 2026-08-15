import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { TipoDevolucion } from "database";

export class DevolucionItemDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @IsPositive()
  cantidad!: number;

  @IsOptional()
  @IsUUID()
  varianteNuevaId?: string; // solo para CAMBIO_TALLA / CAMBIO_COLOR
}

export class CreateDevolucionDto {
  @IsUUID()
  sucursalId!: string;

  @IsUUID()
  ventaId!: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsEnum(TipoDevolucion)
  tipo!: TipoDevolucion;

  @IsString()
  @MinLength(3)
  motivo!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DevolucionItemDto)
  items!: DevolucionItemDto[];

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoReembolso?: number;
}

export class RechazarDevolucionDto {
  @IsString()
  @MinLength(3)
  motivo!: string;
}
