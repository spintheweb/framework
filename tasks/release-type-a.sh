#!/bin/bash
# Webspinner Type A Release Script
# Creates a sanitized release archive and publishes to GitHub
# Usage: ./tasks/release-type-a.sh

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Webspinner Type A Release Generator${NC}"
echo "===================================="
echo ""

# Check prerequisites
if ! command -v zip &> /dev/null; then
    echo -e "${RED}Error: 'zip' command not found. Please install zip.${NC}"
    exit 1
fi

if ! command -v sha256sum &> /dev/null; then
    echo -e "${RED}Error: 'sha256sum' command not found.${NC}"
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
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

echo "Repository: $REPO_ROOT"
echo ""

# Prompt for version
read -p "Enter version (e.g., v1.0.0): " VERSION

if [ -z "$VERSION" ]; then
    echo -e "${RED}Error: Version cannot be empty${NC}"
    exit 1
fi

# Ensure version starts with 'v'
if [[ ! "$VERSION" =~ ^v ]]; then
    VERSION="v${VERSION}"
fi

echo -e "${BLUE}Creating release for version: ${VERSION}${NC}"
echo ""

# Check if tag already exists
if git rev-parse "$VERSION" >/dev/null 2>&1; then
    echo -e "${YELLOW}Warning: Git tag '${VERSION}' already exists${NC}"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
fi

# Define output paths
DEPLOY_DIR="deployments/deploy"
ZIPNAME="webspinner-${VERSION}.zip"
ZIPPATH="${DEPLOY_DIR}/${ZIPNAME}"
CHECKSUMPATH="${ZIPPATH}.sha256"

# Create deploy directory
mkdir -p "$DEPLOY_DIR"

# Remove existing files if present
if [ -f "$ZIPPATH" ]; then
    echo -e "${YELLOW}Removing existing ${ZIPNAME}${NC}"
    rm -f "$ZIPPATH"
fi

if [ -f "$CHECKSUMPATH" ]; then
    rm -f "$CHECKSUMPATH"
fi

# Create the release archive
echo -e "${BLUE}Creating release archive...${NC}"

# First, create a temporary copy of .env.example as .env for the archive
cp .env.example .env.temp

zip -r "$ZIPPATH" \
    public \
    stwComponents \
    stwContents \
    stwElements \
    stwStyles \
    LICENSE \
    stwSpinner.ts \
    .env.temp \
    .cert/README.md \
    -x "*.git*" \
    -x "*node_modules*" \
    -x "*.pem" \
    -x "*.key" \
    -x "*/.DS_Store" \
    > /dev/null

# Rename .env.temp to .env inside the zip
echo -e "${BLUE}Renaming .env.temp to .env in archive...${NC}"
printf "@ .env.temp\n@=.env\n" | zipnote -w "$ZIPPATH" > /dev/null 2>&1

# Clean up temporary file
rm -f .env.temp

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to create zip archive${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Created: ${ZIPPATH}${NC}"
ls -lh "$ZIPPATH"
echo ""

# Generate SHA256 checksum
echo -e "${BLUE}Generating SHA256 checksum...${NC}"
sha256sum "$ZIPPATH" > "$CHECKSUMPATH"

if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to generate checksum${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Created: ${CHECKSUMPATH}${NC}"
cat "$CHECKSUMPATH"
echo ""

# Verify archive integrity
echo -e "${BLUE}Verifying archive integrity...${NC}"
if unzip -t "$ZIPPATH" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Archive integrity verified${NC}"
else
    echo -e "${RED}Error: Archive is corrupted${NC}"
    exit 1
fi
echo ""

# List archive contents summary
echo -e "${BLUE}Archive contents summary:${NC}"
unzip -l "$ZIPPATH" | tail -n 1
echo ""

# Ask if user wants to create git tag
read -p "Create git tag '${VERSION}'? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Creating git tag...${NC}"
    
    # Prompt for tag message
    read -p "Enter tag message (or press Enter for default): " TAG_MESSAGE
    if [ -z "$TAG_MESSAGE" ]; then
        TAG_MESSAGE="Release ${VERSION}"
    fi
    
    # Check if user wants signed tag
    read -p "Create signed tag (requires GPG)? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git tag -s "$VERSION" -m "$TAG_MESSAGE"
    else
        git tag -a "$VERSION" -m "$TAG_MESSAGE"
    fi
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ Tag created: ${VERSION}${NC}"
        
        read -p "Push tag to origin? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            git push origin "$VERSION"
            echo -e "${GREEN}✓ Tag pushed to origin${NC}"
        fi
    else
        echo -e "${RED}Error: Failed to create tag${NC}"
    fi
    echo ""
fi

# Create GitHub release if gh CLI is available
if [ "$GH_AVAILABLE" = true ]; then
    read -p "Create GitHub release? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${BLUE}Creating GitHub release...${NC}"
        
        # Prompt for release notes
        echo "Enter release notes (press Ctrl+D when done):"
        RELEASE_NOTES=$(cat)
        
        if [ -z "$RELEASE_NOTES" ]; then
            RELEASE_NOTES="Release ${VERSION}

## Installation

1. Download and verify:
   \`\`\`bash
   sha256sum -c ${ZIPNAME}.sha256
   \`\`\`
2. Extract to your server
3. Copy \`.env.example\` to \`.env\` and configure
4. Generate SSL certs (see \`.cert/README.md\`)
5. Run: \`deno run --allow-all stwSpinner.ts\`

## Requirements
- Deno 1.x or later
- MySQL (or other supported database)

## What's included
- Complete Webspinner runtime
- All core modules and content types
- Example configuration and documentation"
        fi
        
        # Create release
        gh release create "$VERSION" \
            "$ZIPPATH" \
            "$CHECKSUMPATH" \
            --title "Webspinner ${VERSION}" \
            --notes "$RELEASE_NOTES"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✓ GitHub release created successfully${NC}"
            echo -e "${GREEN}View at: https://github.com/spintheweb/webspinner/releases/tag/${VERSION}${NC}"
        else
            echo -e "${RED}Error: Failed to create GitHub release${NC}"
            echo -e "${YELLOW}You can create it manually:${NC}"
            echo "  gh release create $VERSION $ZIPPATH $CHECKSUMPATH"
        fi
    fi
else
    echo -e "${YELLOW}GitHub CLI not available. To create release manually:${NC}"
    echo "  1. Push tag: git push origin $VERSION"
    echo "  2. Create release: gh release create $VERSION $ZIPPATH $CHECKSUMPATH"
    echo "  3. Or use GitHub web UI: https://github.com/spintheweb/webspinner/releases/new"
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Release ${VERSION} created successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Artifacts created:"
echo "  - $ZIPPATH"
echo "  - $CHECKSUMPATH"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Test the release locally"
echo "  2. Update CHANGELOG.md"
echo "  3. Announce the release"
