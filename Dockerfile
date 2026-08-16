# ============================================================
# Cinevo Viral Bot — Dockerfile
#
# Multi-stage build:
#   1. Install dependencies and compile TypeScript.
#   2. Copy only production artifacts into a slim runtime image.
#
# Build:   docker build -t cinevo-viral-bot .
# Run:     docker run --env-file .env cinevo-viral-bot
# ============================================================

# ---- Stage 1: Build ----
FROM node:20-alpine AS build

WORKDIR /app

# Copy package manifests first for better layer caching.
COPY package.json package-lock.json* ./

# Install all dependencies (including dev) for building.
RUN npm ci || npm install

# Copy source and config.
COPY tsconfig.json ./
COPY src ./src

# Compile TypeScript to dist/.
RUN npm run build

# ---- Stage 2: Runtime ----
FROM node:20-alpine AS runtime

WORKDIR /app

# Set NODE_ENV for production optimizations.
ENV NODE_ENV=production

# Copy package manifests.
COPY package.json package-lock.json* ./

# Install only production dependencies.
RUN npm ci --omit=dev || npm install --omit=dev

# Copy compiled output from the build stage.
COPY --from=build /app/dist ./dist

# Create directories for logs and output.
RUN mkdir -p /app/logs /app/output

# Run as a non-root user for security.
RUN addgroup -S app && adduser -S app -G app
USER app

# Declare the volume for generated content and logs.
VOLUME ["/app/output", "/app/logs"]

# Start the bot.
CMD ["node", "dist/index.js"]
