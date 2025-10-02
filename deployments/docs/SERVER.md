# Webspinner Server Release: Self-Extracting Installer

## Overview

Server releases provide a **self-extracting bash installer** that bundles the complete Webspinner runtime with an interactive configuration wizard. This is the recommended deployment method for production Linux servers.

**Default Configuration**: The installer defaults to `labs.spintheweb.org` but can be customized for any domain during installation.

## What's Included

The server installer includes:
- Complete Webspinner runtime (all TypeScript sources)
- System webbaselets (`stwStudio.wbdl`, `stwCommon.wbdl`)
- Default `.env` configuration (from `.env.example`)
- Interactive configuration wizard (defaults to labs.spintheweb.org)
- Automatic `.env` generation/customization
- Optional systemd service setup
- Dependency validation
- Default data file initialization

**Note:** System webbaselets (`stwStudio.wbdl` and `stwCommon.wbdl`) are centrally managed and will be updated during upgrades. Custom webbaselets stored in `public/.data/` are always preserved. These system webbaselets could also be served from a CDN for instant updates across all portals.

## System Requirements

### Required
- **Operating System**: Linux/Unix with bash
- **Deno Runtime**: Version 1.x or later
- **Disk Space**: ~50MB minimum

### Optional (for system-wide installation)
- Root/sudo access (for systemd service)
- systemd init system

## Creating a Server Release

### Prerequisites
1. Ensure you have the required tools:
   ```bash
   # Check for required commands
   which base64 tar gzip
   ```

2. Optionally install GitHub CLI for automatic release creation:
   ```bash
   # Install gh CLI (optional)
   # See: https://cli.github.com/
   ```

### Generate the Installer

Run the server release script from the repository root:

```bash
./deployments/scripts/server.sh
```

The script will:
1. Prompt for version number (e.g., `v1.0.0`)
2. Create a sanitized payload (excludes .env, keys, test data)
3. Generate a self-extracting installer
4. Create SHA256 checksum
5. Optionally create git tag and GitHub release

### Output Files

The script generates in `deployments/release/`:
- `webspinner-installer.sh` - Self-extracting installer (overwrites previous version)
- `webspinner-installer.sh.sha256` - Checksum file

**Note:** Each run overwrites the previous installer. The version is tracked via git tags, not filename.

## Installation Guide

### For End Users

#### 1. Download the Installer

```bash
# Download from GitHub releases
wget https://github.com/spintheweb/webspinner/releases/download/v1.0.0/webspinner-installer.sh
wget https://github.com/spintheweb/webspinner/releases/download/v1.0.0/webspinner-installer.sh.sha256
```

#### 2. Verify Integrity

```bash
sha256sum -c webspinner-installer.sh.sha256
# Should output: webspinner-installer.sh: OK
```

#### 3. Make Executable

```bash
chmod +x webspinner-installer.sh
```

#### 4. Run the Installer

##### System-Wide Installation (with systemd service)

```bash
sudo ./webspinner-installer.sh
```

This will:
- Install to `/opt/webspinner` (default)
- Create systemd service
- Enable auto-start on boot

##### User Installation (no systemd)

```bash
./webspinner-installer.sh
```

This will:
- Install to `~/webspinner` (default)
- Create a `start.sh` script
- No system service (manual start)

### Configuration Wizard

The installer will prompt for:

1. **Installation Directory**
   - System-wide: `/opt/webspinner`
   - User: `~/webspinner`
   - Custom: Any writable path

2. **Domain/Hostname**
   - Default: `localhost`
   - Production: Your domain (e.g., `example.com`)

3. **Port**
   - Default: `8080`
   - HTTPS: `443`
   - Custom: Any available port

4. **TLS/HTTPS**
   - `n` for HTTP (development)
   - `y` for HTTPS (production)
   - If yes, provide certificate and key paths

5. **Session Timeout**
   - Default: `24` hours
   - Adjust based on security needs

6. **Max Concurrent Users**
   - Default: `0` (unlimited)
   - Set limit for resource management

7. **Max Upload Size**
   - Default: `200` MB
   - Adjust based on storage capacity

8. **Development Mode**
   - `n` for production (recommended)
   - `y` to enable Studio features

### Post-Installation

#### System-Wide (with systemd)

```bash
# Start the service
sudo systemctl start webspinner

# Check status
sudo systemctl status webspinner

# View logs
sudo journalctl -u webspinner -f

# Stop the service
sudo systemctl stop webspinner

# Restart the service
sudo systemctl restart webspinner
```

#### User Installation

```bash
# Navigate to installation directory
cd ~/webspinner

# Start manually
./start.sh

# Or run directly with Deno
deno run --allow-all stwSpinner.ts
```

## Configuration

### Environment Variables

After installation, configuration is stored in `.env`:

