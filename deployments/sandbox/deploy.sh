#!/bin/bash
# Raspberry Pi 5 Spin the Web Sandbox Deployment Script
# Deploy the complete Spin the Web framework sandbox to your Pi

set -e

echo "Deploying Spin the Web Sandbox to Raspberry Pi 5..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}sandbox.spintheweb.org - Your playground for the Spin the Web framework${NC}"
echo -e "${BLUE}Webspinner runtime + rich datasources + management tools${NC}"

# Check if running on Pi
if ! grep -q "Raspberry Pi" /proc/device-tree/model 2>/dev/null; then
    echo -e "${YELLOW}Warning: This doesn't appear to be a Raspberry Pi${NC}"
fi

# Check Docker installation
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Installing Docker...${NC}"
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    echo -e "${GREEN}Docker installed. Please logout and login again, then re-run this script.${NC}"
    exit 1
fi

# Check Docker Compose
if ! docker compose version &> /dev/null; then
    echo -e "${RED}Docker Compose plugin not found. Installing...${NC}"
    sudo apt update
    sudo apt install docker-compose-plugin -y
fi

# Check system resources
TOTAL_RAM=$(free -g | awk 'NR==2{print $2}')
if [ "$TOTAL_RAM" -lt 7 ]; then
    echo -e "${YELLOW}Warning: Less than 8GB RAM detected. Oracle may not start properly.${NC}"
fi

# Check available disk space (need at least 10GB)
AVAILABLE_SPACE=$(df / | awk 'NR==2 {print $4}')
if [ "$AVAILABLE_SPACE" -lt 10485760 ]; then # 10GB in KB
    echo -e "${RED}Error: Less than 10GB free disk space available${NC}"
    exit 1
fi

# Create project directory
WEBSPINNER_DIR="$HOME/webspinner/deployments/sandbox"
mkdir -p "$WEBSPINNER_DIR"
cd "$WEBSPINNER_DIR"

echo "Working directory: $WEBSPINNER_DIR"

# Check if database-init directory exists
if [ ! -d "databases" ]; then
    echo -e "${RED}Error: databases directory not found. Please copy it from your development machine.${NC}"
    echo "Run this on your Windows machine:"
    echo "scp -r deployments/sandbox/databases/ pi@$(hostname -I | awk '{print $1}'):~/webspinner/deployments/sandbox/"
    exit 1
fi

# Check if Docker Compose file exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}Error: docker-compose.yml not found. Please copy it from your development machine.${NC}"
    echo "Run this on your Windows machine:"
    echo "scp docker-compose.yml pi@$(hostname -I | awk '{print $1}'):~/webspinner/deployments/sandbox/"
    exit 1
fi

# Check if Dockerfile exists for webspinner app (under deployments/docker two levels up)
if [ ! -f "../../deployments/docker/Dockerfile" ]; then
    echo -e "${RED}Error: ../../deployments/docker/Dockerfile not found. Please copy the entire webspinner project root to ~/webspinner.${NC}"
    echo "From your development machine, copy the repo root (containing deployments/docker/Dockerfile) to the Pi."
    exit 1
fi

# System optimization for databases
echo "Optimizing system for database workloads..."

# Increase swap if needed
CURRENT_SWAP=$(free -m | awk 'NR==3{print $2}')
if [ "$CURRENT_SWAP" -lt 2048 ]; then
    echo "Increasing swap to 2GB..."
    sudo dphys-swapfile swapoff || true
    sudo sed -i 's/CONF_SWAPSIZE=.*/CONF_SWAPSIZE=2048/' /etc/dphys-swapfile
    sudo dphys-swapfile setup
    sudo dphys-swapfile swapon
fi

# Optimize kernel parameters
echo "Optimizing kernel parameters..."
sudo tee /etc/sysctl.d/99-database.conf > /dev/null << 'EOF'
# Database optimizations for Pi 5
vm.swappiness=10
vm.dirty_ratio=5
vm.dirty_background_ratio=2
vm.overcommit_memory=1
net.core.somaxconn=1024
EOF

sudo sysctl -p /etc/sysctl.d/99-database.conf

# Pull all images first (this takes time)
echo "Pulling Docker images for sandbox environment (may take 10-15 minutes)..."
docker compose -f docker-compose.yml pull

# Create and start containers
echo "Starting Spin the Web sandbox environment..."
docker compose -f docker-compose.yml up -d --build

echo "Waiting for sandbox services to initialize (10-15 minutes)..."

# Function to check if a container is healthy
check_container() {
    local container_name=$1
    local max_attempts=60
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if docker inspect "$container_name" --format '{{.State.Status}}' | grep -q "running"; then
            return 0
        fi
        echo -n "."
        sleep 5
        ((attempt++))
    done
    return 1
}

# Check each container
containers=("spintheweb-mysql" "spintheweb-postgres" "spintheweb-mongodb" "spintheweb-adminer" "spintheweb-portainer" "spintheweb-app")
for container in "${containers[@]}"; do
    echo -n "Checking $container"
    if check_container "$container"; then
    echo -e " ${GREEN}OK${NC}"
    else
    echo -e " ${RED}FAIL${NC}"
    fi
