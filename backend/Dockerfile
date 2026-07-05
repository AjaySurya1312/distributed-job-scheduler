# =============================================================
# Distributed Job Scheduler — Backend Dockerfile
# =============================================================
# Prisma on Alpine requires openssl (libssl) at runtime.
# The binaryTarget "linux-musl-openssl-3.0.x" in schema.prisma
# ensures the correct engine binary is generated during build.
# prisma generate is ONLY executed in the builder stage.
# The runner CMD never calls prisma generate.
# =============================================================

# ---- Stage 1: Base ----
FROM node:20-alpine AS base
WORKDIR /app
# libc6-compat: needed by some native Node modules
# openssl:      required by Prisma engine at runtime on Alpine
RUN apk add --no-cache libc6-compat openssl

# ---- Stage 2: Production Dependencies ----
FROM base AS prod-deps
COPY package.json package-lock.json* ./
RUN npm install --omit=dev

# ---- Stage 3: All Dependencies (includes prisma CLI for generate) ----
FROM base AS deps
COPY package.json package-lock.json* ./
RUN npm install

# ---- Stage 4: Builder ----
# Runs prisma generate (the ONLY place it must run) then compiles TS.
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate Prisma client for the host (native) AND linux-musl-openssl-3.0.x
# binaryTargets in schema.prisma ensures the Alpine engine binary is produced
RUN npx prisma generate
# Compile TypeScript → dist/
RUN npm run build

# ---- Stage 5: Runner ----
FROM base AS runner

# Security: run as non-root expressuser
RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 expressuser

WORKDIR /app

# 1. Production node_modules (no dev deps, smaller image)
COPY --from=prod-deps /app/node_modules ./node_modules

# 2. Compiled application
COPY --from=builder /app/dist ./dist

# 3. Prisma generated client — MUST come from builder so the
#    linux-musl-openssl-3.0.x engine binary is present
COPY --from=builder /app/node_modules/.prisma      ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma      ./node_modules/@prisma

# 4. Prisma schema (needed for migrate deploy at runtime)
COPY prisma ./prisma

# 5. package.json (needed for npm scripts resolution)
COPY package.json ./

# 6. Source files (needed for swagger-jsdoc to read @swagger comments)
COPY src ./src

# Fix ownership so expressuser can read all files
RUN chown -R expressuser:nodejs /app

USER expressuser

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/api/health || exit 1

# Runtime: wait for postgres, run migrations, start server.
# prisma generate is NOT and MUST NOT be here.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
