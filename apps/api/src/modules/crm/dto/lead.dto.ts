import { IsDateString, IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUUID, MinLength } from "class-validator";
import { EstadoLead, FuenteLead, TipoSeguimiento } from "database";

export class CreateLeadDto {
  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsEnum(FuenteLead)
  fuente?: FuenteLead;

  @IsOptional()
  @IsUUID()
  vendedorId?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsDateString()
  proximoContacto?: string;
}

export class UpdateLeadDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsEnum(FuenteLead)
  fuente?: FuenteLead;

  @IsOptional()
  @IsUUID()
  vendedorId?: string;

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsDateString()
  proximoContacto?: string;

  @IsInt()
  version!: number;
}

export class MoverLeadDto {
  @IsEnum(EstadoLead)
  estado!: EstadoLead;

  @IsInt()
  orden!: number;

  @IsOptional()
  @IsString()
  motivoPerdida?: string; // requerido en práctica cuando estado = PERDIDO (validado en servicio)

  @IsInt()
  version!: number;
}

export class CreateSeguimientoDto {
  @IsEnum(TipoSeguimiento)
  tipo!: TipoSeguimiento;

  @IsString()
  @MinLength(1)
  notas!: string;

  @IsOptional()
  @IsDateString()
  proximoContacto?: string;
}
