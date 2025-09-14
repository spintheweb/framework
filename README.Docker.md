## Spin the Web – Docker Quickstart

This container runs the Deno-based Web Spinner for local development. You can start developing a portal by setting a single environment variable: PORTAL_URL.

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