# Webspinner Deployment Testing

## Test Platform: Raspberry Pi 5

### Hardware & OS
- **Device:** Raspberry Pi 5
- **OS:** Raspberry Pi OS Lite 64-bit
- **Deployment Type:** Server (self-extracting installer)

---

## Pre-Installation Checklist

### 1. Prepare the Raspberry Pi

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Deno (required for Webspinner)
curl -fsSL https://deno.land/install.sh | sh

# Add Deno to PATH (add to ~/.bashrc for persistence)
export DENO_INSTALL="/home/$USER/.deno"
export PATH="$DENO_INSTALL/bin:$PATH"

# Verify Deno installation
deno --version

# Install rsync (optional, improves upgrade process)
sudo apt install rsync -y
```

### 2. Network Configuration

```bash
# Check hostname
hostname

# Check IP address
ip addr show

# If setting up for labs.spintheweb.org, configure DNS:
# - Point labs.spintheweb.org to your Pi's IP address
# - Or use local /etc/hosts for testing
```

### 3. TLS Certificates (if using HTTPS)

```bash
# Option A: Use mkcert for local development
sudo apt install libnss3-tools -y
curl -JLO "https://dl.filippo.io/mkcert/latest?for=linux/arm64"
chmod +x mkcert-v*-linux-arm64
sudo mv mkcert-v*-linux-arm64 /usr/local/bin/mkcert
mkcert -install
mkcert labs.spintheweb.org localhost 127.0.0.1 ::1

# Option B: Use Let's Encrypt for production
sudo apt install certbot -y
sudo certbot certonly --standalone -d labs.spintheweb.org

# Option C: Self-signed certificate
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

---

## Installation Test

### 1. Generate the Installer

On your development machine:

```bash
cd /d/Projects/spintheweb/webspinner
./deployments/scripts/server.sh
# Enter version: v0.0.1 (or appropriate test version)
```

Output:
- `deployments/release/webspinner-installer.sh`
- `deployments/release/webspinner-installer.sh.sha256`

### 2. Transfer to Raspberry Pi

```bash
# From your development machine
scp deployments/release/webspinner-installer.sh* pi@<raspberry-pi-ip>:~/

# Or use a USB drive, GitHub release, etc.
```

### 3. Install on Raspberry Pi

```bash
# SSH into Raspberry Pi
ssh pi@<raspberry-pi-ip>

# Verify checksum
sha256sum -c webspinner-installer.sh.sha256

# Make executable
chmod +x webspinner-installer.sh

# Run installer with sudo (for systemd service)
sudo ./webspinner-installer.sh
```

### 4. Interactive Configuration

The installer will prompt for:

```
Installation directory [/opt/webspinner]: <Enter or customize>
Domain/Hostname [labs.spintheweb.org]: <Enter or customize>
Port [443]: <Enter or customize>
Use TLS/HTTPS? (y/n) [y]: y
Certificate file path: /path/to/cert.pem
Private key file path: /path/to/key.pem
Session timeout (hours) [24]: <Enter>
Max concurrent users (0=unlimited) [0]: <Enter>
Max upload size (MB) [200]: <Enter>
Allow dev/studio mode? (y/n) [n]: y  # For testing
Install systemd service? (y/n) [y]: y
Start service now? (y/n) [y]: y
```

### 5. Verify Installation

```bash
# Check service status
sudo systemctl status webspinner

# Check logs
sudo journalctl -u webspinner -f

# Test HTTP endpoint
curl http://localhost:8080  # or your configured port

# Test HTTPS endpoint (if configured)
curl -k https://localhost:443

# Check listening ports
sudo netstat -tlnp | grep deno
```

### 6. Access from Browser

```bash
# From another machine on the network
open https://labs.spintheweb.org
# or
open https://<raspberry-pi-ip>:443
```

---

## Upgrade Test

### 1. Generate New Version

On your development machine:

```bash
# Make a small change to test upgrade
echo "// Test upgrade" >> stwSpinner.ts

./deployments/scripts/server.sh
# Enter version: v0.0.2
```

### 2. Transfer and Run Upgrade

```bash
# Transfer to Pi
scp deployments/release/webspinner-installer.sh* pi@<raspberry-pi-ip>:~/

# SSH and run
ssh pi@<raspberry-pi-ip>
chmod +x webspinner-installer.sh
sudo ./webspinner-installer.sh
```

### 3. Verify Upgrade

The installer should:
- ✅ Detect existing installation
- ✅ Create backup (`.backup-YYYYMMDD-HHMMSS/`)
- ✅ Stop webspinner service
- ✅ Update core files
- ✅ Preserve `.env`, `public/.data/`, `.cert/`
- ✅ Restart service automatically
- ✅ Skip configuration wizard

