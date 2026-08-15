import { PartialType } from "@nestjs/mapped-types";
import { IsDateString, IsEnum, IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MinLength } from "class-validator";
import { CategoriaGasto } from "database";

export class CreateGastoDto {
  @IsUUID()
  sucursalId!: string;

  @IsEnum(CategoriaGasto)
  categoria!: CategoriaGasto;

  @IsString()
  @MinLength(3)
  descripcion!: string;

  @IsNumber()
  @IsPositive()
  monto!: number;

  @IsDateString()
  fecha!: string;

  @IsOptional()
  @IsString()
  comprobanteUrl?: string;

  @IsOptional()
  @IsUUID()
  sesionCajaId?: string;
}

export class UpdateGastoDto extends PartialType(CreateGastoDto) {
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @IsInt()
  version!: number;
}
