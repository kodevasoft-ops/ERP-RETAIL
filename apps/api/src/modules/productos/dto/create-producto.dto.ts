import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Sexo } from "database";

export class CreateVarianteDto {
  @IsUUID()
  sucursalId!: string;

  @IsString()
  @MinLength(1)
  talla!: string;

  @IsString()
  @MinLength(1)
  color!: string;

  @IsString()
  sku!: string;

  @IsOptional()
  @IsString()
  codigoBarras?: string;

  @IsNumber()
  @Min(0)
  stock!: number;

  @IsNumber()
  @Min(0)
  stockMinimo!: number;

  @IsNumber()
  @Min(0)
  costoCompra!: number;

  @IsNumber()
  @Min(0)
  precioVenta!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioMayorista?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioVip?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  iva?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoMax?: number;
}

export class CreateProductoDto {
  @IsString()
  @MinLength(1)
  codigo!: string;

  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  marcaId?: string;

  @IsOptional()
  @IsEnum(Sexo)
  sexo?: Sexo;

  @IsOptional()
  @IsString()
  temporada?: string;

  @IsOptional()
  @IsString()
  coleccion?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "Debe registrar al menos una variante (talla/color)." })
  @ValidateNested({ each: true })
  @Type(() => CreateVarianteDto)
  variantes!: CreateVarianteDto[];
}
