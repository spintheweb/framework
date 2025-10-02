# Type A Release Script

Automated script to create sanitized Webspinner releases and publish to GitHub.

## What it does

1. **Prompts for version** (e.g., v1.0.0)
2. **Creates sanitized zip archive** containing:
   - `public/`, `stwComponents/`, `stwContents/`, `stwElements/`, `stwStyles/`
   - `LICENSE`, `stwSpinner.ts`
   - `.env.example` (NOT `.env` with secrets)
   - `.cert/README.md` (instructions only, no private keys)
3. **Generates SHA256 checksum**
4. **Verifies archive integrity**
5. **Optionally creates git tag** (annotated or signed)
6. **Optionally creates GitHub release** (via `gh` CLI)

## Prerequisites

Required:
- `zip` command
- `sha256sum` command
- Git

Optional (for GitHub release):
- `gh` CLI ([install here](https://cli.github.com/))

## Usage

Run from repository root:

```bash
./tasks/release-type-a.sh
```

The script will:
1. Prompt you for a version number
2. Create the release artifacts in `deployments/deploy/`
3. Ask if you want to create a git tag
4. Ask if you want to create a GitHub release

## Example Session

```bash
$ ./tasks/release-type-a.sh
Webspinner Type A Release Generator
====================================

Repository: /path/to/webspinner

Enter version (e.g., v1.0.0): 1.2.3
Creating release for version: v1.2.3

Creating release archive...
✓ Created: deployments/deploy/webspinner-v1.2.3.zip

Generating SHA256 checksum...
✓ Created: deployments/deploy/webspinner-v1.2.3.zip.sha256

Verifying archive integrity...
✓ Archive integrity verified

Create git tag 'v1.2.3'? (y/N): y
Enter tag message (or press Enter for default): 
Create signed tag (requires GPG)? (y/N): n
✓ Tag created: v1.2.3
Push tag to origin? (y/N): y
✓ Tag pushed to origin

Create GitHub release? (y/N): y
Creating GitHub release...
Enter release notes (press Ctrl+D when done):
[type your notes or press Ctrl+D for default]
✓ GitHub release created successfully
```

## Output

The script creates:
- `deployments/deploy/webspinner-vX.Y.Z.zip` (release archive)
- `deployments/deploy/webspinner-vX.Y.Z.zip.sha256` (checksum)

## Security Notes

The script automatically excludes:
- Private keys (`.pem`, `.key` files)
- `.env` file (use `.env.example` instead)
- Git metadata
- Node modules
- macOS `.DS_Store` files

## Manual GitHub Release

If `gh` CLI is not available, create the release manually:

1. Push the tag:
   ```bash
   git push origin v1.2.3
   ```

2. Create release via web UI:
   - Go to https://github.com/spintheweb/webspinner/releases/new
   - Select tag `v1.2.3`
   - Upload the zip and sha256 files
   - Add release notes

Or use `gh` CLI:
```bash
gh release create v1.2.3 \
  deployments/deploy/webspinner-v1.2.3.zip \
  deployments/deploy/webspinner-v1.2.3.zip.sha256 \
  -t "Webspinner v1.2.3" \
  -n "Release notes..."
```

## Verification

Users can verify the release:

```bash
sha256sum -c webspinner-v1.2.3.zip.sha256
```

## Troubleshooting

**Error: 'zip' command not found**
- Windows (Git Bash): Install via Chocolatey: `choco install zip`
- Linux: `sudo apt install zip`
- macOS: `brew install zip`

**Error: 'sha256sum' command not found**
- macOS: Use `shasum -a 256` instead (edit script line 87)

**Error: 'gh' command not found**
- Install GitHub CLI: https://cli.github.com/
- Or skip GitHub release step and create manually

**Tag already exists**
- Delete tag: `git tag -d v1.2.3 && git push origin :refs/tags/v1.2.3`
- Or continue with existing tag (script will warn)
