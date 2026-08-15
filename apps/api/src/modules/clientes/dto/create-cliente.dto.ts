import {
  IsArray,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from "class-validator";
import { EtiquetaCliente, TipoDocumento } from "database";

export class CreateClienteDto {
  @IsEnum(TipoDocumento)
  tipoDocumento!: TipoDocumento;

  @IsString()
  @MinLength(1)
  numeroDocumento!: string;

  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsOptional()
  @IsString()
  apellido?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  whatsapp?: string;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  ciudad?: string;

  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(EtiquetaCliente, { each: true })
  etiquetas?: EtiquetaCliente[];

  @IsOptional()
  @IsString()
  notas?: string;
}
