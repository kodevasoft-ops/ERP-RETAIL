import { IsIn, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class RegistrarAbonoDto {
  @IsNumber()
  @IsPositive()
  monto!: number;

  @IsIn(["EFECTIVO", "TRANSFERENCIA", "TARJETA_DEBITO", "TARJETA_CREDITO"])
  metodoPago!: string;

  @IsOptional()
  @IsString()
  observaciones?: string;
}