```bash
# Edit configuration
nano /opt/webspinner/.env  # System-wide
# or
nano ~/webspinner/.env      # User installation

# Restart to apply changes
sudo systemctl restart webspinner  # System-wide
# or re-run ./start.sh              # User installation
```

### Configuration Reference

See `.env.example` for all available options:

| Variable | Description | Default |
|----------|-------------|---------|
| `HOST` | Server hostname/domain | `localhost` |
| `PORT` | Server port | `8080` |
| `CERTFILE` | TLS certificate path (optional) | `` |
| `KEYFILE` | TLS private key path (optional) | `` |
| `SESSION_TIMEOUT` | Session timeout in hours | `24` |
| `MAX_USERS` | Max concurrent users (0=unlimited) | `0` |
| `MAX_UPLOADSIZE` | Max upload size in MB | `200` |
| `ALLOW_DEV` | Enable development/studio mode | `false` |

### Data Files

The installer creates default data files in `public/.data/`:

- `users.json` - User authentication data
- `datasources.json` - Database connections
- `webapplication.wbdl` - Site structure (WBDL)

## Uninstallation

### System-Wide

```bash
# Stop and disable service
sudo systemctl stop webspinner
sudo systemctl disable webspinner

# Remove service file
sudo rm /etc/systemd/system/webspinner.service
sudo systemctl daemon-reload

# Remove installation
sudo rm -rf /opt/webspinner
```

### User Installation

```bash
# Remove installation directory
rm -rf ~/webspinner
```

## Upgrading

To upgrade to a new version:

1. **Backup your data**:
   ```bash
   # System-wide
   sudo cp -r /opt/webspinner/public/.data ~/webspinner-backup
   sudo cp /opt/webspinner/.env ~/webspinner-backup/
   
   # User installation
   cp -r ~/webspinner/public/.data ~/webspinner-backup
   cp ~/webspinner/.env ~/webspinner-backup/
   ```

2. **Run new installer**:
   ```bash
   # Download and run the latest installer
   sudo ./webspinner-installer.sh
   ```

3. **Restore your configuration** (if needed):
   ```bash
   # The installer preserves .env and data files by default
   # But you have backups just in case!
   ```

4. **Restart the service**:
   ```bash
   sudo systemctl restart webspinner
   ```

## Troubleshooting

### Deno Not Found

```bash
# Install Deno
curl -fsSL https://deno.land/install.sh | sh

# Add to PATH
echo 'export PATH="$HOME/.deno/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
```

### Permission Denied

```bash
# Make installer executable
chmod +x webspinner-installer.sh

# For system-wide installation, use sudo
sudo ./webspinner-installer.sh
```

### Port Already in Use

```bash
# Check what's using the port
sudo netstat -tulpn | grep :8080

# Either stop the conflicting service or choose a different port
# Edit .env and change PORT value
```

### Service Won't Start

```bash
# Check service logs
sudo journalctl -u webspinner -n 50

# Check if Deno is in PATH for the service user
sudo -u webspinner which deno

# Verify file permissions
ls -la /opt/webspinner/
```

### TLS Certificate Issues

```bash
# Verify certificate files exist and are readable
ls -la /path/to/cert.pem
ls -la /path/to/key.pem

# Check certificate validity
openssl x509 -in /path/to/cert.pem -text -noout

# For development, use mkcert
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

## Security Best Practices

1. **Production Deployments**:
   - Always use HTTPS (TLS/SSL)
   - Set `ALLOW_DEV=false`
   - Configure firewall rules
   - Regular backups of `public/.data/`

2. **File Permissions**:
   ```bash
   # Secure data directory
   chmod 700 /opt/webspinner/public/.data
   
   # Secure .env file
   chmod 600 /opt/webspinner/.env
   ```

3. **Regular Updates**:
   - Keep Deno runtime updated
   - Update Webspinner when new releases available
   - Monitor security advisories

## Advanced Configuration

### Custom Installation Directory

```bash
# During installation, specify custom path
Installation directory [/opt/webspinner]: /srv/webspinner
```

### Running Behind Reverse Proxy

If running behind nginx/Apache/Caddy:

```env
# .env configuration
HOST=127.0.0.1
PORT=8080
# Let reverse proxy handle HTTPS
CERTFILE=
KEYFILE=
```

Example nginx configuration:

```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Environment-Specific Configuration

Create separate config files:

```bash
# Development
cp .env .env.development

# Production
cp .env .env.production

# Switch by symlinking
ln -sf .env.production .env
```

## Support

For issues, questions, or contributions:

- GitHub Issues: https://github.com/spintheweb/webspinner/issues
- Documentation: https://github.com/spintheweb/webspinner/wiki
- Security: See SECURITY.md

## License

See LICENSE file in the installation directory or repository.
