# =============================================================
# Distributed Job Scheduler — Backend Dockerfile
# =============================================================

# ---- Stage 1: Base ----
FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ---- Stage 2: Production Dependencies ----
FROM base AS prod-deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# ---- Stage 3: All Dependencies ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

# ---- Stage 4: Builder ----
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client
RUN npx prisma generate
# Build TypeScript
RUN npm run build

# ---- Stage 5: Runner ----
FROM base AS runner
# Security: run as non-root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressuser

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
# Copy generated Prisma engine/client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY prisma ./prisma
COPY package.json ./

USER expressuser
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Run migrations then start server
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
