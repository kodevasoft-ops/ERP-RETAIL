import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";

const ALGORITMO = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT = "erp-retail-aes-salt-v1"; // fijo intencional: la clave real viene de AES_ENCRYPTION_KEY

/**
 * Cifrado simétrico para datos sensibles que deben poder leerse de vuelta
 * (a diferencia de contraseñas, que van con hash unidireccional Argon2id).
 * Casos de uso: secretos MFA, números de documento en reportes exportados,
 * cualquier PII que la instrucción de seguridad exija cifrar en reposo.
 *
 * AES-256-GCM incluye autenticación (tag): si el dato cifrado fue
 * manipulado, `desencriptar` lanza en vez de devolver basura silenciosa.
 */
@Injectable()
export class EncryptionService {
  private readonly key: Buffer;

  constructor(config: ConfigService) {
    const secret = config.get<string>("AES_ENCRYPTION_KEY")!;
    this.key = scryptSync(secret, SALT, 32);
  }

  encriptar(texto: string): string {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(ALGORITMO, this.key, iv);
    const cifrado = Buffer.concat([cipher.update(texto, "utf8"), cipher.final()]);
    const authTag = cipher.getAuthTag();
    // Empaqueta iv + authTag + cifrado en un solo string base64 transportable.
    return Buffer.concat([iv, authTag, cifrado]).toString("base64");
  }

  desencriptar(valorCifrado: string): string {
    const buffer = Buffer.from(valorCifrado, "base64");
    const iv = buffer.subarray(0, IV_LENGTH);
    const authTag = buffer.subarray(IV_LENGTH, IV_LENGTH + 16);
    const cifrado = buffer.subarray(IV_LENGTH + 16);

    const decipher = createDecipheriv(ALGORITMO, this.key, iv);
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(cifrado), decipher.final()]).toString("utf8");
  }
}
