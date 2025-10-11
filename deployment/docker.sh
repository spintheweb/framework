#!/bin/bash
# Spin the Web — Docker quick-start and builder
# Default: pull and run the official image
# Options for maintainers: build, push, export

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Spin the Web — Docker${NC}"
echo "=================================="

if ! command -v docker >/dev/null 2>&1; then
  echo -e "${RED}Docker is not installed or not on PATH.${NC}"
  echo "Install Docker: https://docs.docker.com/get-docker/"
  exit 1
fi

DOCKER_REPO_DEFAULT="spintheweb/webspinner"
TAG_DEFAULT="latest"
HOST_PORT_DEFAULT="8080"
CONTAINER_PORT="8080"
CONTAINER_NAME="webspinner"
DATA_DIR_DEFAULT="$PWD/webspinner-data"

usage() {
  cat <<USAGE
Usage:
  $(basename "$0") [--build] [--push] [--repo REPO] [--tag TAG] [--export <file.tar.gz>] [--port HOST_PORT] [--data DATA_DIR]

Modes:
  (default) pull + run:   pulls DOCKER_REPO:TAG and starts a container
  --build               : build the image from the Dockerfile in repo root
  --push                : push built/tagged images to the registry
  --export FILE         : docker save | gzip to FILE after build (offline use)

Options:
  --repo REPO           : default ${DOCKER_REPO_DEFAULT}
  --tag TAG             : default ${TAG_DEFAULT}
  --port HOST_PORT      : default ${HOST_PORT_DEFAULT}
  --data DATA_DIR       : default ${DATA_DIR_DEFAULT}

Examples:
  # Quick run (pull latest)
  $(basename "$0")

  # Build + run locally
  $(basename "$0") --build --repo my/webspinner --tag v1.2.3

  # Build + push + export offline tarball
  $(basename "$0") --build --push --export deployment/release/webspinner-docker-v1.2.3.tar.gz --tag v1.2.3
USAGE
}

BUILD=false
PUSH=false
EXPORT_FILE=""
DOCKER_REPO="$DOCKER_REPO_DEFAULT"
TAG="$TAG_DEFAULT"
HOST_PORT="$HOST_PORT_DEFAULT"
DATA_DIR="$DATA_DIR_DEFAULT"

while [ $# -gt 0 ]; do
  case "$1" in
    --build) BUILD=true ;;
    --push) PUSH=true ;;
    --export) EXPORT_FILE="$2"; shift ;;
    --repo) DOCKER_REPO="$2"; shift ;;
    --tag) TAG="$2"; shift ;;
    --port) HOST_PORT="$2"; shift ;;
    --data) DATA_DIR="$2"; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo -e "${YELLOW}Unknown option: $1${NC}"; usage; exit 1 ;;
  esac
  shift
done

mkdir -p "$DATA_DIR"

if [ "$BUILD" = true ]; then
  echo ""
  echo -e "${BLUE}Building image ${DOCKER_REPO}:${TAG}...${NC}"
  docker build -t "${DOCKER_REPO}:${TAG}" -t "${DOCKER_REPO}:latest" -f Dockerfile .
else
  echo ""
  echo -e "${BLUE}Pulling image ${DOCKER_REPO}:${TAG}...${NC}"
  docker pull "${DOCKER_REPO}:${TAG}"
fi

if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${YELLOW}Container ${CONTAINER_NAME} exists. Stopping and removing...${NC}"
  docker rm -f "${CONTAINER_NAME}" >/dev/null 2>&1 || true
fi

echo ""
echo -e "${BLUE}Starting container...${NC}"
docker run -d \
  --name "${CONTAINER_NAME}" \
  -p "${HOST_PORT}:${CONTAINER_PORT}" \
  -v "${DATA_DIR}:/app/.data" \
  -e PORT=${CONTAINER_PORT} \
  -e SITE_ROOT=./public \
  -e SITE_WEBBASE=./.data/webbase.wbdl \
  -e COMMON_WEBBASE=./webbaselets/stwCommon.wbdl \
  -e STUDIO_WEBBASE=./webbaselets/stwStudio.wbdl \
  "${DOCKER_REPO}:${TAG}"

sleep 2

if docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${GREEN}✓ Running: ${CONTAINER_NAME}${NC}"
  echo -e "Open: ${BLUE}http://localhost:${HOST_PORT}${NC}"
else
  echo -e "${RED}Container failed to start. Check logs:${NC}"
  echo "  docker logs ${CONTAINER_NAME}"
  exit 1
fi

if [ "$PUSH" = true ]; then
  echo -e "${BLUE}Pushing ${DOCKER_REPO}:{${TAG},latest}...${NC}"
  docker push "${DOCKER_REPO}:${TAG}"
  docker push "${DOCKER_REPO}:latest"
fi

if [ -n "$EXPORT_FILE" ]; then
  echo -e "${BLUE}Exporting image to ${EXPORT_FILE}...${NC}"
  mkdir -p "$(dirname "$EXPORT_FILE")"
  docker save "${DOCKER_REPO}:${TAG}" | gzip > "$EXPORT_FILE"
  if command -v sha256sum >/dev/null 2>&1; then
    (cd "$(dirname "$EXPORT_FILE")" && sha256sum "$(basename "$EXPORT_FILE")" > "$(basename "$EXPORT_FILE").sha256")
  fi
fi

echo ""
echo "Useful commands:"
echo "  docker logs -f ${CONTAINER_NAME}"
echo "  docker restart ${CONTAINER_NAME}"
echo "  docker stop ${CONTAINER_NAME} && docker rm ${CONTAINER_NAME}"
