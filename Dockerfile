# syntax=docker/dockerfile:1

# Base image for Node 22 (Debian-based)
FROM node:22-bullseye-slim@sha256:5736e7ef1f3f2109be7ef8aea0cbdf931804aee9a18c6760507b8ded078b25a9 AS base

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
ENV DOTWV_PUBLIC_SUPABASE_URL="http://localhost:8000"
ENV DOTWV_PUBLIC_SUPABASE_ANON_KEY="dummy-anon-key"
ENV DOTWV_SERVER_SUPABASE_URL="http://localhost:8000"
ENV SUPABASE_SERVICE_ROLE_KEY="dummy-service-key"
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
COPY --from=builder /app/product/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/product/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/product/.next/static ./.next/static

# Switch to the non-root user
USER nextjs

EXPOSE 3000

# Exec-form CMD
CMD ["node", "server.js"]
