# Minecraft Config Editor

A modern, cross-platform desktop application for editing Minecraft modpack configuration files through an intuitive GUI.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### Core Capabilities

- **🎯 Instance Detection**: Automatically detects Minecraft version, mod loader, and modpack source
- **🔍 Smart Mod Detection**: Extracts metadata from JAR files (Forge, Fabric, NeoForge, Quilt)
- **📝 Config Parsing**: Supports TOML, JSON, JSON5, YAML, CFG, and properties files
- **🎨 Modern UI**: Clean, dark-mode interface with smooth animations
- **🔗 Config-to-Mod Matching**: Intelligently links config files to their respective mods
- **🚀 Quick Launch**: Launch Minecraft directly from the editor
- **🔎 Smart Search**: Natural language search across all configs

### Supported Launchers

- MultiMC
- Prism Launcher
- CurseForge
- ATLauncher
- Vanilla Minecraft

### Supported Mod Loaders

- Forge
- Fabric
- NeoForge
- Quilt

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd MCED

# Install dependencies
npm install

# Run in development mode
npm run dev
```

### Building

```bash
# Build for all platforms
npm run build
npm run package

# Build for specific platform
npm run package:win    # Windows
npm run package:mac    # macOS
npm run package:linux  # Linux
```

## 📖 Usage

### Opening an Instance

1. Launch the application
2. Click "Open Instance" or drag a Minecraft instance folder
3. The app will automatically detect:
   - Minecraft version
   - Mod loader type and version
   - Installed mods
   - Configuration files

### Editing Configs

1. Select a mod from the sidebar
2. View mod information and available configs
3. Edit settings using modern controls:
   - **Toggle switches** for booleans
   - **Sliders** for numeric ranges
   - **Dropdowns** for enums
   - **Text inputs** for strings
4. Changes are automatically validated
5. Click "Save" to apply changes

### Smart Search

Use natural language to find configs:

- `"settings about performance"` - finds FPS, render distance, etc.
- `"mod:create"` - shows all Create mod settings
- `"type:boolean"` - filters boolean settings
- `"value:true"` - finds all enabled settings

### Launching Minecraft

1. Make your config changes
2. Click "Save & Launch"
3. App automatically detects your launcher
4. Minecraft launches with your changes applied

## 🏗️ Project Structure

```txt
minecraft-config-editor/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts            # Main entry point
│   │   ├── preload.ts          # Preload script
│   │   ├── jar-scanner.ts      # JAR file parser
│   │   └── instance-detector.ts # Instance detection logic
│   ├── renderer/                # React frontend
│   │   ├── components/         # React components
│   │   ├── services/           # Business logic
│   │   │   ├── parsers/       # Config file parsers
│   │   │   └── api/           # CurseForge/Modrinth APIs
│   │   ├── types/             # TypeScript definitions
│   │   ├── utils/             # Helper functions
│   │   └── styles/            # CSS/Tailwind styles
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

## 🛠️ Technologies

- **Electron**: Cross-platform desktop framework
- **React**: UI library
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **TailwindCSS**: Utility-first CSS
- **Radix UI**: Accessible component primitives
- **Zustand**: Lightweight state management
- **Framer Motion**: Smooth animations

### Config Parsers

- `@iarna/toml` - TOML parsing
- `json5` - JSON5 with comments
- `js-yaml` - YAML parsing
- `adm-zip` - JAR file extraction

## 📝 Development

### Running Tests

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Development Mode

The app runs in development mode with:

- Hot reload for React components
- DevTools enabled
- Detailed error messages

## 🎯 Roadmap

### MVP Features (Completed)

- ✅ Instance detection and analysis
- ✅ JAR metadata extraction
- ✅ Config file parsing (TOML, JSON)
- ✅ Modern UI with dark mode
- ✅ Basic config editing

### In Progress

- 🔨 Smart Search implementation
- 🔨 Quick Launch integration
- 🔨 Platform API integration (CurseForge/Modrinth)

### Future Features

- Config profiles (save/load/share)
- Diff viewer for config changes
- Backup and restore system
- Multi-instance management
- Config validation and suggestions
- Export configs as text for sharing
- Plugin system for custom parsers

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript for all new files
- Follow the existing code structure
- Add comments for complex logic
- Write meaningful commit messages

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐛 Known Issues

- Config comments are preserved but may not be perfectly positioned after editing
- Some legacy Forge mods may not have complete metadata
- Very large modpacks (500+ mods) may take time to load initially

## 💡 Tips & Tricks

1. **Favorites**: Star frequently edited mods for quick access
2. **Search**: Use `Ctrl+F` to quickly find any config
3. **Revert**: Use `Ctrl+Z` to undo config changes
4. **Backup**: The app automatically creates backups before first edit
5. **Raw Mode**: Press `Ctrl+R` to edit configs as raw text

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/mced/issues)
- **Discord**: Join our community server
- **Wiki**: [Documentation](https://github.com/yourusername/mced/wiki)

## 🙏 Acknowledgments

- Minecraft modding community
- Forge, Fabric, NeoForge, and Quilt teams
- All mod developers
- Open source libraries used in this project

---

### Made with ❤️ for the Minecraft modding community
