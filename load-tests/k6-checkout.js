import http from "k6/http";
import { check, sleep } from "k6";

// Simula 100 usuarios activos concurrentes durante 3 minutos, con rampa
// de subida y bajada para no golpear el sistema de un solo salto (más
// realista y evita falsos negativos por saturación instantánea del pool).
export const options = {
  stages: [
    { duration: "30s", target: 25 },   // calentamiento
    { duration: "30s", target: 100 },  // rampa a carga objetivo
    { duration: "2m", target: 100 },   // carga sostenida: 100 usuarios concurrentes
    { duration: "30s", target: 0 },    // enfriamiento
  ],
  thresholds: {
    http_req_duration: ["p(95)<800", "p(99)<2000"], // 95% de requests bajo 800ms
    http_req_failed: ["rate<0.01"], // menos de 1% de errores
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost";

export default function () {
  // 1. Login
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({
      email: "admin@demo.com",
      password: "Admin123!",
      empresaId: __ENV.EMPRESA_ID,
    }),
    { headers: { "Content-Type": "application/json" } },
  );

  check(loginRes, {
    "login exitoso": (r) => r.status === 200,
    "login responde rápido": (r) => r.timings.duration < 1000,
  });

  if (loginRes.status !== 200) {
    sleep(1);
    return;
  }

  const token = JSON.parse(loginRes.body).accessToken;
  const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

  // 2. Listar productos (endpoint de lectura pesada, cacheado)
  const productosRes = http.get(`${BASE_URL}/api/v1/productos?page=1&limit=20`, { headers });
  check(productosRes, { "productos responde 200": (r) => r.status === 200 });

  // 3. Dashboard de reportes (agregaciones)
  const dashboardRes = http.get(`${BASE_URL}/api/v1/reportes/dashboard`, { headers });
  check(dashboardRes, { "dashboard responde 200": (r) => r.status === 200 });

  sleep(Math.random() * 2 + 1); // simula tiempo de lectura humano entre acciones
}

/**
 * Ejecutar:
 *   k6 run --env BASE_URL=http://localhost --env EMPRESA_ID=<uuid> load-tests/k6-checkout.js
 *
 * Qué observar en el resultado:
 *   - http_req_failed debe quedar bajo 1% (si sube, algo se está cayendo)
 *   - p(95) de http_req_duration bajo 800ms confirma que el sistema
 *     sigue siendo "fluido" bajo 100 usuarios concurrentes, no solo que
 *     "no se cae".
 */
