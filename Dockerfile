# syntax=docker/dockerfile:1

ARG NODE_VERSION=22-slim

# ——— Dependencies ———
FROM node:${NODE_VERSION} AS dependencies
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ——— Build ———
FROM node:${NODE_VERSION} AS builder
WORKDIR /app

COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# ——— Runtime ———
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
# Used by deploy and Hexlet checks; override at runtime with -e PORT=...
ENV PORT=3000

RUN mkdir .next && chown node:node .next

COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static

USER node

EXPOSE 3000

# standalone server.js reads PORT / HOSTNAME from the environment
CMD ["node", "server.js"]
