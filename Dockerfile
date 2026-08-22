# 1. Base image
# @google-cloud/firestore@9 (real Memory Bank persistence on Cloud Run —
# packages/agent/src/memory/) declares "engines": { "node": ">=22" }. npm
# only warns rather than hard-failing on that, but running it for real
# under Node 20 is an unnecessary gamble — Node 22 is current LTS anyway.
FROM node:22-alpine AS base

# 2. Dependencies
# npm workspaces needs every workspace's package.json present (not just the
# root) to resolve package-lock.json correctly, even though no workspace
# source is copied in yet.
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/agent/package.json packages/agent/package.json
COPY apps/web/package.json apps/web/package.json
RUN npm ci

# 3. Builder
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED 1
# Builds packages/agent first (apps/web imports its compiled dist/), then
# apps/web itself. See root package.json's "build" script.
RUN npm run build

# 4. Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# outputFileTracingRoot (apps/web/next.config.ts) makes Next trace from the
# monorepo root, so standalone output preserves the apps/web/ prefix instead
# of flattening to repo root — see that file's comment for why.
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "apps/web/server.js"]
