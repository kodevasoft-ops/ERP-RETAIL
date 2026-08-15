import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";
import { ClientesService } from "./clientes.service";
import { CreateClienteDto } from "./dto/create-cliente.dto";
import { UpdateClienteDto } from "./dto/update-cliente.dto";
import { QueryClientesDto } from "./dto/query-clientes.dto";
import { RequirePermissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

@Controller({ path: "clientes", version: "1" })
export class ClientesController {
  constructor(private readonly service: ClientesService) {}

  private ctx(user: AuthenticatedUser, req: FastifyRequest) {
    return {
      empresaId: user.empresaId,
      usuarioId: user.id,
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? "",
      correlationId: req.headers["x-correlation-id"] as string | undefined,
    };
  }

  @RequirePermissions({ modulo: "clientes", accion: "crear" })
  @Post()
  crear(@Body() dto: CreateClienteDto, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.crear(dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "clientes", accion: "ver" })
  @Get()
  listar(@Query() query: QueryClientesDto, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.listar(query, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "clientes", accion: "ver" })
  @Get(":id")
  obtener(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.obtenerPorId(id, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "clientes", accion: "editar" })
  @Patch(":id")
  actualizar(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateClienteDto,
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: FastifyRequest,
  ) {
    return this.service.actualizar(id, dto, this.ctx(user, req));
  }

  @RequirePermissions({ modulo: "clientes", accion: "eliminar" })
  @Delete(":id")
  eliminar(@Param("id", ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser, @Req() req: FastifyRequest) {
    return this.service.eliminar(id, this.ctx(user, req));
  }
}
