# Spin the Web Sandbox - Complete Playground Environment

Deploy the **Spin the Web framework sandbox** to your Raspberry Pi 5 (8GB RAM, 256GB M.2 SSD) - a complete playground environment for exploring WBDL (Webbase Description Language) and the Webspinner runtime interpreter.

## Overview

**sandbox.spintheweb.org** is the deployment of the Spin the Web framework on Raspberry Pi, providing a complete playground environment where users can:

- **Experiment with Webspinner** - The WBDL runtime interpreter that endows containers with RESTfulness
- **Play with Sample Datasources** - Rich databases with realistic sample data 
- **Build WBDL Webbases** - Create and test web applications using the framework
- **Learn the Framework** - Hands-on experience with HTTP/WebSocket endpoints

This sandbox deployment creates a complete learning and development environment with:
- **Webspinner Runtime** - WBDL interpreter container providing HTTP/WebSocket services
- **Playground Datasources** - 5 databases with sample data for experimentation
- **Management Tools** - Database and container administration interfaces

## Sandbox Architecture

The Spin the Web sandbox (`sandbox.spintheweb.org`) runs on Docker and manages:
1. **Webspinner Container** - Main runtime interpreter for WBDL webbases
2. **Playground Datasources** - MySQL, PostgreSQL, SQL Server, MongoDB, Oracle with sample data
3. **Management Tools** - Adminer (DB admin), Portainer (container admin)

All containers communicate via internal Docker networks, with external access through configured ports and domains.

### Container Stack:
- **Webspinner Runtime** - WBDL interpreter with HTTP/WebSocket endpoints
- **MySQL 8.0** - E-commerce sample data (users, products, orders)
- **PostgreSQL 15** - Media/rental sample data (Pagila DVD store)
- **SQL Server 2022** - Business sample data (AdventureWorksLT)
- **MongoDB 7.0** - Movie database sample (MFlix with ratings/reviews)
- **Oracle Free 23c** - Enterprise sample data (HR schema with org structure)
- **Adminer** - Database playground interface
- **Portainer** - Container management interface

## Hardware Requirements ✅

Your Raspberry Pi 5 specs are perfect for the Spin the Web sandbox:
- **8GB RAM** - Sufficient for Webspinner + all playground datasources + OS
- **256GB M.2 SSD** - Fast storage for databases, webbases, and framework files
- **ARM64 CPU** - All Docker images support ARM64 architecture
- **Gigabit Ethernet** - Fast network connectivity for sandbox users

## Access Points

### Production Sandbox (sandbox.spintheweb.org):
- **Spin the Web Framework**: `https://sandbox.spintheweb.org`
- **Database Playground**: `https://sandbox.spintheweb.org:8081`
- **Container Management**: `https://sandbox.spintheweb.org:9000`

### Database Access Points:
- **MySQL**: `sandbox.spintheweb.org:3306` (E-commerce sample)
- **PostgreSQL**: `sandbox.spintheweb.org:5432` (Media/rental sample)
- **SQL Server**: `sandbox.spintheweb.org:1433` (Business sample)
- **MongoDB**: `sandbox.spintheweb.org:27017` (Movie database)
- **Oracle**: `sandbox.spintheweb.org:1521` (Enterprise/HR sample)

### Local Development (when running locally):
- **MySQL**: `localhost:3306`
- **PostgreSQL**: `localhost:5432`
- **SQL Server**: `localhost:1433`
- **MongoDB**: `localhost:27017`
- **Oracle**: `localhost:1521`
- **Adminer**: `http://localhost:8081`

## Database Details

### MySQL (Port 3306)
- **Database:** `qt3ul9nb_sampledb`
- **User:** `qt3ul9nb_sampledb`
- **Password:** `r#MM9!0Ght3(vM2`
- **Tables:** users, products, orders
- **Sample Data:** E-commerce data with customers, products, and order history

