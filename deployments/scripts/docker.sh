#!/bin/bash
# Webspinner Docker Release Script
# Builds Docker image, tags versions, and optionally pushes to registry
# Usage: ./deployments/scripts/docker.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Webspinner Docker Release Generator${NC}"
echo "====================================="
echo ""

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: 'docker' command not found. Please install Docker.${NC}"
    exit 1
fi

if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}Warning: 'gh' CLI not found. GitHub release creation will be skipped.${NC}"
    echo -e "${YELLOW}Install gh CLI: https://cli.github.com/${NC}"
    GH_AVAILABLE=false
else
    GH_AVAILABLE=true
fi

# Get current directory (should be repo root)
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$REPO_ROOT"

echo "Repository: $REPO_ROOT"
echo ""

# Use fixed version
VERSION="v1.0.0"

# Extract version without 'v' prefix for Docker tags
VERSION_NUM="${VERSION#v}"

echo -e "${GREEN}Creating Docker release for version: $VERSION${NC}"
echo ""

# Prompt for Docker registry/repository
echo "Docker image naming:"
read -p "Registry/Repository [spintheweb/webspinner]: " DOCKER_REPO
DOCKER_REPO=${DOCKER_REPO:-spintheweb/webspinner}

echo ""
echo -e "${BLUE}Docker images to be created:${NC}"
echo "  - ${DOCKER_REPO}:${VERSION_NUM}"
echo "  - ${DOCKER_REPO}:${VERSION}"
echo "  - ${DOCKER_REPO}:latest"
echo ""

