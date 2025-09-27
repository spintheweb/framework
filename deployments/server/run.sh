#!/bin/bash
set -e

# --- Configuration ---
IMAGE_NAME="spintheweb/webspinner:latest"
CONTAINER_NAME="stw-container"

# --- Host Directories for Persistent Data ---
# These directories live on your server and will be mounted into the container.
BASE_DIR="/opt/spintheweb"
PUBLIC_DIR="${BASE_DIR}/public"
WEBBASE_DIR="${BASE_DIR}/webbase"
CERT_DIR="${BASE_DIR}/.cert"
ENV_FILE="${BASE_DIR}/.env"

# --- Create directories if they don't exist ---
mkdir -p "$PUBLIC_DIR" "$WEBBASE_DIR" "$CERT_DIR"

echo "Starting container: $CONTAINER_NAME"
docker run -d \
  --name "$CONTAINER_NAME" \
  --restart always \
  -p 443:443 \
  -p 8000:8000 \
  -v "${PUBLIC_DIR}:/app/public" \
  -v "${WEBBASE_DIR}:/app/webbase" \
  -v "${CERT_DIR}:/app/.cert:ro" \
  -v "${ENV_FILE}:/app/.env:ro" \
  "$IMAGE_NAME"

echo "Container started successfully."
