# Webspinner Server Installer

## Overview

Production-ready self-extracting bash installer for Linux systems. Sets up complete stack with automated dependency installation, SSL configuration, and database setup.

## Stack Components

**Runtime:**
- Webspinner application server
- Deno runtime (installed to `/usr/local/bin`)
- PostgreSQL database

**Web Server:**
- nginx reverse proxy
- Let's Encrypt SSL via certbot
- HTTP to HTTPS redirect

**Service:**
- systemd service with auto-restart
- Automatic startup on boot

## Installation

### Download

```bash
wget https://github.com/spintheweb/webspinner/releases/latest/download/webspinner-server.sh
wget https://github.com/spintheweb/webspinner/releases/latest/download/webspinner-server.sh.sha256
sha256sum -c webspinner-server.sh.sha256
```

### Run

```bash
chmod +x webspinner-server.sh
sudo ./webspinner-server.sh
```

### Prompts

1. Installation directory (default: `/opt/webspinner`)
2. Domain/hostname (e.g., `example.com`)

### Process

The installer automatically:
1. Updates system packages
2. Installs Deno to `/usr/local/bin`
3. Installs nginx, certbot, PostgreSQL
4. Extracts Webspinner files
5. Configures PostgreSQL database with random password
6. Configures nginx reverse proxy (HTTP initially)
7. Obtains Let's Encrypt SSL certificate
8. Converts nginx to HTTPS with redirect
9. Creates systemd service
10. Starts all services

### Result

- **Public URL**: `https://yourdomain.com` (nginx port 443)
- **Internal**: Webspinner on `localhost:8080`
- **Database**: PostgreSQL on `localhost:5432`
- **Service**: `systemctl status webspinner`

## Requirements

#### 3. Run the Installer

**Must run as root:**

```bash
chmod +x webspinner-server.sh
sudo ./webspinner-server.sh
```

The installer will automatically:
1. Update system package lists
2. Install Deno runtime (if missing)
3. Install nginx (if missing)
4. Install certbot (if missing)
5. Install PostgreSQL (if missing)
6. Prompt for installation directory (default: `/opt/webspinner`)
7. Prompt for domain/hostname (e.g., `labs.spintheweb.org`)
8. Configure nginx reverse proxy
9. Obtain Let's Encrypt SSL certificate
10. Create and configure PostgreSQL database
11. Install and start systemd service

### Result

- **Public URL**: `https://yourdomain.com` (nginx port 443)
- **Internal**: Webspinner on `localhost:8080`
- **Database**: PostgreSQL on `localhost:5432`
- **Service**: `systemctl status webspinner`

## Requirements

- Linux (Ubuntu, Debian, RHEL, CentOS, Fedora, Arch)
- Root access (`sudo`)
- Ports 80/443 accessible
- DNS pointing to server

## Service Management

```bash
# Status
sudo systemctl status webspinner

# Restart
sudo systemctl restart webspinner

# Logs
sudo journalctl -u webspinner -f

# Stop
sudo systemctl stop webspinner
```

## Configuration

Configuration file: `/opt/webspinner/.env`

**Auto-configured defaults:**

| Variable | Value | Description |
|----------|-------|-------------|
| `HOST` | `localhost` | Internal binding |
| `PORT` | `8080` | Internal port |
| `SESSION_TIMEOUT` | `24` | Hours |
| `MAX_UPLOADSIZE` | `200` | MB |
| `DB_TYPE` | `postgresql` | Database |
| `DB_NAME` | `webspinner` | Database name |
| `DB_USER` | `webspinner` | Database user |
| `DB_PASS` | `(random)` | 25-char password |

Edit and restart:
```bash
sudo nano /opt/webspinner/.env
sudo systemctl restart webspinner
```

## Upgrading

Download and run new installer:

```bash
wget https://github.com/spintheweb/webspinner/releases/latest/download/webspinner-server.sh
chmod +x webspinner-server.sh
sudo ./webspinner-server.sh
```

