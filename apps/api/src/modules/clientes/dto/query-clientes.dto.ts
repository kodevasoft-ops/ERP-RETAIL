import { IsArray, IsEnum, IsOptional } from "class-validator";
import { EtiquetaCliente } from "database";
import { PaginationQueryDto } from "../../../common/dto/pagination.dto";

export class QueryClientesDto extends PaginationQueryDto {
  @IsOptional()
  @IsArray()
  @IsEnum(EtiquetaCliente, { each: true })
  etiquetas?: EtiquetaCliente[];
}
