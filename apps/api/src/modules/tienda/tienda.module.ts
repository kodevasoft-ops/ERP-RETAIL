import { Module } from "@nestjs/common";
import { TiendaController } from "./tienda.controller";

@Module({
  controllers: [TiendaController],
})
export class TiendaModule {}
