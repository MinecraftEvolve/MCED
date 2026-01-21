# MCED 1.2.2 Release Notes

## 🎨 What's New in Version 1.2.2

This release fixes critical UI issues with boolean toggles and adds comprehensive light mode support throughout the application.

### 🐛 Bug Fixes

- **Boolean Toggle Visibility**: Fixed boolean toggles not being visible in dark mode
  - Added bright purple border for better contrast
  - White knob on both ON and OFF states
  - Proper background colors for visibility
- **Boolean Type Detection**: Fixed detection of `TRUE`/`FALSE` strings being incorrectly classified as enums
- **Theme Initialization**: Removed forced dark mode on app startup

### ✨ Improvements

- **Comprehensive Light Mode Support**: Complete overhaul of light mode styling
  - Landing page now fully supports light mode with appropriate colors
  - All UI components properly styled for both light and dark themes
  - Color badges (CurseForge, Modrinth, versions) use darker colors in light mode for readability
  - Settings modal, changelog viewer, and all dialogs support both themes
  - CSS variables now correctly default to light mode

### 🎨 UI/UX Enhancements

- Boolean toggle switches now have:
  - Bright purple border (`purple-500`) for visibility
  - Light/dark mode specific styling
  - Shadow effects for depth
  - Smooth transitions
- Badge colors optimized for readability:
  - Orange badges: `text-orange-600` (light) / `text-orange-400` (dark)
  - Green badges: `text-green-600` (light) / `text-green-400` (dark)
  - Blue badges: `text-blue-600` (light) / `text-blue-400` (dark)
  - Purple badges: `text-purple-600` (light) / `text-purple-400` (dark)

### 🔧 Technical Changes

- Fixed `:root` CSS variables to default to light mode
- Added `:root:not(.dark)` selectors for proper light mode cascading
- Removed hardcoded `document.documentElement.classList.add("dark")` call
- All color values now use theme-aware variants

---

## 📦 Installation

Download the appropriate installer for your operating system from the [releases page](https://github.com/Luke1505/MCED/releases).

### Windows
- **NSIS Installer**: `Minecraft-Config-Editor-1.2.2.exe` - Full installer with auto-update support
- **Portable**: `Minecraft-Config-Editor-Portable-1.2.2.exe` - No installation required

### macOS
- **Universal**: `Minecraft-Config-Editor-1.2.2-mac.zip` - Supports both Intel and Apple Silicon

### Linux
- **AppImage**: `Minecraft-Config-Editor-1.2.2.AppImage` - Universal Linux package
- **Debian/Ubuntu**: `minecraft-config-editor-desktop_1.2.2_amd64.deb`

---

## 🔄 Update from 1.2.1

If you're using the NSIS installer version, the app will auto-update. Otherwise, download the new version and install it.

---

## 📝 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for the complete list of changes.

---

## 🙏 Acknowledgments

Thank you to everyone who reported the boolean toggle visibility issue!

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/Luke1505/MCED/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Luke1505/MCED/discussions)

---

**Released**: January 21, 2026
