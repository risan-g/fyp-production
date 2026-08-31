# syntax=docker/dockerfile:1

# Base image for Node 22 (Debian-based)
FROM node:22.23.2-bookworm-slim@sha256:83f487e0a63425e5b4d146fb5e5be574bcbe1b7b843d3ebafdd95eaf7767a7e5 AS base

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
ENV NEXT_PUBLIC_SUPABASE_URL="http://localhost:8000"
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY="dummy-anon-key"
RUN npm run build

# 3. Runner stage
FROM base AS runner
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
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
