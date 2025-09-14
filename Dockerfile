### STAGE 1: Build ###
FROM denoland/deno:alpine AS builder

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

WORKDIR /app

# Set an environment variable to identify the container environment
ENV SPINNER_ENV=docker

# This user is created in the base image and is non-root
USER deno

# Copy application files from the builder stage, setting ownership to the 'deno' user.
COPY --chown=deno:deno --from=builder /app .

# Copy the Deno dependency cache, also setting ownership. This is the critical fix.
COPY --chown=deno:deno --from=builder /deno-dir /deno-dir/

# Expose the ports your application listens on
EXPOSE 443
EXPOSE 80

# Define the command to run your application.
# Grant read access to the entire application directory './' and write access for saving portal webbase JSON.
# This is safe inside the container.
CMD ["run", "--allow-net", "--allow-read=./", "--allow-write=./", "--allow-env", "stwSpinner.ts"]