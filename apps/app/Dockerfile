# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

# Copy necessary files for dependency installation
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY package.json ./
COPY turbo.json ./
COPY apps/app/package.json ./apps/app/
COPY packages/ui/package.json ./packages/ui/

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy application source code
COPY apps/app/ ./apps/app/
COPY packages/ui/ ./packages/ui/

# Environment variables for build
ARG VITE_ENVIRONMENT

ENV VITE_ENVIRONMENT=$VITE_ENVIRONMENT

# Build the UI package and the app
RUN pnpm turbo run build --filter=ui --filter=app

# Runtime stage
FROM nginx:alpine

# Copy built app from builder stage
COPY --from=builder /app/apps/app/dist /usr/share/nginx/html

# Copy custom nginx configuration
COPY --from=builder /app/apps/app/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]