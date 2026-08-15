import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { MetodoPago } from "database";

export class VentaItemDto {
  @IsUUID()
  varianteId!: string;

  @IsNumber()
  @IsPositive()
  cantidad!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  descuentoPorcentaje?: number;
}

export class PagoDto {
  @IsEnum(MetodoPago)
  metodo!: MetodoPago;

  @IsNumber()
  @IsPositive()
  monto!: number;

  @IsOptional()
  @IsString()
  referencia?: string;
}

export class CreateVentaDto {
  @IsUUID()
  sucursalId!: string;

  @IsOptional()
  @IsUUID()
  cajaId?: string; // ID de la SesionCaja activa; si se omite, la venta no se arquea en Caja

  @IsOptional()
  @IsUUID()
  cotizacionId?: string; // si la venta proviene de convertir una cotización

  @IsOptional()
  @IsUUID()
  clienteId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "La venta debe tener al menos un producto." })
  @ValidateNested({ each: true })
  @Type(() => VentaItemDto)
  items!: VentaItemDto[];

  @IsArray()
  @ArrayMinSize(1, { message: "La venta debe tener al menos un pago." })
  @ValidateNested({ each: true })
  @Type(() => PagoDto)
  pagos!: PagoDto[];

  @IsOptional()
  @IsString()
  observaciones?: string;

  /**
   * Clave de idempotencia generada por el cliente (ej. UUID por sesión de
   * checkout). Si la misma clave se reenvía (doble clic, reintento de red),
   * el backend devuelve la venta ya creada en vez de duplicar el cobro.
   */
  @IsString()
  @MinLength(10)
  idempotencyKey!: string;
}

export class AnularVentaDto {
  @IsString()
  @MinLength(3)
  motivo!: string;
}
