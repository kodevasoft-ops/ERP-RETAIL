import { IsIn, IsInt, IsNumber, IsOptional, IsString, IsUUID, Min, MinLength } from "class-validator";

const ESTADOS = ["PENDIENTE", "DESPACHADO", "EN_TRANSITO", "ENTREGADO", "DEVUELTO"] as const;

export class CreateEnvioDto {
  @IsUUID()
  ventaId!: string;

  @IsOptional()
  @IsUUID()
  transportadoraId?: string;

  @IsString()
  @MinLength(3)
  direccion!: string;

  @IsString()
  @MinLength(2)
  ciudad!: string;

  @IsOptional()
  @IsString()
  barrio?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  documentoDestinatario?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costoEnvio?: number;
}

export class ActualizarEnvioDto {
  @IsOptional()
  @IsUUID()
  transportadoraId?: string;

  @IsOptional()
  @IsString()
  numeroGuia?: string;

  @IsOptional()
  @IsIn(ESTADOS)
  estado?: (typeof ESTADOS)[number];

  @IsInt()
  version!: number;
}
