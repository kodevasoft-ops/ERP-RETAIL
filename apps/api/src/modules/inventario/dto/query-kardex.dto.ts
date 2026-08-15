import { IsOptional, IsUUID } from "class-validator";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";

export class QueryKardexDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID()
  varianteId?: string;

  @IsOptional()
  @IsUUID()
  sucursalId?: string;
}
