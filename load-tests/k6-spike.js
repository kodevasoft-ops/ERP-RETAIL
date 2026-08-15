import http from "k6/http";
import { check, sleep } from "k6";

/**
 * Spike test: sube de 10 a 300 usuarios en 10 segundos (un pico repentino,
 * no gradual — simula una promoción que se viraliza o una campaña que
 * dispara tráfico de golpe). El objetivo no es que todo responda rápido,
 * es que el sistema NO SE CAIGA ni empiece a devolver 500 en cascada.
 */
export const options = {
  stages: [
    { duration: "10s", target: 10 },
    { duration: "10s", target: 300 }, // pico súbito
    { duration: "30s", target: 300 }, // sostiene el pico
    { duration: "10s", target: 10 },  // baja tan rápido como subió
    { duration: "10s", target: 0 },
  ],
  thresholds: {
    http_req_failed: ["rate<0.05"], // hasta 5% de degradación es aceptable en un pico extremo; más que eso es una caída real
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost";

export default function () {
  const res = http.get(`${BASE_URL}/health`);
  check(res, { "el sistema sigue respondiendo durante el pico": (r) => r.status === 200 });
  sleep(0.5);
}
