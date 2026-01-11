# Build Notes

## Platform Building Status

### ✅ Windows (Tested Locally with act)
- **Status**: Working perfectly
- **Outputs**: 
  - `Minecraft Config Editor-Portable-1.0.0.exe` - Portable executable
  - `Minecraft Config Editor-Setup-1.0.0.exe` - NSIS installer
- **Testing**: Can be tested locally with act/Docker
- **Location**: `release/` directory

### ✅ Linux (Tested Locally with act)
- **Status**: Working
- **Outputs**:
  - `Minecraft Config Editor-1.0.0.AppImage` - Universal Linux binary
  - `minecraft-config-editor_1.0.0_amd64.deb` - Debian package
- **Testing**: Can be tested locally with act/Docker
- **Location**: `release/` directory

### ⚠️ macOS (Requires GitHub Actions)
- **Status**: Cannot test locally
- **Outputs** (when built on GitHub):
  - `Minecraft Config Editor-1.0.0.dmg` - macOS disk image
  - `Minecraft Config Editor-1.0.0-mac.zip` - ZIP archive
- **Why can't we test locally?**
  - Apple's EULA prohibits running macOS in Docker/VMs on non-Apple hardware
  - Building macOS apps requires actual macOS environment
  - GitHub Actions provides free macOS runners (macos-latest)
- **Solution**: Create a release tag on GitHub to trigger the workflow

## How to Create a Release

### Option 1: GitHub Web Interface (Recommended)
1. Go to your repository on GitHub
2. Click "Releases" → "Draft a new release"
3. Click "Choose a tag" → Type a version (e.g., `v1.0.0`) → Create new tag
4. Fill in release title and description
5. Click "Publish release"
6. GitHub Actions will automatically build for all platforms and attach artifacts

### Option 2: Git Command Line
```bash
# Create and push a tag
git tag v1.0.0
git push origin v1.0.0

# Then go to GitHub and create a release from that tag
```

### Option 3: GitHub CLI (if installed)
```bash
# Install: winget install GitHub.cli
gh release create v1.0.0 --title "Release v1.0.0" --notes "Initial release"
```

## Workflow Details

The GitHub Actions workflow (`.github/workflows/build.yml`) will:
1. Trigger on release creation
2. Build on 3 runners simultaneously:
   - `windows-latest` → Windows builds
   - `ubuntu-latest` → Linux builds
   - `macos-latest` → macOS builds
3. Upload all artifacts to the release automatically

## Current Build Configuration

All platforms output to the `release/` directory as configured in `package.json`:

```json
"build": {
  "directories": {
    "output": "release",
    "buildResources": "build"
  }
}
```

## Artifact Naming

- Windows: `${productName}-Setup-${version}.exe` and `${productName}-Portable-${version}.exe`
- Linux: `${productName}-${version}.AppImage` and `${name}_${version}_${arch}.deb`
- macOS: `${productName}-${version}.dmg` and `${productName}-${version}-mac.zip`
