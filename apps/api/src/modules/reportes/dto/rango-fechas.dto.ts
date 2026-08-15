import { IsDateString, IsIn, IsOptional } from "class-validator";

export class RangoFechasDto {
  @IsOptional()
  @IsDateString()
  desde?: string;

  @IsOptional()
  @IsDateString()
  hasta?: string;

  @IsOptional()
  @IsIn(["xlsx", "pdf"])
  formato?: "xlsx" | "pdf";

  /** Rango normalizado: si no se indica, usa los últimos 30 días. */
  get rango(): { desde: Date; hasta: Date } {
    const hasta = this.hasta ? new Date(this.hasta) : new Date();
    const desde = this.desde ? new Date(this.desde) : new Date(hasta.getTime() - 30 * 24 * 60 * 60 * 1000);
    // Incluye el día completo de "hasta".
    hasta.setHours(23, 59, 59, 999);
    return { desde, hasta };
  }
}
