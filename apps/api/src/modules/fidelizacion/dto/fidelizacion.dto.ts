import { IsInt, IsOptional, IsPositive, IsString, IsUUID, MinLength } from "class-validator";

export class AcumularPuntosDto {
  @IsInt()
  @IsPositive()
  puntos!: number;

  @IsString()
  @MinLength(3)
  motivo!: string;

  @IsOptional()
  @IsUUID()
  ventaId?: string;
}

export class RedimirPuntosDto {
  @IsInt()
  @IsPositive()
  puntos!: number;

  @IsString()
  @MinLength(3)
  motivo!: string;
}
