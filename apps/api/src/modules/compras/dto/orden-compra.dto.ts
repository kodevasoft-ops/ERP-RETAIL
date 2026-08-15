import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

export class OrdenCompraItemDto {
  @IsUUID()
  varianteId!: string;

  @IsInt()
  @IsPositive()
  cantidad!: number;

  @IsNumber()
  @Min(0)
  costoUnitario!: number;
}

export class CreateOrdenCompraDto {
  @IsUUID()
  sucursalId!: string;

  @IsUUID()
  proveedorId!: string;

  @IsArray()
  @ArrayMinSize(1, { message: "La orden debe tener al menos un producto." })
  @ValidateNested({ each: true })
  @Type(() => OrdenCompraItemDto)
  items!: OrdenCompraItemDto[];

  @IsOptional()
  @IsDateString()
  fechaEsperada?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}

export class RecepcionItemDto {
  @IsUUID()
  ordenCompraItemId!: string;

  @IsInt()
  @IsPositive()
  cantidadRecibida!: number;
}

export class RecibirOrdenCompraDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecepcionItemDto)
  items!: RecepcionItemDto[];

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsInt()
  version!: number;
}

export class CancelarOrdenCompraDto {
  @IsString()
  motivo!: string;

  @IsInt()
  version!: number;
}
