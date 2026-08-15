import { Body, Controller, Post, Req, Res, UnauthorizedException, UseGuards } from "@nestjs/common";
import { Throttle } from "@nestjs/throttler";
import type { FastifyReply, FastifyRequest } from "fastify";
import { AuthService } from "./auth.service";
import { LoginDto } from "./dto/login.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { CurrentUser, AuthenticatedUser } from "../../common/decorators/current-user.decorator";

const REFRESH_COOKIE = "refresh_token";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Throttle({ default: { limit: 5, ttl: 60_000 } }) // anti brute-force en login
  @Post("login")
  async login(
    @Body() dto: LoginDto,
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const resultado = await this.authService.login(
      dto.email,
      dto.password,
      dto.empresaId,
      { ip: req.ip, userAgent: req.headers["user-agent"] ?? "" },
    );

    // El usuario tiene MFA activo: no hay tokens de sesión todavía, solo
    // un desafío de corta duración. El cliente debe llamar /auth/mfa/verificar.
    if ("requiereMfa" in resultado) {
      return resultado;
    }

    this.setRefreshCookie(res, resultado.refreshToken);
    return { accessToken: resultado.accessToken };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("refresh")
  async refresh(@Req() req: FastifyRequest, @Res({ passthrough: true }) res: FastifyReply) {
    const token = req.cookies?.[REFRESH_COOKIE];
    if (!token) {
      throw new UnauthorizedException("No hay sesión activa. Inicia sesión nuevamente.");
    }
    const { accessToken, refreshToken } = await this.authService.refresh(token);
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout")
  async logout(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) res: FastifyReply) {
    // sesionId viene del refresh token actual en cookie; simplificado aquí.
    res.clearCookie(REFRESH_COOKIE);
    return { success: true };
  }

  @UseGuards(JwtAuthGuard)
  @Post("logout-global")
  async logoutGlobal(@CurrentUser() user: AuthenticatedUser, @Res({ passthrough: true }) res: FastifyReply) {
    await this.authService.logoutGlobal(user.id);
    res.clearCookie(REFRESH_COOKIE);
    return { success: true };
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("mfa/verificar")
  async verificarMfa(
    @Body() body: { mfaToken: string; codigo: string },
    @Req() req: FastifyRequest,
    @Res({ passthrough: true }) res: FastifyReply,
  ) {
    const { accessToken, refreshToken } = await this.authService.verificarMfaLogin(body.mfaToken, body.codigo, {
      ip: req.ip,
      userAgent: req.headers["user-agent"] ?? "",
    });
    this.setRefreshCookie(res, refreshToken);
    return { accessToken };
  }

  @UseGuards(JwtAuthGuard)
  @Post("mfa/configurar")
  configurarMfa(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.iniciarConfiguracionMfa(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post("mfa/confirmar")
  confirmarMfa(@Body() body: { codigo: string }, @CurrentUser() user: AuthenticatedUser) {
    return this.authService.confirmarMfa(user.id, body.codigo);
  }

  @UseGuards(JwtAuthGuard)
  @Post("mfa/desactivar")
  desactivarMfa(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.desactivarMfa(user.id);
  }

  private setRefreshCookie(res: FastifyReply, token: string) {
    res.setCookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/api/v1/auth",
      maxAge: 7 * 24 * 60 * 60,
    });
  }
}
