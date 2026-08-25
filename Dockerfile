# Multi-stage Dockerfile for React/Vite Frontend
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy frontend source code and build for production
COPY . .
RUN npm run build

# Stage 2: Serve static files via Caddy
FROM caddy:2-alpine
COPY --from=build /app/dist /srv
COPY Caddyfile /etc/caddy/Caddyfile