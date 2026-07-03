# =============================================================
# Worker Service Dockerfile — Multi-stage
# =============================================================

# ---- Stage 1: Base ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ---- Stage 2: Production Dependencies ----
FROM base AS prod-deps
# Context is the repo root. Copy worker dependencies.
COPY worker/package.json worker/package-lock.json* ./
RUN npm install --omit=dev

# ---- Stage 3: All Dependencies ----
FROM base AS deps
COPY worker/package.json worker/package-lock.json* ./
RUN npm install

# ---- Stage 4: Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
# Copy worker source files
COPY worker/package.json ./
COPY worker/tsconfig.json ./
COPY worker/src ./src
# Copy Prisma schema from backend (shared schema)
COPY backend/prisma ./prisma
RUN npx prisma generate
RUN npm run build

# ---- Stage 5: Runner ----
FROM base AS runner
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 workeruser

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Copy generated Prisma engine/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY worker/package.json ./

USER workeruser

# Graceful shutdown: Docker sends SIGTERM, worker drains current jobs
STOPSIGNAL SIGTERM

CMD ["node", "dist/index.js"]
