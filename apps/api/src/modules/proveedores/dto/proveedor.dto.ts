import { PartialType } from "@nestjs/mapped-types";
import { IsEmail, IsInt, IsOptional, IsString, MinLength } from "class-validator";

export class CreateProveedorDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  nit!: string;

  @IsOptional()
  @IsString()
  contacto?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  notas?: string;
}

export class UpdateProveedorDto extends PartialType(CreateProveedorDto) {
  @IsInt()
  version!: number;
}
