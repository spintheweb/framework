#!/bin/bash
# Spin the Web — Server installer wrapper
# If a self-extracting installer (server.sh) is available in deployment/release,
# run it. Otherwise, fetch the latest release from GitHub and run it.

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}Spin the Web — Server install${NC}"
echo "================================"

THIS_DIR="$(cd "$(dirname "$0")" && pwd)"
# Prefer installer next to this script; fallback to ./release
LOCAL_INSTALLER=""
if [ -f "$THIS_DIR/server.sh" ]; then
  LOCAL_INSTALLER="$THIS_DIR/server.sh"
elif [ -f "$THIS_DIR/release/server.sh" ]; then
  LOCAL_INSTALLER="$THIS_DIR/release/server.sh"
else
  LOCAL_INSTALLER=""
fi
RELEASE_URL_API="https://api.github.com/repos/spintheweb/webspinner/releases/latest"

run_local() {
  chmod +x "$LOCAL_INSTALLER" || true
  echo -e "${GREEN}Running local installer: ${LOCAL_INSTALLER}${NC}"
  exec sudo "$LOCAL_INSTALLER"
}

download_and_run() {
  if ! command -v curl >/dev/null 2>&1 && ! command -v wget >/dev/null 2>&1; then
    echo -e "${RED}Neither curl nor wget present to download installer.${NC}"
    exit 1
  fi

  TMP_DIR=$(mktemp -d)
  INSTALLER="$TMP_DIR/server.sh"

  echo -e "${BLUE}Fetching latest release info...${NC}"
  if command -v curl >/dev/null 2>&1; then
    JSON=$(curl -fsSL "$RELEASE_URL_API")
  else
    JSON=$(wget -qO- "$RELEASE_URL_API")
  fi
  DL_URL=$(printf "%s" "$JSON" | sed -n 's/.*browser_download_url": "\(.*[^/]*server.sh\)".*/\1/p' | head -n1)
  SHASUM_URL=$(printf "%s" "$JSON" | sed -n 's/.*browser_download_url": "\(.*[^/]*server.sh.sha256\)".*/\1/p' | head -n1)

  if [ -z "$DL_URL" ]; then
    echo -e "${RED}Could not determine latest installer URL from GitHub releases.${NC}"
    exit 1
  fi

  echo -e "${BLUE}Downloading installer...${NC}"
  if command -v curl >/dev/null 2>&1; then
    curl -fsSL "$DL_URL" -o "$INSTALLER"
    [ -n "${SHASUM_URL:-}" ] && curl -fsSL "$SHASUM_URL" -o "$INSTALLER.sha256" || true
  else
    wget -q "$DL_URL" -O "$INSTALLER"
    [ -n "${SHASUM_URL:-}" ] && wget -q "$SHASUM_URL" -O "$INSTALLER.sha256" || true
  fi

  if [ -s "$INSTALLER.sha256" ] && command -v sha256sum >/dev/null 2>&1; then
    echo -e "${BLUE}Verifying checksum...${NC}"
    (cd "$TMP_DIR" && sha256sum -c "$(basename "$INSTALLER").sha256") || {
    echo -e "${YELLOW}Checksum verification failed or unavailable. Proceeding anyway...${NC}"
    }
  fi

  chmod +x "$INSTALLER"
  echo -e "${GREEN}Launching installer (sudo)...${NC}"
  exec sudo "$INSTALLER"
}

if [ -n "$LOCAL_INSTALLER" ] && [ -f "$LOCAL_INSTALLER" ]; then
  run_local
else
  read -rp "No local installer found. Download latest and install? (Y/n): " REPLY
  REPLY=${REPLY:-Y}
  if [[ "$REPLY" =~ ^[Yy]$ ]]; then
    download_and_run
  else
  echo "Aborted. Place server.sh into deployment/release and re-run."
    exit 1
  fi
fi
