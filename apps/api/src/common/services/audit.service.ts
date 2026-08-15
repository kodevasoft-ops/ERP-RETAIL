import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

interface AuditEntry {
  empresaId: string;
  usuarioId?: string;
  ip?: string;
  userAgent?: string;
  modulo: string;
  accion: string;
  entidadId?: string;
  antes?: unknown;
  despues?: unknown;
  resultado: "exito" | "error";
  correlationId?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async registrar(entry: AuditEntry): Promise<void> {
    // Nunca debe romper la operación de negocio si falla el log de auditoría;
    // se aísla en su propio try/catch (no bloquear al usuario).
    try {
      await this.prisma.auditLog.create({
        data: {
          empresaId: entry.empresaId,
          usuarioId: entry.usuarioId,
          ip: entry.ip,
          userAgent: entry.userAgent,
          modulo: entry.modulo,
          accion: entry.accion,
          entidadId: entry.entidadId,
          antes: entry.antes as never,
          despues: entry.despues as never,
          resultado: entry.resultado,
          correlationId: entry.correlationId,
        },
      });
    } catch {
      // Falla silenciosa intencional — se podría enviar a un dead-letter/log externo.
    }
  }
}
