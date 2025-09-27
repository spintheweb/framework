### STAGE 1: Build ###
FROM denoland/deno:alpine AS builder

# Accept build-time version (fallback to deno.json version via build workflow)
ARG APP_VERSION="dev"
ARG GIT_COMMIT_SHA="unknown"
ENV APP_VERSION=${APP_VERSION}

WORKDIR /app

# Copy the whole app so local imports resolve during caching
COPY . .

# Cache dependencies
RUN deno cache stwSpinner.ts

### STAGE 2: Runtime ###
FROM denoland/deno:alpine AS runtime

# Re-declare ARG to use at label time
ARG APP_VERSION="dev"
ARG GIT_COMMIT_SHA="unknown"
ENV APP_VERSION=${APP_VERSION}

WORKDIR /app

# Set environment variables to identify the container environment & version
ENV SPINNER_ENV=docker \
	SPINNER_VERSION=${APP_VERSION}

# This user is created in the base image and is non-root
USER deno

# App + Deno cache
COPY --chown=deno:deno --from=builder /app .
COPY --chown=deno:deno --from=builder /deno-dir /deno-dir/

# Match Fly internal_port (8080)
EXPOSE 8080

# OCI compliant labels for better metadata in registries (GHCR)
LABEL org.opencontainers.image.title="WebSpinner" \
			org.opencontainers.image.description="WebSpinner Deno-based web portal framework sandbox container" \
			org.opencontainers.image.version="${APP_VERSION}" \
			org.opencontainers.image.url="https://github.com/spintheweb/webspinner" \
			org.opencontainers.image.source="https://github.com/spintheweb/webspinner" \
			org.opencontainers.image.revision="${GIT_COMMIT_SHA}" \
			org.opencontainers.image.licenses="MIT" \
			org.opencontainers.image.authors="ops@spintheweb.org" \
			org.opencontainers.image.vendor="Spin the Web" \
			org.opencontainers.image.documentation="https://github.com/spintheweb/webspinner#readme"

# Healthcheck using Deno (no wget/curl needed)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD deno eval --allow-net 'try{const r=await fetch("http://localhost:8080/"); Deno.exit(r.ok?0:1)}catch{Deno.exit(1)}'

# Define the command to run your application.
# Grant read access to the entire application directory './' and write access for saving portal webbase JSON.
# This is safe inside the container.
CMD ["run", "--allow-net", "--allow-read=./", "--allow-write=./", "--allow-env", "stwSpinner.ts"]
