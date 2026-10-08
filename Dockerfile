# syntax=docker/dockerfile:1

# --- Base -------------------------------------------------------------------
FROM node:20-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# --- Deps: locked dependencies, re-used until the lockfile changes ----------
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- Builder: production build (NEXT_PUBLIC_* baked in at build time) -------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
RUN npm run build

# --- Runner: standalone output only (docs: next.config output "standalone") -
FROM base AS runner
ENV NODE_ENV=production \
    HOSTNAME="0.0.0.0" \
    PORT=3000
# server.js serves ./public and ./.next/static automatically once copied here
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://127.0.0.1:3000/', (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

CMD ["node", "server.js"]
