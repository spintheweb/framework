# Webspinner Docker Image
# Multi-stage build for optimized production image

# Stage 1: Base image with Deno
FROM denoland/deno:debian-1.46.3 AS base

# Set working directory
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps

# Copy only files needed to resolve and cache dependencies
COPY deno.json deno.lock ./
COPY stwSpinner.ts ./

# Cache and verify dependencies using the lockfile (Deno v2: --lock writes/updates)
RUN deno cache --lock=deno.lock stwSpinner.ts \
  && deno cache --lock=deno.lock --frozen stwSpinner.ts

# Stage 3: Application
FROM base AS app

# Copy everything from deps stage
COPY --from=deps /app /app
COPY --from=deps /deno-dir /deno-dir

# Copy application files
COPY stwSpinner.ts ./
COPY stwComponents ./stwComponents
COPY stwContents ./stwContents
COPY stwElements ./stwElements
COPY stwStyles ./stwStyles
COPY webbaselets ./webbaselets
COPY public ./public
COPY LICENSE README.md ./

# Copy environment template (not actual .env with secrets)
COPY .env.example ./.env

# Create necessary directories
RUN mkdir -p public/.data \
    && mkdir -p .cert

# Set permissions
RUN chown -R deno:deno /app

# Switch to non-root user
USER deno

# Expose port (default 8080, override with ENV)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD deno eval "try { await fetch('http://localhost:' + (Deno.env.get('PORT') || '8080')); Deno.exit(0); } catch { Deno.exit(1); }"

# Set default environment variables
ENV HOST=0.0.0.0
ENV PORT=8080
ENV ALLOW_DEV=false
ENV SPINNER_ENV=docker

# Entry point
CMD ["deno", "run", "--allow-net", "--allow-read", "--allow-env", "stwSpinner.ts"]
