# MCED 1.1.1 Release Notes

## 🎉 What's New in Version 1.1.1

This release focuses on improving server config handling, adding recursive config scanning, and enhancing the overall stability of the application.

### ✨ New Features

- **Recursive Config Scanning**: Now scans config folders recursively to find configs in subfolders
- **Properties File Support**: Added support for `.properties` config files
- **Text File Support**: Added support for `.txt` config files with improved type detection
- **Bulk Server Config Migration**: New global button to migrate all server configs to default configs at once
- **Priority System**: Default configs now take priority over server configs to avoid duplicates

### 🔧 Improvements

- **Better Config Detection**: Improved logic for detecting which mods have configs
- **Fixed Config List Overflow**: Config file list now scrolls properly when there are many files
- **Removed Config Badges**: Cleaned up UI by removing unnecessary badges from config files
- **Version-Specific Folders**: Better handling of version-specific config folders (e.g., `forge-1_20`)
- **Shared Config Folders**: Improved handling of shared config folders (e.g., Xaero's mods)
- **Text Parser**: Enhanced text file parsing with better type detection for visual editor

### 🐛 Bug Fixes

- Fixed null value warnings in text inputs
- Fixed Discord RPC connection error handling
- Fixed navigation issue when migrating server configs
- Fixed path argument type error in migration functionality
- Removed debug console logs for cleaner output

### 🎨 UI/UX Improvements

- Better handling of mods with multiple config files
- Improved visual editor for all config file types
- Fixed overflow issues with long config file lists
- Cleaner interface with removed unnecessary UI elements

---

## 📦 Installation

Download the appropriate installer for your operating system from the [releases page](https://github.com/MinecraftEvolve/MCED/releases).

### Windows
- **NSIS Installer**: `Minecraft-Config-Editor-1.1.1.exe` - Full installer with auto-update support
- **Portable**: `Minecraft-Config-Editor-Portable-1.1.1.exe` - No installation required

### macOS
- **Universal**: `Minecraft-Config-Editor-1.1.1-mac.zip` - Supports both Intel and Apple Silicon

### Linux
- **AppImage**: `Minecraft-Config-Editor-1.1.1.AppImage` - Universal Linux package
- **Debian/Ubuntu**: `minecraft-config-editor-desktop_1.1.1_amd64.deb`

---

## 🔄 Update from 1.1.0

If you're using the NSIS installer version, the app will auto-update. Otherwise, download the new version and install it.

---

## 📝 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for the complete list of changes.

---

## 🙏 Acknowledgments

Thank you to everyone who reported bugs and provided feedback for this release!

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/MinecraftEvolve/MCED/issues)
- **Discussions**: [GitHub Discussions](https://github.com/MinecraftEvolve/MCED/discussions)

---

**Released**: January 13, 2026