Installer automatically:
- Detects existing installation
- Backs up configuration and data
- Stops service
- Updates core files only
- Restarts service

**Preserved:**
- Configuration (`.env`)
- User data (`public/.data/`)
- Custom webbaselets
- PostgreSQL database

**Updated:**
- Webspinner core files
- System webbaselets

## Uninstallation

```bash
sudo systemctl stop webspinner
sudo systemctl disable webspinner
sudo rm /etc/systemd/system/webspinner.service
sudo rm -rf /opt/webspinner
sudo systemctl daemon-reload
```

## Troubleshooting

### Deno Not Found

```bash
# Check Deno location
which deno

# Should be: /usr/local/bin/deno
# If not found, manually install:
curl -fsSL https://deno.land/x/install/install.sh | sh
sudo mv ~/.deno/bin/deno /usr/local/bin/
```

### Let's Encrypt Fails

Check requirements:
- Ports 80/443 accessible
- DNS points to server
- No firewall blocking

Manually obtain:
```bash
sudo certbot --nginx -d yourdomain.com
```

### Service Won't Start

```bash
# Check logs
sudo journalctl -u webspinner -n 50 --no-pager

# Verify Deno path
/usr/local/bin/deno --version

# Test manually
cd /opt/webspinner
/usr/local/bin/deno run --allow-all stwSpinner.ts
```

### Database Issues

```bash
# Check PostgreSQL
sudo systemctl status postgresql

# View credentials
sudo cat /opt/webspinner/.env | grep DB_

# Test connection
sudo -u postgres psql -d webspinner
```

## Creating Releases

### Prerequisites

```bash
# Required tools
which base64 tar gzip gh
```

### Generate Installer

```bash
./deployments/scripts/server.sh
```

Prompts:
1. Version (e.g., `v3.1.4`)
2. Create git tag and GitHub release? (yes/no)

Output: `deployments/release/webspinner-server.sh`

### Release Process

Answering "yes" to git tag prompt:
1. Creates git tag locally
2. Pushes tag to remote
3. Creates GitHub release
4. Uploads installer and checksum

Answering "no": skips all steps.

## Technical Details

### Installation Flow

1. Root check
2. Update package lists
3. Install Deno (direct download to `/usr/local/bin`)
4. Install nginx, certbot, PostgreSQL
5. Extract payload to installation directory
6. Configure PostgreSQL (create database and user)
7. Generate random database password
8. Create nginx config (HTTP only initially)
9. Reload nginx
10. Run certbot (obtains SSL, converts to HTTPS)
11. Create systemd service (uses `/usr/local/bin/deno`)
12. Start service

### Deno Installation

Downloads latest pre-compiled binary directly:
- Source: `https://github.com/denoland/deno/releases/latest/download/`
- Architectures: `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu`
- Target: `/usr/local/bin/deno`
- Permissions: `755`
- Always installs latest stable release

### nginx Configuration

Initial config: HTTP only
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:8080;
    }
}
```

After certbot: HTTPS with redirect
```nginx
server {
    listen 80;
    return 301 https://$server_name$request_uri;
}
server {
    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/...;
    ssl_certificate_key /etc/letsencrypt/...;
    # proxy settings
}
```

### Upgrade Detection

Checks for existing `stwSpinner.ts` in installation directory.
If found:
- Backs up `.env`, `public/.data/`, `.cert/`
- Stops service
- Updates core files only (preserves data)
- Restarts service

## References

- Repository: https://github.com/spintheweb/webspinner
- Issues: https://github.com/spintheweb/webspinner/issues
- Releases: https://github.com/spintheweb/webspinner/releases
4. Use different domain names/subdomains

## Support

For issues, questions, or contributions:

- GitHub Issues: https://github.com/spintheweb/webspinner/issues
- Documentation: https://github.com/spintheweb/webspinner/wiki
- Security: See SECURITY.md

## License

See LICENSE file in the installation directory or repository.
