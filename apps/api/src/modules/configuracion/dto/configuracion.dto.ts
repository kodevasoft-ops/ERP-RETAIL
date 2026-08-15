import { IsBoolean, IsInt, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateCategoriaDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsUUID()
  padreId?: string;
}

export class CreateMarcaDto {
  @IsString()
  @MinLength(1)
  nombre!: string;
}

export class CreateTransportadoraDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsString()
  urlRastreo?: string; // debe incluir "{guia}" como placeholder
}

export class UpdateSucursalDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

export class CreateSucursalDto extends UpdateSucursalDto {
  @IsString()
  @MinLength(1)
  declare nombre: string;

  @IsString()
  @MinLength(1)
  codigo!: string;
}

export class UpdateEmpresaDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsBoolean()
  tiendaActiva?: boolean;

  @IsOptional()
  @IsString()
  whatsappVentas?: string; // formato E.164 sin '+', ej: 573001234567

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  descripcionTienda?: string;
}
