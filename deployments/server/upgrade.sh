#!/bin/bash
set -e

IMAGE_NAME="spintheweb/webspinner:latest"
CONTAINER_NAME="stw-container"
BASE_DIR="/opt/spintheweb"
PUBLIC_DIR="${BASE_DIR}/public"

echo "Pulling latest image: $IMAGE_NAME"
docker pull "$IMAGE_NAME"

echo "Extracting core client assets from the new image..."
TEMP_CONTAINER_ID=$(docker create "$IMAGE_NAME")
mkdir -p "$PUBLIC_DIR/scripts" "$PUBLIC_DIR/styles"
docker cp "$TEMP_CONTAINER_ID":/app/public/scripts/stwClient.js "$PUBLIC_DIR"/scripts/
docker cp "$TEMP_CONTAINER_ID":/app/public/styles/stwStyle.css "$PUBLIC_DIR"/styles/
docker rm -v "$TEMP_CONTAINER_ID"
echo "Core assets updated."

echo "Stopping and removing old container..."
docker stop "$CONTAINER_NAME" || true
docker rm "$CONTAINER_NAME" || true

echo "Starting new container via run.sh..."
"$(dirname "$0")/run.sh"
