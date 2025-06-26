### STAGE 1: Build ###
FROM denoland/deno:distroless as builder

WORKDIR /app

# Copy only dependency-related files first to leverage Docker caching
COPY deno.json .
COPY stwSpinner.ts .
# Cache dependencies. This step is re-run only if deno.json or stwSpinner.ts change.
RUN deno cache stwSpinner.ts

# Copy the rest of the application files, EXCLUDING the public directory
COPY stwComponents ./stwComponents
COPY stwContents ./stwContents
COPY stwElements ./stwElements
COPY webbaselets ./webbaselets
COPY .cert ./.cert
COPY .env .

### STAGE 2: Runtime ###
FROM denoland/deno:distroless

WORKDIR /app

# Copy only the necessary application files from the builder stage
COPY --from=builder /app .
# Copy the Deno cache from the builder stage
COPY --from=builder /deno-dir/ /deno-dir/

# Expose the ports your application listens on
EXPOSE 443
EXPOSE 8000

# This user is created in the base image and is non-root
USER deno

# Define the command to run your application.
CMD ["run", "--allow-net", "--allow-read", "--allow-env", "stwSpinner.ts"]