done

# Test database connections
echo "Testing database connections..."

# MySQL
if docker exec spintheweb-mysql mysql -u root -prootpass123 -e "SELECT 'MySQL OK'" >/dev/null 2>&1; then
    echo -e "MySQL: ${GREEN}Connected${NC}"
else
    echo -e "MySQL: ${YELLOW}Still initializing${NC}"
fi

# PostgreSQL
if docker exec spintheweb-postgres psql -U neon_user -d pagila -c "SELECT 'PostgreSQL OK'" >/dev/null 2>&1; then
    echo -e "PostgreSQL: ${GREEN}Connected${NC}"
else
    echo -e "PostgreSQL: ${YELLOW}Still initializing${NC}"
fi

# MongoDB
if docker exec spintheweb-mongodb mongosh --quiet --eval "db.runCommand('ping')" >/dev/null 2>&1; then
    echo -e "MongoDB: ${GREEN}Connected${NC}"
else
    echo -e "MongoDB: ${YELLOW}Still initializing${NC}"
fi

# Webspinner Runtime
if curl -s https://sandbox.spintheweb.org >/dev/null 2>&1; then
    echo -e "Webspinner Runtime: ${GREEN}WBDL interpreter running${NC}"
elif curl -s http://localhost:8080 >/dev/null 2>&1; then
    echo -e "Webspinner Runtime: ${GREEN}Running (HTTP only)${NC}"
else
    echo -e "Webspinner Runtime: ${YELLOW}Still initializing${NC}"
fi

# Show status
echo "Container Status:"
docker compose -f docker-compose.yml ps

# Show resource usage
echo "Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"

# Get Pi IP address and domain
PI_IP=$(hostname -I | awk '{print $1}')
PI_DOMAIN="sandbox.spintheweb.org"

echo -e "\n${GREEN}Spin the Web Sandbox Deployment Complete!${NC}"
echo -e "\nPublic access (via Caddy/TLS):"
echo -e "   ${GREEN}https://$PI_DOMAIN${NC} - Spin the Web sandbox (Webspinner)"

echo -e "\nLocal management on the Pi (or via SSH tunnels):"
echo -e "   Webspinner (HTTP): ${GREEN}http://localhost:8080${NC}"
echo -e "   Adminer (DB UI):   ${GREEN}http://localhost:8081${NC}"
echo -e "   Portainer (UI):    ${GREEN}http://localhost:9000${NC}"

echo -e "\nDatabase ports (bound to localhost on the host for security):"
echo -e "   MySQL:       ${GREEN}localhost:3306${NC}"
echo -e "   PostgreSQL:  ${GREEN}localhost:5432${NC}"
echo -e "   SQL Server:  ${GREEN}localhost:1433${NC}"
echo -e "   MongoDB:     ${GREEN}localhost:27017${NC}"
echo -e "   Oracle:      ${GREEN}localhost:1521${NC}"

echo -e "\nTip: To access Adminer/Portainer or DB ports remotely, create SSH tunnels, e.g.:"
echo -e "   ssh -N -L 8081:127.0.0.1:8081 pi@$PI_DOMAIN"
echo -e "   ssh -N -L 9000:127.0.0.1:9000 pi@$PI_DOMAIN"
echo -e "   ssh -N -L 3306:127.0.0.1:3306 pi@$PI_DOMAIN  # and similar for other DB ports"

echo -e "\nUseful sandbox management commands (run on the Pi):"
echo -e "   View logs:    ${YELLOW}docker compose -f docker-compose.yml logs -f${NC}"
echo -e "   Stop sandbox: ${YELLOW}docker compose -f docker-compose.yml down${NC}"
echo -e "   Restart all:  ${YELLOW}docker compose -f docker-compose.yml restart${NC}"
echo -e "   Resource use: ${YELLOW}docker stats${NC}"
echo -e "   Webspinner:   ${YELLOW}docker logs spintheweb-app${NC}"

# Create systemd service for auto-start
read -p "Do you want to enable auto-start on boot? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo tee /etc/systemd/system/webspinner-sandbox.service > /dev/null << EOF
[Unit]
Description=Spin the Web Sandbox Environment
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$WEBSPINNER_DIR
ExecStart=/usr/bin/docker compose -f docker-compose.yml up -d
ExecStop=/usr/bin/docker compose -f docker-compose.yml down
User=$USER

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable webspinner-sandbox.service
    echo -e "${GREEN}Auto-start enabled for sandbox${NC}"
fi

echo -e "\nYour Raspberry Pi is now running the Spin the Web Sandbox!"
echo -e "   ${GREEN}Playground Environment${NC} - Complete framework sandbox at sandbox.spintheweb.org"
echo -e "   ${GREEN}Webspinner Runtime${NC} - WBDL interpreter with HTTP/WebSocket endpoints"
echo -e "   ${GREEN}Rich Datasources${NC} - 5 databases with sample data for experiments"
echo -e "   ${GREEN}Management Tools${NC} - Database and container administration interfaces"
echo -e "\n   Start exploring the Spin the Web framework!"