# Check if git tag already exists
if git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Tag $VERSION already exists${NC}"
    read -p "Continue anyway? (y/n): " CONTINUE
    if [[ ! "$CONTINUE" =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 0
    fi
fi

# Build Docker image
echo -e "${BLUE}Step 1: Building Docker image...${NC}"
echo "This may take a few minutes..."
echo ""

docker build \
    --build-arg VERSION="${VERSION_NUM}" \
    --tag "${DOCKER_REPO}:${VERSION_NUM}" \
    --tag "${DOCKER_REPO}:${VERSION}" \
    --tag "${DOCKER_REPO}:latest" \
    -f Dockerfile \
    .

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Docker build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}✓ Docker image built successfully${NC}"

# Show image info
echo ""
echo -e "${BLUE}Image information:${NC}"
docker images "${DOCKER_REPO}" --format "table {{.Repository}}\t{{.Tag}}\t{{.Size}}\t{{.CreatedAt}}"

# Test the image
echo ""
echo -e "${BLUE}Step 2: Testing Docker image...${NC}"
read -p "Run quick test? (y/n) [y]: " RUN_TEST
RUN_TEST=${RUN_TEST:-y}

if [[ "$RUN_TEST" =~ ^[Yy]$ ]]; then
    echo "Starting test container (will stop after 10 seconds)..."
    
    # Start container in background
    TEST_CONTAINER=$(docker run -d -p 8081:8080 "${DOCKER_REPO}:${VERSION_NUM}")
    
    # Wait for startup
    sleep 5
    
    # Test if it responds
    if curl -f -s http://localhost:8081 > /dev/null; then
        echo -e "${GREEN}✓ Container is responding${NC}"
    else
        echo -e "${YELLOW}⚠ Container started but not responding (may need more time)${NC}"
    fi
    
    # Stop and remove test container
    docker stop "$TEST_CONTAINER" > /dev/null
    docker rm "$TEST_CONTAINER" > /dev/null
    
    echo -e "${GREEN}✓ Test complete${NC}"
fi

# Push to registry
echo ""
echo -e "${BLUE}Step 3: Push to Docker Hub${NC}"
read -p "Push images to Docker Hub (${DOCKER_REPO})? (y/n) [y]: " PUSH_IMAGES
PUSH_IMAGES=${PUSH_IMAGES:-y}

if [[ "$PUSH_IMAGES" =~ ^[Yy]$ ]]; then
    echo "Pushing images to Docker Hub..."
    
    docker push "${DOCKER_REPO}:${VERSION_NUM}"
    docker push "${DOCKER_REPO}:${VERSION}"
    docker push "${DOCKER_REPO}:latest"
    
    echo -e "${GREEN}✓ Images pushed to Docker Hub${NC}"
    echo ""
    echo "Published images:"
    echo "  ${DOCKER_REPO}:${VERSION_NUM}"
    echo "  ${DOCKER_REPO}:${VERSION}"
    echo "  ${DOCKER_REPO}:latest"
    echo ""
    echo "Users can pull with:"
    echo "  docker pull ${DOCKER_REPO}:${VERSION_NUM}"
    echo "  docker pull ${DOCKER_REPO}:latest"
else
    echo "Skipped pushing to Docker Hub."
    echo ""
    echo "To push later:"
    echo "  docker push ${DOCKER_REPO}:${VERSION_NUM}"
    echo "  docker push ${DOCKER_REPO}:${VERSION}"
    echo "  docker push ${DOCKER_REPO}:latest"
fi

# Export image as tar.gz (for GitHub release)
echo ""
echo -e "${BLUE}Step 4: Export image archive${NC}"
read -p "Export image as tar.gz for offline distribution? (y/n) [y]: " EXPORT_IMAGE
EXPORT_IMAGE=${EXPORT_IMAGE:-y}

if [[ "$EXPORT_IMAGE" =~ ^[Yy]$ ]]; then
    OUTPUT_DIR="deployments/release"
    mkdir -p "$OUTPUT_DIR"
    
    TAR_FILE="${OUTPUT_DIR}/webspinner-docker-${VERSION}.tar.gz"
    
    echo "Exporting image (this may take a while)..."
    docker save "${DOCKER_REPO}:${VERSION_NUM}" | gzip > "$TAR_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Image exported: $TAR_FILE${NC}"
        
        # Generate checksum
        CHECKSUM_FILE="${TAR_FILE}.sha256"
        cd "$OUTPUT_DIR"
        sha256sum "$(basename "$TAR_FILE")" > "$(basename "$CHECKSUM_FILE")"
        cd "$REPO_ROOT"
        
        echo -e "${GREEN}✓ Checksum: $(cat "$CHECKSUM_FILE")${NC}"
        
        TAR_SIZE=$(du -h "$TAR_FILE" | cut -f1)
        echo -e "${BLUE}Archive size: $TAR_SIZE${NC}"
    else
        echo -e "${RED}Error: Failed to export image${NC}"
    fi
fi

# Git tag
echo ""
echo -e "${BLUE}Step 5: Creating Git tag...${NC}"
read -p "Create git tag '$VERSION'? (y/n) [y]: " CREATE_TAG
CREATE_TAG=${CREATE_TAG:-y}

if [[ "$CREATE_TAG" =~ ^[Yy]$ ]]; then
    if git rev-parse "$VERSION" >/dev/null 2>&1; then
        echo -e "${YELLOW}Tag $VERSION already exists. Skipping tag creation.${NC}"
    else
        git tag -a "$VERSION" -m "Release $VERSION (Docker)"
        echo -e "${GREEN}✓ Git tag created: $VERSION${NC}"
        
        read -p "Push tag to remote? (y/n) [y]: " PUSH_TAG
        PUSH_TAG=${PUSH_TAG:-y}
        if [[ "$PUSH_TAG" =~ ^[Yy]$ ]]; then
            git push origin "$VERSION"
            echo -e "${GREEN}✓ Tag pushed to remote${NC}"
        fi
    fi
fi

# GitHub Release
echo ""
if [ "$GH_AVAILABLE" = true ] && [ -f "$TAR_FILE" ]; then
    echo -e "${BLUE}Step 6: Creating GitHub Release...${NC}"
    read -p "Create GitHub release? (y/n) [y]: " CREATE_RELEASE
    CREATE_RELEASE=${CREATE_RELEASE:-y}
    
    if [[ "$CREATE_RELEASE" =~ ^[Yy]$ ]]; then
        RELEASE_NOTES="## Webspinner $VERSION - Docker Release

### Docker Images
\`\`\`bash
# Pull from Docker Hub
docker pull ${DOCKER_REPO}:${VERSION_NUM}
docker pull ${DOCKER_REPO}:latest

# Run with docker-compose
docker-compose up -d

# Or run directly
docker run -d -p 8080:8080 ${DOCKER_REPO}:${VERSION_NUM}
\`\`\`

### Offline Installation
For environments without internet access:
\`\`\`bash
# Load the image
gunzip -c webspinner-docker-${VERSION}.tar.gz | docker load

# Run
docker run -d -p 8080:8080 ${DOCKER_REPO}:${VERSION_NUM}
\`\`\`

### Verification
\`\`\`bash
sha256sum -c webspinner-docker-${VERSION}.tar.gz.sha256
\`\`\`

### Configuration
See \`docker-compose.yml\` for environment variables and volume mounts.

For more information, see the [documentation](https://github.com/spintheweb/webspinner)."

        gh release create "$VERSION" \
            --title "Release $VERSION (Docker)" \
            --notes "$RELEASE_NOTES" \
            "$TAR_FILE" \
            "$CHECKSUM_FILE"
        
        echo -e "${GREEN}✓ GitHub release created${NC}"
        echo -e "${BLUE}View at: https://github.com/spintheweb/webspinner/releases/tag/$VERSION${NC}"
    fi
else
    if [ "$GH_AVAILABLE" = false ]; then
        echo -e "${YELLOW}Step 6: GitHub CLI not available${NC}"
    fi
    
    if [ -f "$TAR_FILE" ]; then
        echo "To create release manually:"
        echo "  1. Go to: https://github.com/spintheweb/webspinner/releases/new"
        echo "  2. Choose tag: $VERSION"
        echo "  3. Upload: $TAR_FILE"
        echo "  4. Upload: $CHECKSUM_FILE"
    fi
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo -e "${GREEN}Docker Release Complete!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "Docker images: ${BLUE}${DOCKER_REPO}:${VERSION_NUM}, :latest${NC}"

if [ -f "$TAR_FILE" ]; then
    echo -e "Offline archive: ${BLUE}$TAR_FILE${NC}"
    echo -e "Size: ${BLUE}$TAR_SIZE${NC}"
fi

echo ""
echo "Quick start:"
echo "  docker run -d -p 8080:8080 ${DOCKER_REPO}:${VERSION_NUM}"
echo "  # Or use docker-compose:"
echo "  docker-compose up -d"
echo ""
