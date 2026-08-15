import { Injectable, BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { randomUUID } from "node:crypto";

const TIPOS_PERMITIDOS = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const TAMANO_MAXIMO_MB = 8;

/**
 * Cloudflare R2 expone una API 100% compatible con S3 — el mismo SDK y el
 * mismo patrón de URLs prefirmadas funcionan sin cambios. Solo cambia el
 * endpoint (R2_ENDPOINT en vez de un endpoint de AWS) y que R2 no cobra
 * egress, lo cual importa para servir fotos de producto a mucho tráfico.
 *
 * Patrón: el cliente pide una URL prefirmada, sube el archivo DIRECTO al
 * bucket (PUT), y solo entonces le pasa la URL pública resultante al
 * backend para guardarla en la entidad (Producto, Garantía, Gasto, etc.).
 * El archivo nunca atraviesa nuestro proceso Node — evita que subidas
 * grandes compitan por CPU/memoria con el resto de las requests bajo carga.
 */
@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly urlPublicaBase: string;

  constructor(private readonly config: ConfigService) {
    this.bucket = this.config.get<string>("S3_BUCKET")!;
    this.urlPublicaBase = this.config.get<string>("S3_PUBLIC_URL")!; // dominio público de R2 (r2.dev o dominio custom)

    this.client = new S3Client({
      region: "auto", // R2 no usa regiones AWS reales
      endpoint: this.config.get<string>("S3_ENDPOINT"),
      credentials: {
        accessKeyId: this.config.get<string>("S3_ACCESS_KEY")!,
        secretAccessKey: this.config.get<string>("S3_SECRET_KEY")!,
      },
    });
  }

  async generarUrlSubida(nombreArchivo: string, tipoContenido: string, carpeta: string) {
    if (!TIPOS_PERMITIDOS.has(tipoContenido)) {
      throw new BadRequestException("Tipo de archivo no permitido. Solo imágenes (JPEG/PNG/WEBP) o PDF.");
    }

    const extension = nombreArchivo.split(".").pop() ?? "bin";
    // Nombre aleatorio: nunca confiar en el nombre de archivo del cliente
    // (evita colisiones, path traversal, y filtrar nombres de archivo internos).
    const key = `${carpeta}/${randomUUID()}.${extension}`;

    const comando = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      ContentType: tipoContenido,
    });

    const uploadUrl = await getSignedUrl(this.client, comando, { expiresIn: 300 }); // 5 min para completar la subida
    const publicUrl = `${this.urlPublicaBase}/${key}`;

    return { uploadUrl, publicUrl, key };
  }

  validarTamano(tamanoBytes: number) {
    if (tamanoBytes > TAMANO_MAXIMO_MB * 1024 * 1024) {
      throw new BadRequestException(`El archivo excede el máximo permitido de ${TAMANO_MAXIMO_MB}MB.`);
    }
  }
}
