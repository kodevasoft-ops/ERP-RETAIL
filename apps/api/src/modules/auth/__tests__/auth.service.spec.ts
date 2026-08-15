import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as argon2 from "argon2";
import { AuthService } from "../auth.service";
import { EncryptionService } from "../../../common/services/encryption.service";
import { createPrismaMock } from "../../../common/testing/prisma-mock";

describe("AuthService", () => {
  let service: AuthService;
  let prisma: ReturnType<typeof createPrismaMock>;
  let jwt: jest.Mocked<JwtService>;
  let config: jest.Mocked<ConfigService>;

  beforeEach(() => {
    prisma = createPrismaMock();
    jwt = { signAsync: jest.fn().mockResolvedValue("token-firmado"), verifyAsync: jest.fn() } as never;
    config = { get: jest.fn((key: string) => `valor-${key}`) } as never;
    const encryption = new EncryptionService({ get: () => "clave-de-prueba-suficientemente-larga" } as never);
    service = new AuthService(prisma, jwt, config, encryption);
  });

  describe("hashPassword / verificación", () => {
    it("genera un hash Argon2id verificable", async () => {
      const hash = await service.hashPassword("MiPassword123!");
      expect(hash).toMatch(/^\$argon2id\$/);
      expect(await argon2.verify(hash, "MiPassword123!")).toBe(true);
      expect(await argon2.verify(hash, "PasswordIncorrecto")).toBe(false);
    });
  });

  describe("login", () => {
    it("rechaza con mensaje genérico si el usuario no existe (nunca revela si el email existe)", async () => {
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.login("noexiste@test.com", "cualquiera", "empresa-1", { ip: "127.0.0.1", userAgent: "test" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("bloquea la cuenta tras alcanzar el máximo de intentos fallidos", async () => {
      const hash = await argon2.hash("PasswordCorrecto", { type: argon2.argon2id });
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValue({
        id: "user-1",
        empresaId: "empresa-1",
        passwordHash: hash,
        activo: true,
        bloqueadoHasta: null,
        intentosFallidos: 4, // el 5to intento fallido debe disparar el bloqueo
      });
      (prisma.usuario.update as jest.Mock).mockResolvedValue({});

      await expect(
        service.login("user@test.com", "PasswordIncorrecto", "empresa-1", { ip: "127.0.0.1", userAgent: "test" }),
      ).rejects.toThrow(UnauthorizedException);

      const dataDeActualizacion = (prisma.usuario.update as jest.Mock).mock.calls[0][0].data;
      expect(dataDeActualizacion.intentosFallidos).toBe(5);
      expect(dataDeActualizacion.bloqueadoHasta).toBeInstanceOf(Date);
    });

    it("rechaza el login si la cuenta está bloqueada, aunque la contraseña sea correcta", async () => {
      const hash = await argon2.hash("PasswordCorrecto", { type: argon2.argon2id });
      const bloqueadoHasta = new Date(Date.now() + 10 * 60_000); // bloqueado 10 min más
      (prisma.usuario.findFirst as jest.Mock).mockResolvedValueOnce({
        id: "user-1",
        empresaId: "empresa-1",
        passwordHash: hash,
        activo: true,
        bloqueadoHasta,
      });

      await expect(
        service.login("user@test.com", "PasswordCorrecto", "empresa-1", { ip: "127.0.0.1", userAgent: "test" }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("refresh (rotación de tokens)", () => {
    it("revoca toda la familia de tokens si detecta reuso de un refresh token ya usado", async () => {
      jwt.verifyAsync.mockResolvedValueOnce({ sub: "user-1", sesionId: "sesion-1", familyId: "familia-1", jti: "jti-1" });
      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValueOnce({
        tokenHash: "hash-x",
        familyId: "familia-1",
        revocado: false,
        usado: true, // ya fue usado antes -> esto es un reuso, señal de robo
      });
      (prisma.refreshToken.updateMany as jest.Mock).mockResolvedValueOnce({});

      await expect(service.refresh("token-refresh-cualquiera")).rejects.toThrow(ForbiddenException);

      expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { familyId: "familia-1" },
          data: { revocado: true },
        }),
      );
    });
  });
});
