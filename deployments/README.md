# Webspinner Deployments

This project supports three deployment tracks to suit different needs:

## 1) Regular Server Deployment (Releases)
- Audience: Operators deploying Webspinner on their own server/VM.
- Distribution: GitHub Releases from this repository.
- Contents: Webspinner runtime, docs, and versioned artifacts.
- Notes: Production-friendly; integrates with your existing infrastructure (systemd, reverse proxy, databases).

Start here if you manage your own stack and want a stable, versioned package.

## 2) Docker Hub Container: `spintheweb/webspinner`
- Audience: Users who want a self-contained container with Webspinner + MySQL.
- Registry: Docker Hub (`spintheweb/webspinner`).
- Contents: Pre-baked runtime with MySQL for quick trials and simple deployments.
- Notes: Great for demos, local eval, or single-node hosting. Bring-your-own persistence and backup strategy.

Pull and run:
```bash
# Webspinner + bundled MySQL container
docker pull spintheweb/webspinner:latest
```

Detailed Docker quickstart, compose, and Caddy examples live in `deployments/docker/` (moved from the repo root to keep things tidy).

## 3) Sandbox Deployment: `sandbox.spintheweb.org`
- Audience: Internal Spin the Web Foundation environment and invited testers.
- Location: Raspberry Pi stack managed by the Foundation.
- Contents: Full playground with Webspinner + multiple datasources, Adminer, Portainer, and Caddy.
- Notes: Not a general-purpose distribution; tailored for learning, experimentation, and demos.

See `deployments/sandbox/README.md` for architecture and operations details.

---

## Choosing the Right Path
- Want a production install on your infra? Use Releases.
- Want a quick container-based start with built-in DB? Use the Docker Hub image.
- Want to explore the full framework playground? Request access to the sandbox.

---

## Access model (sandbox)

The sandbox at `sandbox.spintheweb.org` follows a strict exposure model:

- Public: Only the Webspinner runtime via Caddy/TLS at `https://sandbox.spintheweb.org`.
- Local-only on the host (127.0.0.1): Databases (MySQL, PostgreSQL, SQL Server, MongoDB, Oracle) and admin UIs (Adminer, Portainer).
- Remote admin: Use SSH tunnels to reach local-only ports from your machine, for example:

```bash
# From your machine to the Pi host
ssh -N -L 8081:127.0.0.1:8081 pi@sandbox.spintheweb.org   # Adminer
ssh -N -L 9000:127.0.0.1:9000 pi@sandbox.spintheweb.org   # Portainer
ssh -N -L 3306:127.0.0.1:3306 pi@sandbox.spintheweb.org   # MySQL (repeat for 5432, 1433, 27017, 1521 as needed)
```

This ensures the playground’s databases and admin tools are not exposed on the public internet.
