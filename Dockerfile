# Multi-stage build using Next.js's standalone output (see output:
# "standalone" in next.config.ts). Produces a small runtime image that
# doesn't need the full node_modules tree or the Next.js CLI to run.
#
# Build:  docker build -t petnet .
# Run:    docker run -p 3000:3000 --env-file .env.production petnet
#
# Migrations are NOT run by this image — run `npm run db:migrate:deploy`
# as a separate step against DATABASE_URL before starting new containers,
# so multiple instances never race applying the same migration.

FROM node:22-alpine AS base

# ── deps ─────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci

# ── build ────────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Build-time env vars are NOT baked into the image beyond what Next.js
# needs to statically render — runtime secrets are supplied via `docker run
# --env-file` / your platform's env config, not at build time.
RUN npx prisma generate
RUN npm run build

# ── runtime ──────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Next's standalone file-tracing can miss Prisma's native query-engine
# binary — copy it explicitly so the runtime image can actually query Postgres.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
