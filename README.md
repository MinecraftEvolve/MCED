<img src="assets/logo.png" alt="MCED Logo" width="100" align="right" style="margin-top: -20px;"/>

# Minecraft Config Editor (MCED)

A modern, cross-platform desktop application for editing Minecraft modpack configuration files through an intuitive GUI.

![GitHub Release](https://img.shields.io/github/v/release/MinecraftEvolve/MCED)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ Features

- **🎯 Automatic Instance Detection** - Works with Modrinth, CurseForge, MultiMC, Prism Launcher, and more
- **🔍 Smart Mod Recognition** - Automatically extracts mod information from JAR files
- **📝 Multiple Config Formats** - Supports TOML, JSON, JSON5, and YAML
- **🎨 Beautiful Interface** - Modern dark-mode UI with smooth animations
- **🔎 Powerful Search** - Find any setting quickly with natural language search
- **💬 Config Comments** - Document your changes with timestamped notes
- **💾 Safe Editing** - Automatic backups before making changes
- **🌐 Mod Metadata** - Fetches descriptions and icons from Modrinth

## 🚀 Quick Start

### Installation

Download the latest release for your platform:

- **Windows**: `.exe` installer or portable version
- **Linux**: `.AppImage` or `.deb` package
- **macOS**: `.dmg` or `.zip`

[Download from Releases](https://github.com/MinecraftEvolve/MCED/releases)

### Development

```bash
# Clone the repository
git clone https://github.com/MinecraftEvolve/MCED.git
cd MCED

# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build
npm run package
```

## 📖 How to Use

1. **Open an Instance** - Click "Open Instance" and select your Minecraft instance folder
2. **Browse Mods** - Select any mod from the sidebar to view its configs
3. **Edit Settings** - Use toggles, sliders, and inputs to modify config values
4. **Add Comments** - Click the 💬 button to document why you changed a setting
5. **Save Changes** - Click "Save" to apply your changes (automatic backup created)

## 🛠️ Technologies

- **Electron** - Cross-platform desktop framework
- **React** - Modern UI library
- **TypeScript** - Type-safe development
- **Vite** - Fast build tool
- **TailwindCSS** - Styling
- **Zustand** - State management

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Built for the Minecraft modding community with ❤️

- Minecraft modders and mod loader teams (Forge, Fabric, NeoForge, Quilt)
- Modrinth and CurseForge for their APIs
- All open source libraries and contributors

---

**Current Version:** 1.0.6 | **Platform:** Windows, Linux, macOS
