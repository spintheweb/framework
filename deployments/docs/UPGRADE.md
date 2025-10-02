# Webspinner Upgrade Guide

## Overview

All Webspinner deployment types support **zero-downtime upgrades** that preserve your data and configuration.

### System Webbaselets

Webspinner includes two **critical system webbaselets** that are centrally managed:
- **`stwStudio.wbdl`** - Studio/management interface
- **`stwCommon.wbdl`** - Fundamental contents for all portals

These are **always updated during upgrades** to ensure all portals benefit from improvements. Your custom webbaselets in `public/.data/` are always preserved.

**Note:** Since these are centrally managed, they could be served from a CDN (e.g., `https://cdn.spintheweb.org/webbaselets/`) allowing instant updates across all portals without requiring individual deployments.

## What Gets Preserved on Upgrade

✅ **Always preserved:**
- `.env` - Your configuration
- `public/.data/` - User data, sessions, uploaded files, webapplication.wbdl, and custom webbaselets
- `.cert/` - TLS certificates

❌ **Always replaced (core updates):**
- `stwSpinner.ts` - Core engine
- `stwComponents/`, `stwContents/`, `stwElements/`, `stwStyles/` - Framework
- `webbaselets/stwStudio.wbdl` - Studio/management interface (critical system webbaselet)
- `webbaselets/stwCommon.wbdl` - Common fundamental contents for all portals
- `deno.json`, `deno.lock` - Dependencies

---

## Upgrade Methods

### 1. Webspinner (ZIP) Upgrade

**For:** Manual installations

**Steps:**
```bash
# 1. Backup current installation
cd /path/to/webspinner
tar -czf ../webspinner-backup-$(date +%Y%m%d).tar.gz .

# 2. Stop the service
# (If running as service, or Ctrl+C if running manually)

# 3. Download new version
wget https://github.com/spintheweb/webspinner/releases/download/v1.1.0/webspinner-v1.1.0.zip
unzip webspinner-v1.1.0.zip
cd webspinner-v1.1.0

# 4. Preserve your data
cp /path/to/old/webspinner/.env .
cp -r /path/to/old/webspinner/public/.data/* ./public/.data/
cp -r /path/to/old/webspinner/.cert .
cp -r /path/to/old/webspinner/webbaselets/custom ./webbaselets/ 2>/dev/null || true

# 5. Start new version
deno run --allow-all stwSpinner.ts
```

---

### 2. Docker Upgrade

**For:** Container deployments

#### Option A: Pull Latest (Rolling Updates)
```bash
# Pull new image
docker pull spintheweb/webspinner:latest

# Restart container (volumes preserve data)
docker-compose down
docker-compose up -d
```

#### Option B: Specific Version
```bash
# Update docker-compose.yml
image: spintheweb/webspinner:1.1.0  # Change version

# Apply
docker-compose pull
docker-compose up -d
```

**Data Preservation:** Automatic via Docker volumes
- `webspinner-data:/app/public/.data` - Always preserved
- Environment variables unchanged
- Certificate mounts unchanged

#### Kubernetes Rolling Update
```bash
# Update deployment
kubectl set image deployment/webspinner \
  webspinner=spintheweb/webspinner:1.1.0

# Monitor rollout
kubectl rollout status deployment/webspinner

# Rollback if needed
kubectl rollout undo deployment/webspinner
```

---

### 3. Server Installer Upgrade

**For:** Linux server installations with systemd

**Automatic upgrade mode** - the installer detects existing installations!

```bash
# 1. Download new installer
wget https://github.com/spintheweb/webspinner/releases/download/v1.1.0/webspinner-installer-v1.1.0.sh
chmod +x webspinner-installer-v1.1.0.sh

# 2. Run installer (it will detect existing installation)
sudo ./webspinner-installer-v1.1.0.sh

# The installer will:
# - Detect existing installation
# - Backup your data automatically
# - Stop the service
# - Update core files only
# - Preserve .env, data, certs
# - Restart the service
```

**What happens:**
1. Installer detects `/opt/webspinner` exists
2. Creates backup: `/opt/webspinner/.backup-20251002-143022/`
3. Stops systemd service
4. Updates core files
5. Preserves `.env`, `public/.data/`, `.cert/`
6. Restarts service
7. Shows summary

