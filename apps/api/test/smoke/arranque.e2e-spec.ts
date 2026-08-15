/**
 * Smoke tests: corren en segundos, se ejecutan automáticamente después de
 * cada despliegue (ver .github/workflows/ci.yml o un job de post-deploy)
 * para confirmar que el sistema realmente levantó antes de dirigir tráfico
 * real hacia él. No prueban lógica de negocio — solo "¿está vivo?".
 */
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { AppModule } from "../../src/app.module";

describe("Smoke: arranque de la aplicación", () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
    app.setGlobalPrefix("api");
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  }, 30_000);

  afterAll(async () => {
    await app.close();
  });

  it("el proceso arranca sin errores y responde", async () => {
    const response = await app.getHttpAdapter().getInstance().inject({
      method: "GET",
      url: "/api/health/live",
    });
    expect(response.statusCode).toBe(200);
    expect(JSON.parse(response.payload)).toEqual({ status: "ok" });
  });

  it("el healthcheck de readiness confirma conexión real a la base de datos", async () => {
    const response = await app.getHttpAdapter().getInstance().inject({
      method: "GET",
      url: "/api/health/ready",
    });
    expect(response.statusCode).toBe(200);
  });

  it("un endpoint protegido sin token rechaza con 401, nunca con 500", async () => {
    const response = await app.getHttpAdapter().getInstance().inject({
      method: "GET",
      url: "/api/v1/productos",
    });
    expect(response.statusCode).toBe(401);
  });

  it("las cabeceras de seguridad HTTP están presentes (Helmet activo)", async () => {
    const response = await app.getHttpAdapter().getInstance().inject({
      method: "GET",
      url: "/api/health/live",
    });
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
    expect(response.headers["x-frame-options"]).toBeDefined();
  });
});
