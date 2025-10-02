# Webspinner Deployment

This directory contains all deployment-related files, scripts, and documentation for Webspinner.

**⚠️ Note:** Webspinner is in active development. Use these deployment scripts to test real-world deployment scenarios and discover missing features. All deployment types support **upgrade-aware installations** that preserve your data.

## System Webbaselets

All Webspinner deployments include two **critical system webbaselets** that are managed centrally by the project:

- **`stwStudio.wbdl`** - The Studio/management interface for portal administration
- **`stwCommon.wbdl`** - Fundamental contents and components useful to all portals

These webbaselets are **always replaced during upgrades** to ensure all portals benefit from improvements and bug fixes. They should be loaded by all portal applications.

**CDN Deployment:** Since these are centrally managed system webbaselets, they could be deployed to a CDN (e.g., `https://cdn.spintheweb.org/webbaselets/stwStudio.wbdl`) allowing all portals to load the latest versions directly from a central source without needing local updates.

Custom webbaselets created by users are stored in `public/.data/` alongside `webapplication.wbdl` and are **always preserved** during upgrades.

## Directory Structure

```
deployments/
├── README.md                     # This file (overview of all releases)
├── scripts/                      # Release automation scripts
│   ├── webspinner.sh            # Generic ZIP release
│   ├── docker.sh                # Docker container release
│   └── server.sh                # Linux server installer (upgrade-aware!)
├── docs/                         # Release documentation
│   ├── WEBSPINNER.md            # Webspinner release docs
│   ├── DOCKER.md                # Docker release docs
│   ├── SERVER.md                # Server installer docs
│   └── UPGRADE.md               # Upgrade procedures for all types
└── release/                      # Generated release artifacts (gitignored)
    ├── webspinner-v*.zip
    ├── webspinner-docker-v*.tar.gz
    └── webspinner-installer-v*.sh
```
    ├── webspinner-docker-v*.tar.gz
    └── webspinner-installer-v*.sh
```
```

## Release Types

Webspinner supports three release types for different deployment scenarios:

**Note:** `webspinner.sh` and `docker.sh` are **build/release tools** executed by maintainers to create releases. The `server.sh` script **generates an installer** that end users run on their servers.

### 1. Webspinner Release (ZIP Archive)

**Best for:** Development, evaluation, manual deployment, any OS with Deno

**Executed by:** Maintainers (locally)

**Create:**
```bash
./deployments/scripts/webspinner.sh
```

**What it does:**
1. Creates sanitized ZIP archive
2. Generates SHA256 checksum
3. Creates git tag
4. Creates GitHub Release

**Output:**
- `deployments/release/webspinner-v1.0.0.zip`
- `deployments/release/webspinner-v1.0.0.zip.sha256`
- GitHub Release with downloadable assets

**End users then:** Download ZIP from GitHub Releases, extract, and run

**Documentation:** [docs/WEBSPINNER.md](docs/WEBSPINNER.md)

---

### 2. Docker Release (Container)

**Best for:** Kubernetes, cloud platforms, containerized deployments

**Executed by:** Maintainers (locally)

**Create:**
```bash
./deployments/scripts/docker.sh
```

**What it does:**
1. Builds Docker image with multi-stage Dockerfile
2. Tags versions (`:1.0.0`, `:v1.0.0`, `:latest`)
3. **Pushes to Docker Hub** (spintheweb/webspinner)
4. Exports offline tar.gz archive
5. Creates GitHub Release (with offline archive)

**Output:**
- Docker Hub: `spintheweb/webspinner:1.0.0`, `:latest`
- GitHub Release: `webspinner-docker-v1.0.0.tar.gz` (for offline use)

**End users then:** Pull from Docker Hub or load offline archive

**Quick Start (for end users):**
```bash
docker pull spintheweb/webspinner:latest
docker run -d -p 8080:8080 spintheweb/webspinner:latest
```

**Documentation:** [docs/DOCKER.md](docs/DOCKER.md)

---

### 3. Server Release (Installer)

**Best for:** Production Linux servers, systemd-managed deployments

**Executed by:** End users (on their remote server/VM)

**Default Configuration:** labs.spintheweb.org:443 with HTTPS (customizable)

**Create (by maintainer):**
```bash
./deployments/scripts/server.sh
```

**What it does:**
1. Bundles complete Webspinner runtime
2. Creates self-extracting bash installer
3. Generates SHA256 checksum
4. Creates GitHub Release

**Output:**
- `deployments/release/webspinner-installer-v1.0.0.sh` (self-extracting)
- `deployments/release/webspinner-installer-v1.0.0.sh.sha256`
- GitHub Release with installer

**End users then:** Download installer and run on their server

**Install (by end user on remote server):**
```bash
# Download from GitHub
wget https://github.com/spintheweb/webspinner/releases/download/v1.0.0/webspinner-installer-v1.0.0.sh

# Verify
sha256sum -c webspinner-installer-v1.0.0.sh.sha256

# Run on server (system-wide with systemd service)
sudo ./webspinner-installer-v1.0.0.sh

# Or user installation (no systemd)
./webspinner-installer-v1.0.0.sh
```

**What the installer does:**
- Interactive configuration wizard (defaults to labs.spintheweb.org)
- Extracts runtime files
- Generates `.env` configuration
- Sets up systemd service (optional)
- Configures auto-start

