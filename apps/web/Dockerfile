# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/web/package.json apps/web/

RUN pnpm install --frozen-lockfile --filter web

COPY apps/web apps/web
RUN pnpm --filter web build

# ---- Servido por Nginx: assets estáticos con cache de largo plazo ----
FROM nginx:1.27-alpine AS runner
COPY infra/nginx/web.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s CMD wget -q --spider http://localhost/ || exit 1
