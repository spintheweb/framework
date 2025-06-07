FROM denoland/deno:alpine

# The port that your application listens to.
EXPOSE 80

WORKDIR /app

# Copy files as root
COPY . .

# Compile the main app as root (can write lockfile)
RUN deno cache --lock=deno.lock stwSpinner.ts stwElements/*.ts

# Prefer not to run as root.
RUN chown -R deno:deno /app
USER deno

CMD ["run", "--no-lock", "--allow-net", "--allow-read", "--allow-env", "--env-file", "--allow-import", "stwSpinner.ts"]