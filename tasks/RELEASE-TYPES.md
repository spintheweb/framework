# Webspinner Release Types

This document describes the three release types for Webspinner and when to use each.

## Overview

Webspinner supports three distinct release/deployment types:

| Type | Format | Use Case | Target Environment |
|------|--------|----------|-------------------|
| **Type A** | ZIP Archive | Development, manual deployment | Any OS with Deno |
| **Type B** | Docker Image | Containerized deployment | Docker/Kubernetes |
| **Type C** | Self-Extracting Installer | Production Linux servers | Linux with systemd |

## Type A: ZIP Archive

**Format**: Sanitized ZIP file with runtime files and checksums

**Best For**:
- Local development
- Manual deployment
- Quick evaluation/testing
- Windows/Mac/Linux workstations
- Environments without Docker or systemd

**What's Included**:
- Complete runtime (TypeScript sources)
- Public assets and webbaselets
- Configuration templates
**What's Included**:
- Complete runtime (TypeScript sources)
- Public assets and webbaselets
- Configuration (`.env` with safe defaults from `.env.example`)
- Documentation

**What's Excluded**:
- Certificates/keys
- Test data files
- Sensitive production configuration

**Usage**:
```bash
# Download and extract
wget https://github.com/spintheweb/webspinner/releases/download/v1.0.0/webspinner-v1.0.0.zip
unzip webspinner-v1.0.0.zip
cd webspinner-v1.0.0

# Already includes .env with safe defaults - ready to run!
deno run --allow-all stwSpinner.ts

# Or customize first:
nano .env  # Edit as needed
deno run --allow-all stwSpinner.ts
```

**Documentation**: See `tasks/RELEASE-TYPE-A.md`

**Script**: `tasks/release-type-a.sh`

---

## Type B: Docker Image

**Format**: Docker container image

**Best For**:
- Containerized deployments
- Kubernetes/orchestration
- Cloud platforms (AWS ECS, Azure Container Instances, etc.)
- Reproducible environments
- Multi-instance deployments

**What's Included**:
- Complete runtime environment
- Deno runtime (embedded)
- All dependencies
- Default configuration

**Configuration**:
- Environment variables
- Volume mounts for data persistence
- docker-compose.yml for easy setup

**Usage**:
```bash
# Using Docker Hub
docker pull spintheweb/webspinner:v1.0.0
docker run -p 8080:8080 spintheweb/webspinner:v1.0.0

# Using docker-compose
docker-compose -f deployments/docker/docker-compose.yml up
```

**Documentation**: See `deployments/docker/README.md`

**Build Files**: `deployments/docker/Dockerfile`, `docker-compose.yml`

---

## Type C: Self-Extracting Installer

**Format**: Bash script with embedded tar.gz payload

**Best For**:
- Production Linux servers
- Automated server provisioning
- Systemd-managed services
- Enterprise deployments
- Long-running production instances

**What's Included**:
- Complete runtime (TypeScript sources)
- Interactive configuration wizard
- Systemd service template
- Automatic `.env` generation
- Dependency checking
- Default data initialization

**Features**:
- ✅ System-wide or user installation
- ✅ Interactive configuration prompts
- ✅ Automatic systemd service setup
- ✅ Dependency validation (Deno)
- ✅ TLS/HTTPS configuration
- ✅ Default data file creation
- ✅ Service management integration

**Usage**:
```bash
# Download installer
wget https://github.com/spintheweb/webspinner/releases/download/v1.0.0/webspinner-installer-v1.0.0.sh

# Verify integrity
sha256sum -c webspinner-installer-v1.0.0.sh.sha256

# Run installer (system-wide with service)
sudo ./webspinner-installer-v1.0.0.sh

# Or user installation (no service)
./webspinner-installer-v1.0.0.sh

# Manage service
sudo systemctl start webspinner
sudo systemctl status webspinner
sudo journalctl -u webspinner -f
```

**Documentation**: See `tasks/RELEASE-TYPE-C.md`

**Script**: `tasks/release-type-c.sh`

---

## Comparison Matrix

