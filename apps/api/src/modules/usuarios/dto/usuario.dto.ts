import { PartialType, OmitType } from "@nestjs/mapped-types";
import { ArrayMinSize, IsArray, IsBoolean, IsEmail, IsInt, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateUsuarioDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8, { message: "La contraseña debe tener al menos 8 caracteres." })
  password!: string;

  @IsString()
  @MinLength(1)
  nombre!: string;

  @IsString()
  @MinLength(1)
  apellido!: string;

  @IsOptional()
  @IsUUID()
  sucursalId?: string;

  @IsArray()
  @ArrayMinSize(1, { message: "Debe asignar al menos un rol." })
  @IsUUID(undefined, { each: true })
  rolIds!: string[];
}

export class UpdateUsuarioDto extends PartialType(
  OmitType(CreateUsuarioDto, ["email", "password"] as const),
) {
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsInt()
  version!: number;
}

export class ResetPasswordDto {
  @IsString()
  @MinLength(8)
  nuevaPassword!: string;
}
