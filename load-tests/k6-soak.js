import http from "k6/http";
import { check, sleep } from "k6";

/**
 * Soak test: carga moderada pero SOSTENIDA por mucho más tiempo que una
 * prueba normal. El objetivo es detectar problemas que solo aparecen con
 * el tiempo: fugas de memoria en el proceso Node, conexiones de Postgres
 * que no se liberan, crecimiento descontrolado de la cola de Redis, jobs
 * de BullMQ que se acumulan más rápido de lo que el worker los procesa.
 *
 * Ejecutar contra un ambiente de staging, no producción, y observar el
 * uso de memoria/CPU de cada contenedor durante la corrida completa
 * (docker stats, o el dashboard de tu proveedor cloud).
 */
export const options = {
  stages: [
    { duration: "2m", target: 50 },
    { duration: "26m", target: 50 }, // sostenido ~30 min; en un soak real, extender a 2-4h
    { duration: "2m", target: 0 },
  ],
  thresholds: {
    http_req_duration: ["p(95)<1000"], // si la latencia crece con el tiempo, hay una fuga
    http_req_failed: ["rate<0.01"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost";

export default function () {
  const res = http.get(`${BASE_URL}/api/v1/health/ready`);
  check(res, { "readiness estable durante toda la corrida": (r) => r.status === 200 });
  sleep(1);
}
