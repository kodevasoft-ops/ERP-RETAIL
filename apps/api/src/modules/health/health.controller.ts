import { Controller, Get } from "@nestjs/common";
import { HealthCheck, HealthCheckService, PrismaHealthIndicator } from "@nestjs/terminus";
import { Public } from "../../common/decorators/public.decorator";
import { PrismaService } from "../../database/prisma.service";

@Controller("health")
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private prisma: PrismaService,
  ) {}

  @Public()
  @Get("live")
  liveness() {
    // Liveness: el proceso responde. No toca dependencias externas.
    return { status: "ok" };
  }

  @Public()
  @Get("ready")
  @HealthCheck()
  readiness() {
    // Readiness: puede atender tráfico real (DB disponible, etc.)
    return this.health.check([() => this.prismaIndicator.pingCheck("database", this.prisma)]);
  }
}
