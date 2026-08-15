import { Injectable } from "@nestjs/common";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";

export interface ExportJobData {
  tipo: string; // "ventas-por-dia" | "top-productos" | "inventario-valorizado" | etc.
  formato: "xlsx" | "pdf";
  empresaId: string;
  usuarioId: string;
  params: Record<string, string>;
}

@Injectable()
export class ExportQueueService {
  constructor(@InjectQueue("exportes") private readonly queue: Queue<ExportJobData>) {}

  /**
   * Encola el job y devuelve su ID de inmediato — el request HTTP no
   * espera a que ExcelJS/PDFKit terminen de generar el archivo. Bajo
   * carga (varios exports simultáneos + tráfico normal del POS), esto
   * evita que la generación de reportes robe ciclos de CPU al resto
   * de las requests del proceso Node.
   */
  async encolar(data: ExportJobData) {
    const job = await this.queue.add("generar-reporte", data, {
      attempts: 2,
      backoff: { type: "exponential", delay: 2000 },
      removeOnComplete: { age: 3600 }, // limpia resultados tras 1h
      removeOnFail: { age: 86400 },
    });
    return { jobId: job.id };
  }

  async estado(jobId: string) {
    const job = await this.queue.getJob(jobId);
    if (!job) return { estado: "no_encontrado" as const };

    const estado = await job.getState();
    if (estado === "completed") {
      return { estado: "completado" as const, resultado: job.returnvalue };
    }
    if (estado === "failed") {
      return { estado: "fallido" as const, error: job.failedReason };
    }
    return { estado: "procesando" as const };
  }
}
