# Spin the Web — Deployment

Simplified deployment with two explicit modes:

- docker.sh — Docker: pull/run the official image; can also build/push/export
- server.sh — Native Linux server: wrapper that runs a local self-extracting installer or fetches the latest
- build-server.sh — Maintainer tool to produce the self-extracting installer into release/
- release/ — Generated artifacts (self-extracting installer and checksum)

## Install (end users)

Choose your mode

```bash
# Docker (containerized runtime)
bash deployment/docker.sh

What the Docker setup includes:
- App runtime on container port 8080 (host port configurable via --port)
- Persistent data via host bind: ./webspinner-data -> /app/.data
- App configuration via environment variables (PORT, SITE_ROOT, SITE_WEBBASE, COMMON_WEBBASE, STUDIO_WEBBASE)

Notes:
- For TLS and reverse proxy, run behind nginx/Traefik/Caddy in your Docker stack.
- For databases, pair with a managed DB or a Dockerized PostgreSQL service.

# Native Linux server
sudo bash deployment/server.sh
```

Notes:
- The server installer (server.sh) can be bundled in the release under scripts/. If not present, use the wrapper in this repo to fetch the latest.
- Docker mode binds ./webspinner-data on the host to /app/.data in the container by default and maps localhost:8080.

## Build the release bundle (maintainers)

Create a single stack ZIP with both installers and docs:

```bash
deno task release
# or: deno run --allow-read --allow-write --allow-run ./tasks/release.ts --version v1.0.0
```

Outputs to: deployment/release/webspinner-stack-<version>.zip (+ .sha256)

Bundle contents:
- docker.sh, server.sh (self-extracting installer, if built)
- Dockerfile, docker-compose.yml
- docs/README.md (this file) and top-level README.md

## Repository links

- Repo: https://github.com/spintheweb/webspinner
- Releases: https://github.com/spintheweb/webspinner/releases

