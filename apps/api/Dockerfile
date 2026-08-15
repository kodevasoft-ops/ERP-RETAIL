# syntax=docker/dockerfile:1

# ---- Etapa 1: dependencias + build ----
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml* ./
COPY apps/api/package.json apps/api/
COPY packages/database/package.json packages/database/

RUN pnpm install --frozen-lockfile --filter api... --filter database

COPY packages/database packages/database
COPY apps/api apps/api

RUN pnpm --filter database db:generate
RUN pnpm --filter api build

# ---- Etapa 2: imagen de producción ----
FROM node:20-alpine AS runner
WORKDIR /app
RUN corepack enable && apk add --no-cache dumb-init

# Usuario no-root — nunca correr el proceso como root en producción.
RUN addgroup -g 1001 nodejs && adduser -S nestjs -u 1001

ENV NODE_ENV=production

COPY --from=builder --chown=nestjs:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/packages/database/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nestjs:nodejs /app/apps/api/package.json ./package.json

USER nestjs

EXPOSE 3000

# dumb-init: reenvía señales (SIGTERM) correctamente para shutdown graceful
# real durante despliegues — sin esto, Docker mata el proceso a la fuerza
# tras el timeout en vez de dejarlo cerrar conexiones limpiamente.
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]
