# syntax=docker/dockerfile:1

# Base image for Node 22 (Debian-based)
FROM node:22-bullseye-slim AS base

# 1. Dependencies stage
FROM base AS deps
WORKDIR /app
# Install dependencies needed for node-gyp or similar if required
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*
COPY product/package.json product/package-lock.json ./product/
WORKDIR /app/product
RUN npm ci

# 2. Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/product/node_modules ./product/node_modules
COPY product/ ./product/
WORKDIR /app/product
# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# 3. Runner stage
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Create a non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Set correct ownership and copy output
COPY --from=builder /app/product/public ./product/public
COPY --from=builder --chown=nextjs:nodejs /app/product/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/product/.next/static ./product/.next/static

# Switch to the non-root user
USER nextjs

EXPOSE 3000

# Exec-form CMD
CMD ["node", "server.js"]
