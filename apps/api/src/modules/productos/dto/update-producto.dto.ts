import { PartialType, OmitType } from "@nestjs/mapped-types";
import { IsInt } from "class-validator";
import { CreateProductoDto } from "./create-producto.dto";

export class UpdateProductoDto extends PartialType(
  OmitType(CreateProductoDto, ["variantes"] as const),
) {
  // Obligatorio: el cliente debe enviar la versión que editó.
  // Si no coincide con la versión actual en BD, se rechaza (edición concurrente).
  @IsInt()
  version!: number;
}