### PostgreSQL (Port 5432)
- **Database:** `pagila`
- **User:** `neon_user`
- **Password:** `neon_pass`
- **Tables:** category, actor, film, customer, rental
- **Sample Data:** Simplified DVD rental store data

### SQL Server (Port 1433)
- **Database:** `AdventureWorksLT`
- **User:** `sa`
- **Password:** `SamplePass!123`
- **Tables:** ProductCategory, Product, Customer, SalesOrderHeader
- **Sample Data:** Sample business data with products and sales

### MongoDB (Port 27017)
- **Database:** `sample_mflix`
- **User:** `readonly`
- **Password:** `readonly`
- **Collections:** movies, users, comments
- **Sample Data:** Movie database with ratings and reviews

### Oracle (Port 1521)
- **Service:** `FREEPDB1`
- **User:** `hr`
- **Password:** `hr`
- **Tables:** employees, departments, jobs, locations, countries, regions
- **Sample Data:** Classic HR schema with organizational data

## Webspinner Runtime Details

### HTTP Endpoints
The Webspinner container provides RESTful endpoints for:
- WBDL webbase execution
- Database connections and queries
- WebSocket connections for real-time features
- API endpoints for webbase management

### WebSocket Support
Real-time communication for:
- Live data updates
- Interactive webbase sessions
- Streaming database results
- Real-time collaboration features

## Estimated Resource Usage

Based on Pi 5 with 8GB RAM (Spin the Web Sandbox):

| Service | RAM Usage | CPU Usage | Storage | Purpose |
|---------|-----------|-----------|---------|---------|
| **Webspinner Runtime** | **~512MB** | **Medium** | **~200MB** | **Framework interpreter** |
| MySQL | ~400MB | Low | ~500MB | E-commerce playground |
| PostgreSQL | ~200MB | Low | ~200MB | Media/rental playground |
| SQL Server | ~800MB | Medium | ~1GB | Business data playground |
| MongoDB | ~300MB | Low | ~300MB | Movie database playground |
| Oracle | ~1.2GB | High | ~1.5GB | Enterprise data playground |
| Adminer | ~50MB | Low | ~50MB | Database management |
| Portainer | ~100MB | Low | ~100MB | Container management |
| **Sandbox Total** | **~3.87GB** | **Medium** | **~4.5GB** |

*Totals include OS overhead and runtime variations*

## Quick Start

### 1. Deploy to Raspberry Pi

1. **Copy sandbox files to Pi:**
```bash
scp -r sandbox/ pi@sandbox.spintheweb.org:~/webspinner/
```

2. **Deploy complete sandbox:**
```bash
ssh pi@sandbox.spintheweb.org
cd ~/webspinner/sandbox
./deploy.sh
```

3. **Access the sandbox playground:**
```bash
https://sandbox.spintheweb.org         # Main framework sandbox
https://sandbox.spintheweb.org:8081    # Database playground (Adminer)
https://sandbox.spintheweb.org:9000    # Container management (Portainer)
```

### 2. Local Development

1. **Start all containers:**
```bash
cd sandbox/
docker compose up -d
```

2. **Wait for initialization** (may take 5-10 minutes for first run)

3. **Access locally:**
- Framework: `http://localhost:8080`
- Database admin: `http://localhost:8081`
- Container admin: `http://localhost:9000`

## Management Commands

### Container Management:
```bash
# View all container status
docker compose ps

# View logs for specific service
docker compose logs -f webspinner
docker compose logs -f mysql-sample

# Restart specific service
docker compose restart webspinner

# Stop all services
docker compose down

# Stop and remove all data
docker compose down -v
```

### Database Management:
```bash
# Backup MySQL
docker exec spintheweb-mysql mysqldump -u root -prootpass123 qt3ul9nb_sampledb > mysql_backup.sql

# Backup PostgreSQL
docker exec spintheweb-postgres pg_dump -U neon_user pagila > postgres_backup.sql

# Backup MongoDB
docker exec spintheweb-mongodb mongodump --db sample_mflix --out /tmp/backup
```

