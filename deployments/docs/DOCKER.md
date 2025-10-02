# Webspinner Docker Release

## Overview

Docker releases provide containerized Webspinner deployments with all dependencies included. This is the recommended method for cloud deployments, Kubernetes, and environments that support containers.

All Docker images include the system webbaselets (`stwStudio.wbdl` and `stwCommon.wbdl`) which are centrally managed by the project. Custom webbaselets should be stored in `public/.data/` and mounted as volumes for persistence across container updates.

**CDN Alternative:** Since system webbaselets are centrally managed, they could be served from a CDN (e.g., `https://cdn.spintheweb.org/webbaselets/`) allowing all portals to load the latest versions without container rebuilds.

## Quick Start

### Using Docker Hub

```bash
# Pull and run
docker pull spintheweb/webspinner:latest
docker run -d -p 8080:8080 --name webspinner spintheweb/webspinner:latest

# Access
open http://localhost:8080
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f webspinner

# Stop
docker-compose down
```

## Creating a Docker Release

### Prerequisites

- Docker installed and running
- Access to Docker registry (Docker Hub, GitHub Container Registry, etc.)
- Optional: `gh` CLI for GitHub releases

### Generate Release

Run the Docker release script:

```bash
./deployments/scripts/docker.sh
```

The script will:
1. Prompt for version (e.g., `v1.0.0`)
2. Build Docker image with multiple tags
3. Test the container
4. Optionally push to registry
5. Export offline tar.gz archive
6. Create git tag and GitHub release

### Output

The script generates:
- **Docker images**: `spintheweb/webspinner:1.0.0`, `:v1.0.0`, `:latest`
- **Offline archive**: `deployments/release/webspinner-docker-v1.0.0.tar.gz`
- **Checksum**: `webspinner-docker-v1.0.0.tar.gz.sha256`

## Dockerfile

The multi-stage Dockerfile:

1. **Base**: Uses official Deno Debian image
2. **Deps**: Caches dependencies
3. **App**: Copies application files, sets permissions
4. **Runtime**: Non-root user, health checks, security defaults

### Features

- ✅ Multi-stage build (optimized size)
- ✅ Non-root user (security)
- ✅ Health checks
- ✅ Dependency caching
- ✅ Clean layer structure

## Configuration

### Environment Variables

Configure via ENV vars in `docker-compose.yml` or `docker run`:

```bash
docker run -d \
  -p 8080:8080 \
  -e HOST=0.0.0.0 \
  -e PORT=8080 \
  -e ALLOW_DEV=false \
  -e SESSION_TIMEOUT=24 \
  -e MAX_USERS=0 \
  spintheweb/webspinner:latest
```

### Available Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `HOST` | `0.0.0.0` | Server hostname |
| `PORT` | `8080` | Server port |
| `CERTFILE` | `` | TLS certificate path |
| `KEYFILE` | `` | TLS key path |
| `SESSION_TIMEOUT` | `24` | Session timeout (hours) |
| `MAX_USERS` | `0` | Max users (0=unlimited) |
| `MAX_UPLOADSIZE` | `200` | Max upload size (MB) |
| `ALLOW_DEV` | `false` | Enable dev/studio mode |
| `SITE_ROOT` | `./public` | Public files directory |
| `SITE_WEBBASE` | `./public/.data/webapplication.wbdl` | Main webbase file |
| `SECURITY` | `./public/.data/users.json` | Users file |

### Volume Mounts

Persist data by mounting volumes:

```yaml
volumes:
  # Persist application data
  - webspinner-data:/app/public/.data
  
  # Custom certificates
  - ./certs:/app/.cert:ro
  
  # Custom webbaselets
  - ./custom:/app/webbaselets/custom:ro
```

## Deployment Scenarios

### 1. Standalone Container

```bash
docker run -d \
  -p 8080:8080 \
  --name webspinner \
  --restart unless-stopped \
  -v webspinner-data:/app/public/.data \
  spintheweb/webspinner:latest
```

### 2. With Database (MySQL)

```yaml
services:
  webspinner:
    image: spintheweb/webspinner:latest
    environment:
      - DB_HOST=mysql
      - DB_PORT=3306
    depends_on:
      - mysql
  
  mysql:
    image: mysql:8.0
    environment:
      - MYSQL_DATABASE=webspinner
      - MYSQL_USER=webspinner
      - MYSQL_PASSWORD=secret
    volumes:
      - mysql-data:/var/lib/mysql
```

### 3. Behind Reverse Proxy (Nginx)

```yaml
services:
  webspinner:
    image: spintheweb/webspinner:latest
    expose:
      - "8080"
    networks:
      - internal
  
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./certs:/etc/nginx/certs:ro
    depends_on:
      - webspinner
    networks:
      - internal
```