```bash
# Verify backup was created
ls -la /opt/webspinner/.backup-*

# Verify service restarted
sudo systemctl status webspinner

# Check preserved data
ls -la /opt/webspinner/public/.data/
cat /opt/webspinner/.env
```

---

## Test Scenarios

### Scenario 1: Fresh Install
- [x] Install Deno
- [x] Run installer
- [x] Configure for labs.spintheweb.org:443
- [x] Install systemd service
- [x] Access from browser
- [x] Verify Studio mode works
- [x] Create test data in `public/.data/`

### Scenario 2: Upgrade
- [x] Run new installer version
- [x] Verify backup created
- [x] Verify service stopped/restarted
- [x] Verify data preserved
- [x] Verify new version running
- [x] Check logs for errors

### Scenario 3: Rollback
- [x] Stop service: `sudo systemctl stop webspinner`
- [x] Identify backup: `ls /opt/webspinner/.backup-*`
- [x] Restore: `sudo cp -r /opt/webspinner/.backup-20251002-143000/* /opt/webspinner/`
- [x] Start service: `sudo systemctl start webspinner`
- [x] Verify old version running

### Scenario 4: Manual Non-Service Install
- [x] Run installer as regular user (no sudo)
- [x] Choose not to install systemd service
- [x] Start manually: `cd /opt/webspinner && ./start.sh`
- [x] Verify functionality
- [x] Stop with Ctrl+C

---

## Performance Monitoring

### Raspberry Pi 5 Specific

```bash
# Monitor CPU/Memory
htop

# Monitor temperature
vcgencmd measure_temp

# Check Deno process
ps aux | grep deno

# Monitor disk I/O
iostat -x 1

# Check available disk space
df -h
```

### Expected Performance

- **Cold Start:** ~2-5 seconds
- **Memory Usage:** 50-150MB (depends on workload)
- **CPU Usage:** Low (idle < 5%)
- **Response Time:** < 100ms for static content

---

## Common Issues & Solutions

### Issue: Port 443 requires sudo
**Solution:** Either run as root or use port > 1024 (e.g., 8443)

### Issue: Deno not found
**Solution:** Ensure Deno is in PATH or use full path in systemd service

### Issue: Certificate errors
**Solution:** Check certificate paths in `.env`, ensure correct permissions

### Issue: Service fails to start
**Solution:** Check logs: `sudo journalctl -u webspinner -xe`

### Issue: Permission denied on files
**Solution:** Check ownership: `sudo chown -R $USER:$USER /opt/webspinner`

### Issue: Out of memory (unlikely on Pi 5)
**Solution:** Check Deno memory usage, reduce `MAX_USERS` if needed

---

## Data Collection

### What to Document

1. **Installation Time:** From start to running service
2. **Installer Output:** Copy full terminal output
3. **Upgrade Time:** From start to service restart
4. **Backup Size:** Size of `.backup-*` directory
5. **Memory Usage:** Before/after installation
6. **Errors:** Any errors or warnings encountered
7. **Missing Features:** Functionality gaps discovered during testing

### Report Template

```markdown
## Test Report: Raspberry Pi 5 Installation

**Date:** YYYY-MM-DD
**Version:** v0.0.1

### Environment
- Pi Model: Raspberry Pi 5 (XGB RAM)
- OS: Raspberry Pi OS Lite 64-bit (version)
- Deno: vX.Y.Z

### Installation
- Duration: X minutes
- Issues: None / [describe]
- Service started: Yes/No

### Functionality Tested
- [x] Web server responds
- [ ] Studio mode accessible
- [ ] File uploads work
- [ ] TLS/HTTPS working
- [ ] Sessions persist
- [ ] Database connections (if tested)

### Upgrade Test
- Duration: X minutes
- Backup created: Yes (XMB)
- Data preserved: Yes/No
- Service restarted: Yes/No
- Issues: None / [describe]

### Performance
- Memory: XMB
- CPU: X% idle
- Response time: Xms

### Gaps/Issues Found
1. [describe any missing features]
2. [describe any bugs]
3. [describe any improvements needed]
```

---

## Next Steps After Testing

1. **Document Issues:** Create GitHub issues for any bugs found
2. **Update Scripts:** Fix any installer problems discovered
3. **Enhance Documentation:** Add missing instructions
4. **Test Other Deployments:** Try Docker and ZIP releases
5. **Production Deployment:** Once stable, deploy to actual labs.spintheweb.org

---

## Cleanup (if needed)

```bash
# Stop and remove service
sudo systemctl stop webspinner
sudo systemctl disable webspinner
sudo rm /etc/systemd/system/webspinner.service
sudo systemctl daemon-reload

# Remove installation
sudo rm -rf /opt/webspinner

# Remove Deno (if needed)
rm -rf ~/.deno
```