**Manual upgrade (if needed):**
```bash
# Stop service
sudo systemctl stop webspinner

# Backup
sudo cp -r /opt/webspinner /opt/webspinner.backup

# Run installer with same installation directory
sudo ./webspinner-installer-v1.1.0.sh
# Choose: /opt/webspinner
# Confirm upgrade: y

# Verify
sudo systemctl status webspinner
```

---

## Version Compatibility

### Breaking Changes

Check release notes for breaking changes between versions:

```bash
# Check current version
cat /opt/webspinner/VERSION 2>/dev/null || echo "< v1.0.0"

# Or check deno.json
grep version /opt/webspinner/deno.json
```

### Database Migrations

If a version requires database schema changes:

1. **Backup database first**
   ```bash
   mysqldump -u user -p webspinner > backup.sql
   ```

2. **Upgrade Webspinner** (using any method above)

3. **Run migrations** (if provided in release notes)
   ```bash
   cd /opt/webspinner
   deno run --allow-all scripts/migrate.ts
   ```

---

## Rollback Procedures

### ZIP Installation Rollback
```bash
# Stop new version
# Restore from backup
cd /path/to
rm -rf webspinner-new
mv webspinner.backup webspinner
cd webspinner
deno run --allow-all stwSpinner.ts
```

### Docker Rollback
```bash
# Rollback to previous version
docker-compose down
# Edit docker-compose.yml: change version back
docker-compose up -d

# Or with specific tag
docker run -d -p 8080:8080 \
  -v webspinner-data:/app/public/.data \
  spintheweb/webspinner:1.0.0
```

### Server Installation Rollback
```bash
# Stop service
sudo systemctl stop webspinner

# Restore from automatic backup
sudo rm -rf /opt/webspinner
sudo cp -r /opt/webspinner/.backup-YYYYMMDD-HHMMSS /opt/webspinner

# Start service
sudo systemctl start webspinner
```

---

## Testing Upgrades

### Test in Development First

```bash
# 1. Clone production config
cp production/.env test/.env

# 2. Install new version in test directory
./webspinner-installer-v1.1.0.sh
# Choose different directory: /opt/webspinner-test

# 3. Test thoroughly
cd /opt/webspinner-test
./start.sh

# 4. If good, upgrade production
```

### Verify Upgrade Success

```bash
# Check version
cat /opt/webspinner/VERSION

# Check service status
sudo systemctl status webspinner

# Check logs
sudo journalctl -u webspinner -n 50

# Test application
curl http://localhost:8080
```

---

## Upgrade Checklist

Before upgrading:

- [ ] Read release notes for breaking changes
- [ ] Backup database (if using)
- [ ] Backup installation directory
- [ ] Note current version
- [ ] Test in dev/staging first
- [ ] Schedule maintenance window (if needed)
- [ ] Notify users (if needed)

After upgrading:

- [ ] Verify service started
- [ ] Check logs for errors
- [ ] Test critical functionality
- [ ] Verify data preserved
- [ ] Monitor performance
- [ ] Keep backup for 24-48 hours

---

## Troubleshooting

### Upgrade fails

```bash
# Check logs
sudo journalctl -u webspinner -f

# Verify file permissions
ls -la /opt/webspinner/

# Restore from backup
sudo cp -r /opt/webspinner/.backup-* /opt/webspinner
```

### Service won't start after upgrade

```bash
# Check dependencies
deno --version

# Test manually
cd /opt/webspinner
deno run --allow-all stwSpinner.ts

# Check .env file
cat /opt/webspinner/.env
```

### Data missing after upgrade

```bash
# Check backup
ls -la /opt/webspinner/.backup-*/

# Restore data
sudo cp -r /opt/webspinner/.backup-*/public/.data/* /opt/webspinner/public/.data/
```

---

## Support

For upgrade issues:
- GitHub Issues: https://github.com/spintheweb/webspinner/issues
- Check release notes: https://github.com/spintheweb/webspinner/releases
- Deployment docs: `deployments/README.md`
