import { IsBoolean, IsOptional, IsUUID } from "class-validator";
import { Type } from "class-transformer";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";

export class QueryProductosDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  categoriaId?: string;

  @IsOptional()
  @IsUUID()
  marcaId?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  stockBajo?: boolean; // filtra productos con alguna variante bajo stockMinimo
}
