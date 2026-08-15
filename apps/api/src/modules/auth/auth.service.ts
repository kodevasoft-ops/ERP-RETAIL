import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { authenticator } from "otplib";
import * as QRCode from "qrcode";
import { randomUUID, createHash } from "node:crypto";
import { PrismaService } from "../../database/prisma.service";
import { EncryptionService } from "../../common/services/encryption.service";

const MAX_INTENTOS_FALLIDOS = 5;
const BLOQUEO_MINUTOS = 15;

interface LoginContext {
  ip: string;
  userAgent: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly encryption: EncryptionService,
  ) {}

  private hashToken(token: string): string {
    // Los refresh tokens se guardan solo como hash (nunca en texto plano).
    return createHash("sha256").update(token).digest("hex");
  }

  async login(email: string, password: string, empresaId: string, ctx: LoginContext) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { email, empresaId, deletedAt: null },
    });

    // Respuesta genérica siempre — nunca revelar si el email existe.
    const credencialesInvalidas = () =>
      new UnauthorizedException("Credenciales inválidas.");

    if (!usuario || !usuario.activo) throw credencialesInvalidas();

    if (usuario.bloqueadoHasta && usuario.bloqueadoHasta > new Date()) {
      throw new ForbiddenException(
        `Cuenta bloqueada temporalmente. Intenta de nuevo más tarde.`,
      );
    }

    const passwordValido = await argon2.verify(usuario.passwordHash, password);

    if (!passwordValido) {
      await this.registrarIntentoFallido(usuario.id, usuario.intentosFallidos);
      throw credencialesInvalidas();
    }

    // Login exitoso: reset de intentos fallidos.
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { intentosFallidos: 0, bloqueadoHasta: null, ultimoLogin: new Date() },
    });

    // Con MFA activo, la contraseña correcta NO es suficiente: se emite un
    // token de desafío de corta duración (5 min) en vez de tokens de sesión
    // reales. El cliente debe llamar /auth/mfa/verificar con el código TOTP.
    if (usuario.mfaEnabled) {
      const mfaToken = await this.jwt.signAsync(
        { sub: usuario.id, tipo: "mfa_challenge" },
        { secret: this.config.get<string>("JWT_ACCESS_SECRET"), expiresIn: "5m" },
      );
      return { requiereMfa: true, mfaToken };
    }

    const sesion = await this.prisma.sesion.create({
      data: {
        usuarioId: usuario.id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      },
    });

    return this.emitirTokens(usuario.id, usuario.empresaId, sesion.id, randomUUID());
  }

  /** Segundo factor del login: intercambia el mfaToken + código TOTP por tokens reales. */
  async verificarMfaLogin(mfaToken: string, codigo: string, ctx: LoginContext) {
    let payload: { sub: string; tipo: string };
    try {
      payload = await this.jwt.verifyAsync(mfaToken, { secret: this.config.get<string>("JWT_ACCESS_SECRET") });
    } catch {
      throw new UnauthorizedException("El desafío MFA expiró. Inicia sesión nuevamente.");
    }
    if (payload.tipo !== "mfa_challenge") throw new UnauthorizedException("Token inválido.");

    const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: payload.sub } });
    if (!usuario.mfaSecret) throw new UnauthorizedException("MFA no configurado correctamente.");

    const secreto = this.encryption.desencriptar(usuario.mfaSecret);
    const valido = authenticator.check(codigo, secreto);
    if (!valido) throw new UnauthorizedException("Código de verificación incorrecto.");

    const sesion = await this.prisma.sesion.create({
      data: { usuarioId: usuario.id, ip: ctx.ip, userAgent: ctx.userAgent },
    });

    return this.emitirTokens(usuario.id, usuario.empresaId, sesion.id, randomUUID());
  }

  /** Genera un secreto TOTP nuevo (aún no activado) y su QR para escanear. */
  async iniciarConfiguracionMfa(usuarioId: string) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
    const secreto = authenticator.generateSecret();

    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { mfaSecret: this.encryption.encriptar(secreto) }, // cifrado en reposo — nunca en texto plano en la BD
    });

    const otpauthUrl = authenticator.keyuri(usuario.email, "ERP Retail", secreto);
    const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
    return { qrDataUrl, otpauthUrl };
  }

  /** Confirma el primer código TOTP y activa MFA definitivamente. */
  async confirmarMfa(usuarioId: string, codigo: string) {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: usuarioId } });
    if (!usuario.mfaSecret) throw new UnauthorizedException("Primero debes iniciar la configuración de MFA.");

    const secreto = this.encryption.desencriptar(usuario.mfaSecret);
    if (!authenticator.check(codigo, secreto)) {
      throw new UnauthorizedException("Código incorrecto. Verifica la hora de tu dispositivo e intenta de nuevo.");
    }

    await this.prisma.usuario.update({ where: { id: usuarioId }, data: { mfaEnabled: true } });
    return { success: true };
  }

  async desactivarMfa(usuarioId: string) {
    await this.prisma.usuario.update({
      where: { id: usuarioId },
      data: { mfaEnabled: false, mfaSecret: null },
    });
    return { success: true };
  }

  private async registrarIntentoFallido(usuarioId: string, intentosActuales: number) {
    const intentos = intentosActuales + 1;
    const data: { intentosFallidos: number; bloqueadoHasta?: Date } = {
      intentosFallidos: intentos,
    };
    if (intentos >= MAX_INTENTOS_FALLIDOS) {
      data.bloqueadoHasta = new Date(Date.now() + BLOQUEO_MINUTOS * 60_000);
    }
    await this.prisma.usuario.update({ where: { id: usuarioId }, data });
  }

  private async emitirTokens(usuarioId: string, empresaId: string, sesionId: string, familyId: string) {
    const permisos = await this.obtenerPermisos(usuarioId);

    const accessToken = await this.jwt.signAsync(
      { sub: usuarioId, empresaId, permisos },
      {
        secret: this.config.get<string>("JWT_ACCESS_SECRET"),
        expiresIn: this.config.get<string>("JWT_ACCESS_EXPIRES_IN"),
      },
    );

    const refreshTokenRaw = randomUUID() + randomUUID();
    const refreshToken = await this.jwt.signAsync(
      { sub: usuarioId, sesionId, familyId, jti: refreshTokenRaw },
      {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
        expiresIn: this.config.get<string>("JWT_REFRESH_EXPIRES_IN"),
      },
    );

    await this.prisma.refreshToken.create({
      data: {
        sesionId,
        usuarioId,
        familyId,
        tokenHash: this.hashToken(refreshTokenRaw),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
      },
    });

    return { accessToken, refreshToken };
  }

  /**
   * Rotación de refresh token con detección de reuso:
   * si el token presentado ya fue marcado como "usado", significa que
   * alguien más lo capturó y lo reutilizó -> se revoca TODA la familia
   * (todas las sesiones derivadas de ese login) por seguridad.
   */
  async refresh(refreshTokenJwt: string) {
    let payload: { sub: string; sesionId: string; familyId: string; jti: string };
    try {
      payload = await this.jwt.verifyAsync(refreshTokenJwt, {
        secret: this.config.get<string>("JWT_REFRESH_SECRET"),
      });
    } catch {
      throw new UnauthorizedException("Sesión expirada, inicia sesión nuevamente.");
    }

    const tokenHash = this.hashToken(payload.jti);
    const registro = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });

    if (!registro || registro.revocado) {
      throw new UnauthorizedException("Sesión inválida.");
    }

    if (registro.usado) {
      // Reuso detectado: revocar toda la familia.
      await this.prisma.refreshToken.updateMany({
        where: { familyId: registro.familyId },
        data: { revocado: true },
      });
      throw new ForbiddenException(
        "Se detectó actividad sospechosa. Todas las sesiones han sido cerradas.",
      );
    }

    await this.prisma.refreshToken.update({
      where: { tokenHash },
      data: { usado: true },
    });

    const usuario = await this.prisma.usuario.findUniqueOrThrow({ where: { id: payload.sub } });

    return this.emitirTokens(usuario.id, usuario.empresaId, payload.sesionId, payload.familyId);
  }

  async logout(sesionId: string) {
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { sesionId },
        data: { revocado: true },
      }),
      this.prisma.sesion.update({
        where: { id: sesionId },
        data: { activa: false, revocadaAt: new Date() },
      }),
    ]);
  }

  async logoutGlobal(usuarioId: string) {
    await this.prisma.$transaction([
      this.prisma.refreshToken.updateMany({
        where: { usuarioId },
        data: { revocado: true },
      }),
      this.prisma.sesion.updateMany({
        where: { usuarioId },
        data: { activa: false, revocadaAt: new Date() },
      }),
    ]);
  }

  private async obtenerPermisos(usuarioId: string): Promise<string[]> {
    const roles = await this.prisma.usuarioRol.findMany({
      where: { usuarioId },
      include: { rol: { include: { permisos: { include: { permiso: true } } } } },
    });

    const permisos = new Set<string>();
    for (const ur of roles) {
      for (const rp of ur.rol.permisos) {
        permisos.add(`${rp.permiso.modulo}:${rp.permiso.accion}`);
      }
    }
    return Array.from(permisos);
  }

  async hashPassword(password: string): Promise<string> {
    // Argon2id — parámetros alineados a recomendación OWASP.
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 19456,
      timeCost: 2,
      parallelism: 1,
    });
  }
}
