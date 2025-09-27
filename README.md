![status: work in progress](https://img.shields.io/badge/status-WIP-yellow)

# Webspinner

Webspinner is the interpreter and runtime of WBDL (Webbase Description Language).

For the language and architecture details, see the LaTeX book: https://github.com/spintheweb/book

## Deployments

Webspinner can be deployed in three ways:

1. Regular server deployment via GitHub Releases (production-friendly)
2. Docker Hub container `spintheweb/webspinner` (bundled MySQL for quick start)
3. Foundation sandbox at `sandbox.spintheweb.org` (full playground; internal use)

See `deployments/README.md` for details and guidance on choosing the right option. For Docker usage and compose files, see `deployments/docker/`. For the sandbox stack, see `deployments/sandbox/README.md` (internal use).

## Project structure

- `public/` — The web site (portal) interpreted by Webspinner. This is where your portal lives: `index.html`, `favicon.ico`, `robots.txt`, client scripts in `public/scripts/` (for example, `stwClient.js`), styles in `public/styles/`, and media in `public/media/`.
- `stwSpinner.ts` — Webspinner entrypoint (Deno). Runs the engine that interprets the portal from `public/`.
- `stwComponents/` — Core platform modules (datasources, router, security, session, WebSocket, studio) and DB adapters.
- `stwContents/` — Built-in content types/widgets (forms, tables, charts, maps, trees, code editor, etc.).
- `stwElements/` — Fundamental WBDL entities such as Site, Page, Content, and Element.
- `stwStyles/` — Component CSS sources. These are merged/minified for distribution (see `tasks/merge-css.ts`).
- `tasks/` — Deno scripts for development tooling (dev server, CSS merge, minify, headers). The VS Code task “Watch and merge CSS” uses these.
- `deployments/` — All deployment assets:
	- `deployments/docker/` — Dockerfile, Compose stack, and Caddyfile for quickstart and CI builds.
	- `deployments/sandbox/` — Full sandbox stack with databases and admin tools.
	- `deployments/server/` — Production run/upgrade helper scripts.
- `schemas/` — WBML schemas and related specs.
- `webbaselets/` — Sample WBDL bundles for common/studio scenarios.
- `tests/` — Automated tests for engine and language components.
- `wiki/` — Architecture, language, and operations documentation.

## Security

If you discover a vulnerability, please email security@spintheweb.org. See SECURITY.md for our policy. Our public contact per RFC 9116 is available at `/.well-known/security.txt` on deployed instances.

