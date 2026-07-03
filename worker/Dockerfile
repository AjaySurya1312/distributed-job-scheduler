# =============================================================
# Worker Service Dockerfile — Multi-stage
# =============================================================

FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci --only=production && cp -R node_modules /app/prod_node_modules
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Copy Prisma schema from backend (shared schema)
COPY ../backend/prisma ./prisma
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 workeruser

COPY --from=deps /app/prod_node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY package.json ./

USER workeruser

# Workers don't expose ports — they connect outbound to Redis + PG
# Graceful shutdown: Docker sends SIGTERM, worker drains current jobs
STOPSIGNAL SIGTERM

CMD ["node", "dist/index.js"]
