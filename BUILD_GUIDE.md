# MCED Build Guide

## Building for Different Platforms

### Windows ✅ (Working)
```bash
npm run build
npm run package:win
```
Output: `release/Minecraft Config Editor-{version}.exe` and Portable version

### Linux 🐧

#### Prerequisites
- Icon files must be in `build/icons/` directory (already set up)
- Icons: 16x16, 32x32, 48x48, 64x64, 128x128, 256x256, 512x512

#### Build Commands
```bash
npm run build
npm run package:linux
```

#### Common Issues & Fixes
1. **Icon path error**: Fixed - now points to `build/icons`
2. **Missing dependencies**: The build might fail if you don't have Linux tools on Windows
3. **Solution**: Use GitHub Actions or Docker for cross-platform builds

#### Testing on Linux VM
If you set up a Linux VM:
```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install dependencies
npm install

# Build
npm run build
npm run package:linux
```

### macOS 🍎

#### Prerequisites  
- `.icns` icon file (✅ already exists in `build/icon.icns`)
- Entitlements file (✅ already exists in `build/entitlements.mac.plist`)

#### Build Commands
```bash
npm run build
npm run package:mac
```

#### Common Issues & Fixes
1. **Code signing**: Disabled with `hardenedRuntime: true` and `gatekeeperAssess: false`
2. **Building on Windows**: Cannot build macOS apps on Windows directly
3. **Solution**: Use GitHub Actions with macOS runner OR build on actual Mac

## Cross-Platform Building (Recommended)

### Option 1: GitHub Actions (Best for you)
Create `.github/workflows/build.yml`:

```yaml
name: Build Apps

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  build:
    strategy:
      matrix:
        os: [windows-latest, ubuntu-latest, macos-latest]
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Package Windows
        if: matrix.os == 'windows-latest'
        run: npm run package:win
        
      - name: Package Linux
        if: matrix.os == 'ubuntu-latest'
        run: npm run package:linux
        
      - name: Package macOS
        if: matrix.os == 'macos-latest'
        run: npm run package:mac
        
      - name: Upload artifacts
        uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: release/*
```

### Option 2: Docker (Linux build on Windows)
```bash
# Not recommended - complex setup
```

### Option 3: Use a Build Service
- Use Electron Forge or similar
- Use CI/CD services

## Current Status

✅ **Windows**: Fully working
⚠️ **Linux**: Config fixed, needs testing on Linux machine or GitHub Actions
⚠️ **macOS**: Config ready, needs macOS machine or GitHub Actions to build

## Next Steps

1. **For Linux testing**: Set up Ubuntu VM and run build commands above
2. **For all platforms**: Set up GitHub Actions (easiest solution)
3. **For macOS**: Either use GitHub Actions or find a Mac to build on

## Build Output Locations

All builds go to `release/` directory:
- Windows: `Minecraft Config Editor-{version}.exe`
- Linux: `Minecraft Config Editor-{version}.AppImage` and `.deb`
- macOS: `Minecraft Config Editor-{version}.dmg` and `.zip`
