import { PartialType } from "@nestjs/mapped-types";
import { IsDateString, IsInt, IsOptional } from "class-validator";
import { CreateClienteDto } from "./create-cliente.dto";

export class UpdateClienteDto extends PartialType(CreateClienteDto) {
  // Declarado explícito (no solo heredado vía PartialType) para que el
  // tipo esté garantizado en tiempo de compilación sin depender de cómo
  // el mixin de NestJS resuelve la inferencia estructural.
  @IsOptional()
  @IsDateString()
  fechaNacimiento?: string;

  @IsInt()
  version!: number;
}
