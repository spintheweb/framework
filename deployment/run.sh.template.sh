#!/bin/bash
set -e

# --- Configuration ---
# These variables should match the ones in upgrade.sh
IMAGE_NAME="your_dockerhub_username/spintheweb:latest"
CONTAINER_NAME="stw-container"
PUBLIC_DIR="/var/www/spintheweb/public"
ENV_FILE="/var/www/spintheweb/.env"

# --- Run Command ---
echo "Starting container: $CONTAINER_NAME"
docker run -d --rm \
  -p 443:443 \
  -p 8000:8000 \
  --name $CONTAINER_NAME \
  --env-file $ENV_FILE \
  -v "${PUBLIC_DIR}:/app/public" \
  $IMAGE_NAME

echo "Container started successfully."