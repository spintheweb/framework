## Spin the Web – Docker Quickstart

This container runs the Deno-based Web Spinner. You can start developing a portal by setting a single environment variable: PORTAL_URL.

The companion reverse proxy (Caddy) is configured via SITE_DOMAIN, so you can serve your instance under your own domain (e.g., sandbox.spintheweb.org).

### Build the image

```bash
docker build -t spintheweb:dev .
```

### Run with docker compose (recommended)

Pass the portal URL at run time; the container fetches it and stores it under `SITE_WEBBASE`.

```bash
PORTAL_URL=https://example.com/webapplication.wbdl docker compose up --build
```

Alternatively, set PORTAL_URL in an `.env` file next to `docker-compose.yml`.

To expose the service on a specific domain via Caddy, also set `SITE_DOMAIN`:

```bash
SITE_DOMAIN=sandbox.spintheweb.org PORTAL_URL=https://example.com/webapplication.wbdl docker compose up --build
```

### Run with docker directly

```bash
docker run --rm -e PORTAL_URL=https://example.com/webapplication.wbdl -p 8080:8080 --name spintheweb spintheweb:dev
```

If you already have a local webbase JSON, you can mount it and skip `PORTAL_URL`:

```bash
docker run --rm -v %cd%/public/.data/webapplication.wbdl:/app/public/.data/webapplication.wbdl -e SITE_WEBBASE=./public/.data/webapplication.wbdl -p 8080:8080 --name spintheweb spintheweb:dev
```

Notes:
- Default port is 8080; the container binds to 0.0.0.0 and respects `PORT`.
- In Docker the app reads `.env.docker`; outside it reads `.env`.
- If `DEBUG=true`, live-reload of webbase files is enabled.

### Publish to Docker Hub

Replace `spintheweb/webspinner` with your own registry/repo if needed.

```bash
# Tag the image built locally as latest (or a version)
docker tag spintheweb:dev spintheweb/webspinner:latest

# Or tag with a version
docker tag spintheweb:dev spintheweb/webspinner:v1.0.0

# Login (one-time)
docker login

# Push
docker push spintheweb/webspinner:latest
# docker push spintheweb/webspinner:v1.0.0
```

### Run from Docker Hub

```bash
docker run --rm \
	-e PORTAL_URL=https://example.com/webapplication.wbdl \
	-p 8080:8080 \
	--name webspinner \
	spintheweb/webspinner:latest
```

With Caddy via docker compose, create an `.env` file:

```
SITE_DOMAIN=sandbox.spintheweb.org
PORTAL_URL=https://example.com/webapplication.wbdl
```

Then:

```bash
docker compose up --build -d
```