### Health Checks:
```bash
# Test database connections
docker exec spintheweb-mysql mysql -u root -prootpass123 -e "SELECT 1"
docker exec spintheweb-postgres psql -U neon_user -d pagila -c "SELECT 1"
docker exec spintheweb-mongodb mongo --eval "db.runCommand('ping')"
```

## Troubleshooting

### Common Issues:

1. **Port conflicts**: Ensure ports 3306, 5432, 1433, 27017, 1521, 8080, 8081, and 9000 are available
2. **Memory issues**: Oracle requires at least 2GB RAM
3. **Initialization delays**: First startup may take 5-10 minutes for all databases
4. **Connection refused**: Wait for databases to fully initialize before connecting

### Resource Monitoring:
```bash
# Monitor container resource usage
docker stats

# Check Pi system resources
htop
df -h
free -h
```

## Security Considerations

For production deployment:
1. **Change all default passwords**
2. **Use environment variables for sensitive data**
3. **Configure proper firewall rules**
4. **Use SSL/TLS certificates** (handled by Caddyfile)
5. **Implement database user access controls**
6. **Regular security updates**

## File Structure

```
sandbox/
├── docker-compose.yml           # Complete sandbox environment
├── deploy.sh                   # Automated deployment script
├── Caddyfile                   # Reverse proxy configuration
├── README.md                   # This file - complete sandbox guide
└── databases/                  # Sample data initialization scripts
    ├── mysql/
    │   └── 01-init-sample-data.sql
    ├── postgres/
    │   └── 01-init-pagila-sample.sql
    ├── sqlserver/
    │   └── 01-init-adventureworkslt.sql
    ├── mongodb/
    │   └── 01-init-sample-mflix.js
    └── oracle/
        └── 01-init-hr-schema.sql
```

Each database has its own initialization directory with sample data scripts that are automatically executed when the containers start for the first time.

## Getting Support

For issues with the Spin the Web framework sandbox:
1. Check the [troubleshooting section](#troubleshooting) above
2. Review container logs: `docker compose logs -f`
3. Verify Pi resources: `htop` and `df -h`
4. Visit the project documentation in the `wiki/` folder
| MongoDB | ~400MB | Low | ~300MB | Document database playground |
| Oracle | ~1.5GB | Medium | ~2GB | Enterprise playground |
| Adminer | ~32MB | Minimal | ~50MB | Database interface |
| Portainer | ~32MB | Minimal | ~50MB | Container management |
| **Sandbox Total** | **~3.87GB** | **Medium** | **~4.5GB** |

Leaves ~4GB RAM for OS and user experiments - perfect for a learning environment! 🎯

## Quick Deployment

Since your Pi already responds to `https://sandbox.spintheweb.org`:

1. **Transfer sandbox project to Pi:**
```bash
scp -r . pi@sandbox.spintheweb.org:~/webspinner/
```

2. **Deploy complete sandbox:**
```bash
ssh pi@sandbox.spintheweb.org
cd ~/webspinner/sandbox
./deploy.sh
```

3. **Access the sandbox playground:**
```bash
https://sandbox.spintheweb.org         # Main framework sandbox
https://sandbox.spintheweb.org:8081    # Database playground
https://sandbox.spintheweb.org:9000    # Container management
```

## Example Sandbox Usage

Once deployed, users can explore the Spin the Web framework:

```bash
# Access the main sandbox
https://sandbox.spintheweb.org

# Experiment with sample webbases
https://sandbox.spintheweb.org/webbase/ecommerce-demo
https://sandbox.spintheweb.org/webbase/media-browser
https://sandbox.spintheweb.org/webbase/business-dashboard

# API endpoints for framework exploration
https://sandbox.spintheweb.org/api/webbases
https://sandbox.spintheweb.org/api/datasources

# WebSocket playground for real-time features
wss://sandbox.spintheweb.org/ws/live-data
```

Your Pi becomes a complete **Spin the Web framework playground** accessible at `https://sandbox.spintheweb.org`! 🎮🚀