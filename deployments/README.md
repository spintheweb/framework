# Webspinner Deployment

Production-ready deployment tools and documentation for Webspinner.

## Directory Structure

```
deployments/
├── README.md          # Deployment overview
├── scripts/           # Release generators
│   ├── webspinner.sh # ZIP release
│   ├── docker.sh     # Docker release
│   └── server.sh     # Server installer generator
├── docs/              # Documentation
│   ├── WEBSPINNER.md # ZIP release docs
│   ├── DOCKER.md     # Docker docs
│   └── SERVER.md     # Server installer docs
└── release/           # Generated artifacts (gitignored)
```

## Release Types

### 1. Webspinner (ZIP)

**Purpose:** Development, evaluation, manual deployment

**Generate:**
```bash
./deployments/scripts/webspinner.sh
```

**Output:**
- `webspinner-v3.1.4.zip`
- `webspinner-v3.1.4.zip.sha256`

**Install:**
```bash
unzip webspinner-v3.1.4.zip
cd webspinner
deno run --allow-all stwSpinner.ts
```

**Docs:** [docs/WEBSPINNER.md](docs/WEBSPINNER.md)

---

### 2. Docker (Container)

**Purpose:** Kubernetes, cloud platforms, containers

**Generate:**
```bash
./deployments/scripts/docker.sh
```

**Output:**
- Docker Hub: `spintheweb/webspinner:3.1.4`, `:latest`
- Offline: `webspinner-docker-v3.1.4.tar.gz`

**Install:**
```bash
docker pull spintheweb/webspinner:latest
docker run -d -p 8080:8080 spintheweb/webspinner:latest
```

**Docs:** [docs/DOCKER.md](docs/DOCKER.md)

---

### 3. Server (Installer)

**Purpose:** Production Linux servers with automated setup

**Generate:**
```bash
./deployments/scripts/server.sh
```

Creates self-extracting installer with:
- Complete Webspinner runtime
- Deno auto-installer
- nginx + Let's Encrypt + PostgreSQL
- Systemd service configuration
- Upgrade detection

**Output:**
- `webspinner-server.sh` (overwrites previous)
- `webspinner-server.sh.sha256`

**Install:**
```bash
wget https://github.com/spintheweb/webspinner/releases/latest/download/webspinner-server.sh
chmod +x webspinner-server.sh
sudo ./webspinner-server.sh
```

**What Happens:**
1. Updates system packages
2. Installs Deno, nginx, certbot, PostgreSQL
3. Prompts for installation directory and domain
4. Configures nginx reverse proxy
5. Obtains Let's Encrypt SSL certificate
6. Creates PostgreSQL database with random password
7. Creates and starts systemd service

**Result:**
- Public: `https://yourdomain.com` (nginx port 443)
- Internal: Webspinner on `localhost:8080`
- Database: PostgreSQL on `localhost:5432`
- Service: `systemctl status webspinner`

**Docs:** [docs/SERVER.md](docs/SERVER.md)

---

## References

- Repository: https://github.com/spintheweb/webspinner
- Issues: https://github.com/spintheweb/webspinner/issues
- Releases: https://github.com/spintheweb/webspinner/releases
- Live Demo: https://labs.spintheweb.org