### 4. Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: webspinner
spec:
  replicas: 3
  selector:
    matchLabels:
      app: webspinner
  template:
    metadata:
      labels:
        app: webspinner
    spec:
      containers:
      - name: webspinner
        image: spintheweb/webspinner:1.0.0
        ports:
        - containerPort: 8080
        env:
        - name: HOST
          value: "0.0.0.0"
        - name: PORT
          value: "8080"
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        volumeMounts:
        - name: data
          mountPath: /app/public/.data
      volumes:
      - name: data
        persistentVolumeClaim:
          claimName: webspinner-pvc
```

## Cloud Deployment

### AWS ECS

```bash
# Build and push
docker build -t <account>.dkr.ecr.<region>.amazonaws.com/webspinner:latest .
docker push <account>.dkr.ecr.<region>.amazonaws.com/webspinner:latest

# Deploy via ECS task definition
```

### Azure Container Instances

```bash
az container create \
  --resource-group myResourceGroup \
  --name webspinner \
  --image spintheweb/webspinner:latest \
  --dns-name-label webspinner \
  --ports 8080
```

### Google Cloud Run

```bash
# Build and push to GCR
docker build -t gcr.io/PROJECT-ID/webspinner:latest .
docker push gcr.io/PROJECT-ID/webspinner:latest

# Deploy
gcloud run deploy webspinner \
  --image gcr.io/PROJECT-ID/webspinner:latest \
  --platform managed \
  --port 8080
```

## Offline Installation

For air-gapped environments:

```bash
# On machine with internet:
# Download from GitHub release
wget https://github.com/spintheweb/webspinner/releases/download/v1.0.0/webspinner-docker-v1.0.0.tar.gz
wget https://github.com/spintheweb/webspinner/releases/download/v1.0.0/webspinner-docker-v1.0.0.tar.gz.sha256

# Verify
sha256sum -c webspinner-docker-v1.0.0.tar.gz.sha256

# Transfer to offline machine, then load:
gunzip -c webspinner-docker-v1.0.0.tar.gz | docker load

# Run
docker run -d -p 8080:8080 spintheweb/webspinner:1.0.0
```

## Security

### Best Practices

1. **Use specific versions** (not `:latest` in production)
   ```yaml
   image: spintheweb/webspinner:1.0.0
   ```

2. **Run as non-root** (already configured in Dockerfile)

3. **Read-only root filesystem**
   ```yaml
   security_opt:
     - no-new-privileges:true
   read_only: true
   tmpfs:
     - /tmp
   ```

4. **Resource limits**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '0.5'
         memory: 512M
   ```

5. **Secrets management**
   ```yaml
   secrets:
     - db_password
   environment:
     - DB_PASSWORD_FILE=/run/secrets/db_password
   ```

### Scanning Images

```bash
# Scan for vulnerabilities
docker scan spintheweb/webspinner:latest

# Or use Trivy
trivy image spintheweb/webspinner:latest
```

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs webspinner

# Inspect container
docker inspect webspinner

# Run interactively
docker run -it --rm spintheweb/webspinner:latest /bin/bash
```

### Permission issues

```bash
# Check file permissions
docker exec webspinner ls -la /app/public/.data

# Fix if needed (run as root)
docker exec -u root webspinner chown -R deno:deno /app/public/.data
```

### Network issues

```bash
# Test connectivity
docker exec webspinner curl -v http://localhost:8080

# Check network
docker network inspect bridge
```

### Health check failing

```bash
# Check health status
docker inspect --format='{{json .State.Health}}' webspinner | jq

# Test health endpoint manually
docker exec webspinner curl http://localhost:8080
```

## Development

### Build locally

```bash
# Build
docker build -t webspinner:dev .

# Run
docker run -d -p 8080:8080 webspinner:dev

# Build with cache disabled
docker build --no-cache -t webspinner:dev .
```

### Debug mode

```bash
docker run -it --rm \
  -p 8080:8080 \
  -e ALLOW_DEV=true \
  -v $(pwd)/public/.data:/app/public/.data \
  webspinner:dev
```

## Upgrading

```bash
# Pull new version
docker pull spintheweb/webspinner:latest

# Stop old container
docker stop webspinner

# Remove old container
docker rm webspinner

# Run new version
docker run -d \
  -p 8080:8080 \
  --name webspinner \
  -v webspinner-data:/app/public/.data \
  spintheweb/webspinner:latest
```

Or with docker-compose:

```bash
# Pull and restart
docker-compose pull
docker-compose up -d
```

## Support

- GitHub Issues: https://github.com/spintheweb/webspinner/issues
- Docker Hub: https://hub.docker.com/r/spintheweb/webspinner
- Documentation: https://github.com/spintheweb/webspinner/wiki

## License

See LICENSE file in repository.