| Feature | Type A | Type B | Type C |
|---------|--------|--------|--------|
| **Installation** | Manual extract | `docker run` | Interactive installer |
| **Configuration** | Manual `.env` | ENV vars/volumes | Interactive wizard |
| **Dependencies** | Deno required | None (embedded) | Deno required |
| **Service Management** | Manual | Docker/compose | systemd (auto) |
| **Auto-start** | No | Container restart | Yes (systemd) |
| **Platform** | Any OS | Any OS (Docker) | Linux only |
| **Complexity** | Low | Medium | Low |
| **Best For** | Dev/testing | Containers | Production servers |

---

## Release Creation Workflow

### Creating All Release Types

For a complete release, create all three types:

```bash
# 1. Type A (ZIP Archive)
./tasks/release-type-a.sh
# Enter version: v1.0.0

# 2. Type B (Docker Image)
cd deployments/docker
docker build -t spintheweb/webspinner:v1.0.0 .
docker push spintheweb/webspinner:v1.0.0
docker tag spintheweb/webspinner:v1.0.0 spintheweb/webspinner:latest
docker push spintheweb/webspinner:latest

# 3. Type C (Installer)
./tasks/release-type-c.sh
# Enter version: v1.0.0 (must match!)
```

### Versioning

All three types should use the same version number:
- **Format**: `vMAJOR.MINOR.PATCH` (e.g., `v1.2.3`)
- **Semantic versioning**: Follow semver.org
- **Git tags**: One tag per version (shared by all types)

### GitHub Release

Each release type can:
1. Create its own GitHub release with type-specific notes
2. Or all three attach to the same release

**Recommended**: One release with three assets:
- `webspinner-v1.0.0.zip` (Type A)
- `webspinner-v1.0.0.zip.sha256`
- `webspinner-installer-v1.0.0.sh` (Type C)
- `webspinner-installer-v1.0.0.sh.sha256`
- Docker image reference in release notes

---

## Configuration: .env vs ENV vars vs Wizard

### Type A: Manual .env
```bash
# Copy template and edit
cp .env.example .env
nano .env
```

### Type B: Environment Variables
```yaml
# docker-compose.yml
environment:
  - HOST=example.com
  - PORT=8080
  - ALLOW_DEV=false
```

### Type C: Interactive Wizard
```
Domain/Hostname [localhost]: example.com
Port [8080]: 443
Use TLS/HTTPS? (y/n) [n]: y
Certificate file path: /etc/ssl/certs/example.com.pem
...
```

---

## When to Use Which Type

### Choose Type A (ZIP) if:
- ✅ Developing locally
- ✅ Need quick setup for testing
- ✅ Want full control over configuration
- ✅ Running on Windows/Mac
- ✅ Don't want Docker or systemd

### Choose Type B (Docker) if:
- ✅ Using Kubernetes or orchestration
- ✅ Need reproducible deployments
- ✅ Want isolation and portability
- ✅ Deploying to cloud platforms
- ✅ Running multiple instances

### Choose Type C (Installer) if:
- ✅ Deploying to production Linux server
- ✅ Want systemd integration
- ✅ Need guided configuration
- ✅ Want automatic service management
- ✅ Prefer traditional server setup

---

## Security Considerations

### All Types
- ⚠️ Never commit `.env` to git (use `.env.example`)
- ⚠️ Never include certificates/keys in releases
- ⚠️ Always verify checksums before installation
- ⚠️ Set `ALLOW_DEV=false` in production

### Type A
- Manually secure `.env` file: `chmod 600 .env`
- Manually secure data directory: `chmod 700 public/.data`

### Type B
- Use Docker secrets for sensitive data
- Don't expose unnecessary ports
- Run as non-root user (handled by Dockerfile)

### Type C
- Installer automatically sets proper permissions
- Systemd runs as configured user
- Service configuration in `/etc/systemd/system/`

---

## Support

For questions, issues, or contributions:

- **Documentation**: `tasks/RELEASE-TYPE-{A,B,C}.md`
- **GitHub Issues**: https://github.com/spintheweb/webspinner/issues
- **Security**: See SECURITY.md

---

## License

See LICENSE file in repository.
