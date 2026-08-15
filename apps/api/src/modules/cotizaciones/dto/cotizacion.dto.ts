import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";

export class CotizacionItemDto {
  @IsUUID()
  varianteId!: string;

  @IsNumber()
  @IsPositive()
  cantidad!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoPorcentaje?: number;
}

export class CreateCotizacionDto {
  @IsUUID()
  sucursalId!: string;

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsOptional()
  @IsUUID()
  leadId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "La cotización debe tener al menos un producto." })
  @ValidateNested({ each: true })
  @Type(() => CotizacionItemDto)
  items!: CotizacionItemDto[];

  @IsOptional()
  @IsDateString()
  fechaVencimiento?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
