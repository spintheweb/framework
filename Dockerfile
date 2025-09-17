### STAGE 1: Build ###
FROM denoland/deno:alpine AS builder

# Accept build-time version (fallback to deno.json version via build workflow)
ARG APP_VERSION="dev"
ENV APP_VERSION=${APP_VERSION}

WORKDIR /app

# Copy only dependency-related files first to leverage Docker caching
COPY deno.json .
COPY stwSpinner.ts .
# Cache dependencies. This step is re-run only if deno.json or stwSpinner.ts change.
RUN deno cache stwSpinner.ts

# Copy the rest of the application files
COPY . .

### STAGE 2: Runtime ###
FROM denoland/deno:alpine AS runtime

# Re-declare ARG to use at label time
ARG APP_VERSION="dev"
ENV APP_VERSION=${APP_VERSION}

WORKDIR /app

# Set environment variables to identify the container environment & version
ENV SPINNER_ENV=docker \
	SPINNER_VERSION=${APP_VERSION}

# This user is created in the base image and is non-root
USER deno

# Copy application files from the builder stage, setting ownership to the 'deno' user.
COPY --chown=deno:deno --from=builder /app .

# Copy the Deno dependency cache, also setting ownership. This is the critical fix.
COPY --chown=deno:deno --from=builder /deno-dir /deno-dir/

# Expose the ports your application listens on (HTTP / HTTPS)
EXPOSE 80 443

# OCI compliant labels for better metadata in registries (GHCR)
LABEL org.opencontainers.image.title="WebSpinner" \
			org.opencontainers.image.description="WebSpinner Deno-based web portal framework sandbox container" \
			org.opencontainers.image.version="${APP_VERSION}" \
			org.opencontainers.image.url="https://github.com/spintheweb/webspinner" \
			org.opencontainers.image.source="https://github.com/spintheweb/webspinner" \
			org.opencontainers.image.revision="${GIT_COMMIT_SHA:-unknown}" \
			org.opencontainers.image.licenses="MIT"

# Optional: basic healthcheck hitting root (customize if app has /health)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
	CMD wget -q -O /dev/null http://localhost:80/ || exit 1

# Define the command to run your application.
# Grant read access to the entire application directory './' and write access for saving portal webbase JSON.
# This is safe inside the container.
CMD ["run", "--allow-net", "--allow-read=./", "--allow-write=./", "--allow-env", "stwSpinner.ts"]