**Documentation:** [docs/SERVER.md](docs/SERVER.md)

### 1. Webspinner Release (ZIP Archive)

**Best for:** Development, evaluation, manual deployment, any OS with Deno

**Create:**
```bash
./deployments/scripts/webspinner.sh
```

**Output:**
- `deployments/release/webspinner-v1.0.0.zip`
- `deployments/release/webspinner-v1.0.0.zip.sha256`

**Documentation:** [docs/WEBSPINNER.md](docs/WEBSPINNER.md)

---

### 2. Docker Release (Container)

**Best for:** Kubernetes, cloud platforms, containerized deployments

**Create:**
```bash
./deployments/scripts/docker.sh
```

**Output:**
- Docker images: `spintheweb/webspinner:1.0.0`, `:latest`
- Offline: `deployments/release/webspinner-docker-v1.0.0.tar.gz`

**Quick Start:**
```bash
docker pull spintheweb/webspinner:latest
docker run -d -p 8080:8080 spintheweb/webspinner:latest
```

**Documentation:** [docs/DOCKER.md](docs/DOCKER.md)

---

### 3. Server Release (Installer)

**Best for:** Production Linux servers, systemd-managed deployments

**Default Configuration:** labs.spintheweb.org:443 with HTTPS (customizable)

**Create:**
```bash
./deployments/scripts/server.sh
```

**Output:**
- `deployments/release/webspinner-installer-v1.0.0.sh`
- `deployments/release/webspinner-installer-v1.0.0.sh.sha256`

**Install:**
```bash
# System-wide with systemd service
sudo ./webspinner-installer-v1.0.0.sh

# User installation
./webspinner-installer-v1.0.0.sh
```

**Documentation:** [docs/SERVER.md](docs/SERVER.md)

---

## Quick Reference

### Create All Releases

```bash
# Create all three release types with the same version
VERSION="v1.0.0"

# 1. Webspinner (ZIP)
./deployments/scripts/webspinner.sh
# Enter: v1.0.0

# 2. Docker (Container)
./deployments/scripts/docker.sh
# Enter: v1.0.0

# 3. Server (Installer)
./deployments/scripts/server.sh
# Enter: v1.0.0
```

### Release Checklist

Before creating releases:

- [ ] Update version in `deno.json`
- [ ] Update CHANGELOG.md
- [ ] Run tests: `deno task test`
- [ ] Commit all changes
- [ ] Pull latest from main branch

After creating releases:

- [ ] Verify all artifacts generated
- [ ] Test each release type
- [ ] Upload to GitHub releases
- [ ] Update documentation if needed
- [ ] Announce release

## Comparison Matrix

| Feature | Webspinner | Docker | Server |
|---------|------------|--------|--------|
| **Format** | ZIP | Container | Self-extracting installer |
| **Executed By** | Maintainer (local) | Maintainer (local) | End user (remote server) |
| **Creates** | GitHub Release | Docker Hub + GitHub | GitHub Release |
| **Publishes To** | GitHub Releases | Docker Hub | GitHub Releases |
| **End User Gets** | ZIP download | Docker pull | Installer download |
| **OS** | Any with Deno | Any with Docker | Linux only |
| **Setup** | Extract & run | docker run | Interactive wizard |
| **Service Management** | Manual | Docker/systemd | systemd (auto) |
| **Default Config** | localhost:8080 | 0.0.0.0:8080 | labs.spintheweb.org:443 |
| **Best For** | Dev/testing | Cloud/K8s | Production servers |

## Configuration

### Webspinner Release
- Copy `.env.example` to `.env` (already included in release)
- Edit `.env` as needed
- Run: `deno run --allow-all stwSpinner.ts`

### Docker Release
- Set environment variables in `docker-compose.yml` or `docker run`
- Mount volumes for data persistence
- See: `docker-compose.yml` for examples

### Server Release
- Interactive wizard prompts for all configuration
- Defaults to labs.spintheweb.org but fully customizable
- Automatically creates systemd service

## Upgrades

**All deployment types support zero-downtime upgrades that preserve your data!**

### What Gets Preserved
- ✅ `.env` configuration
- ✅ `public/.data/` user data, webapplication.wbdl, and custom webbaselets
- ✅ `.cert/` TLS certificates

### Quick Upgrade

**Webspinner (ZIP):**
```bash
# Backup, download new version, copy data, restart
```

**Docker:**
```bash
docker pull spintheweb/webspinner:latest
docker-compose down && docker-compose up -d
```

**Server (Automatic!):**
```bash
# Just run the new installer - it detects upgrades!
sudo ./webspinner-installer-v1.1.0.sh
# Automatically: backs up, updates core, preserves data, restarts
```

**Full documentation:** [docs/UPGRADE.md](docs/UPGRADE.md)

## Support

For detailed information on each release type, see the documentation in `docs/`:

- **Overview**: This README
- **Webspinner**: [docs/WEBSPINNER.md](docs/WEBSPINNER.md)
- **Docker**: [docs/DOCKER.md](docs/DOCKER.md)
- **Server**: [docs/SERVER.md](docs/SERVER.md)
- **Upgrades**: [docs/UPGRADE.md](docs/UPGRADE.md)

For issues or questions:
- GitHub Issues: https://github.com/spintheweb/webspinner/issues
- Documentation: https://github.com/spintheweb/webspinner/wiki

## License

See LICENSE file in repository root.
