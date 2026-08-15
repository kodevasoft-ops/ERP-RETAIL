import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { Logger } from "nestjs-pino";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import helmet from "@fastify/helmet";
import cors from "@fastify/cors";
import compress from "@fastify/compress";
import cookie from "@fastify/cookie";
import multipart from "@fastify/multipart";
import csrf from "@fastify/csrf-protection";
import { AppModule } from "./app.module";
import { PrismaService } from "./database/prisma.service";

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ trustProxy: true }),
    { bufferLogs: true },
  );

  const config = app.get(ConfigService);
  app.useLogger(app.get(Logger));

  // ---- Seguridad HTTP ----
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        objectSrc: ["'none'"],
      },
    },
    hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  });

  await app.register(cors, {
    origin: config.get<string[]>("CORS_ORIGINS"), // whitelist, nunca "*"
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  });

  await app.register(compress, { global: true });
  await app.register(cookie, { secret: config.get<string>("COOKIE_SECRET") });
  await app.register(multipart, {
    limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10MB, un solo archivo por request — evita abuso de memoria
  });
  await app.register(csrf, { cookieOpts: { signed: true } });

  // ---- Validación global (nunca confiar en el front) ----
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );

  // ---- Versionado de API ----
  app.setGlobalPrefix("api");
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: "1" });

  // ---- Shutdown graceful ----
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app);
  app.enableShutdownHooks();

  // ---- Documentación OpenAPI (solo fuera de producción) ----
  if (config.get("NODE_ENV") !== "production") {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("ERP Retail API")
      .setVersion("1.0")
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup("api/docs", app, document);
  }

  const port = config.get<number>("PORT")!;
  await app.listen(port, "0.0.0.0");
}

bootstrap();
