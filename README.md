<img src="assets/logo.png" alt="MCED Logo" width="120" align="right"/>

# Minecraft Config Editor (MCED)

A modern, cross-platform desktop application for editing Minecraft modpack configuration files through an intuitive GUI.

![GitHub Release](https://img.shields.io/github/v/release/MinecraftEvolve/MCED)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## ✨ Features

### Core Capabilities

- **🎯 Instance Detection**: Automatically detects Minecraft version, mod loader, and modpack source
- **🔍 Smart Mod Detection**: Extracts metadata from JAR files (Forge, Fabric, NeoForge, Quilt)
- **📝 Config Parsing**: Supports TOML, JSON, JSON5, YAML formats with comment preservation
- **🎨 Modern UI**: Beautiful dark-mode interface with glassmorphism effects and smooth animations
- **🔗 Config-to-Mod Matching**: Intelligently links config files to their respective mods
- **🔎 Smart Search**: Natural language search across all configs with fuzzy matching
- **💬 Config Comments**: Add timestamped comments to individual settings to track changes
- **💾 Auto-Backup**: Automatic backups before editing with restore capability
- **🌐 API Integration**: Fetches mod metadata and icons from Modrinth (and CurseForge)

### Supported Launchers

- Modrinth App ✅
- CurseForge ✅
- MultiMC ✅
- Prism Launcher ✅
- ATLauncher
- FTB App
- GDLauncher
- Technic/Tekkit
- Vanilla Minecraft

See [LAUNCHER_SUPPORT.md](LAUNCHER_SUPPORT.md) for detailed launcher compatibility information.

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
   - **Sliders with number inputs** for numeric ranges
   - **Dropdowns** for enums
   - **Text inputs** for strings
   - **List editors** for arrays
4. **Add comments** to document your changes (click the 💬 button)
5. Changes are automatically validated
6. Click "Save" to apply changes (auto-backup is created)

### Smart Search

Use natural language to find configs:

- `"settings about performance"` - finds FPS, render distance, etc.
- `"mod:create"` - shows all Create mod settings
- `"type:boolean"` - filters boolean settings
- `"value:true"` - finds all enabled settings
- `/pattern/` - regex search for advanced filtering

### Config Comments

Track your changes with timestamped comments:

1. Click the 💬 button next to any setting
2. Add a comment explaining why you changed it
3. Comments are saved in the config file with `#@MCED:` markers
4. View comment history with relative timestamps

See [COMMENTS_SYSTEM.md](COMMENTS_SYSTEM.md) for detailed documentation.

## 🏗️ Project Structure

```txt
MCED/
├── src/
│   ├── main/                    # Electron main process
│   │   ├── index.ts            # Main entry point with IPC handlers
│   │   ├── preload.ts          # Preload script for secure IPC
│   │   ├── jar-scanner.ts      # JAR file parser
│   │   ├── instance-detector.ts # Instance detection logic
│   │   └── file-system.ts      # File system operations
│   ├── renderer/                # React frontend
│   │   ├── App.tsx             # Main app component
│   │   ├── store.ts            # Zustand state management
│   │   ├── components/         # React components
│   │   │   ├── Layout/        # Header, Sidebar, MainPanel
│   │   │   ├── ConfigEditor/  # Config editing inputs
│   │   │   ├── ModList/       # Mod list and search
│   │   │   ├── Settings.tsx   # Settings modal
│   │   │   ├── Backup/        # Backup management
│   │   │   └── Search/        # Smart search
│   │   ├── services/           # Business logic
│   │   │   ├── parsers/       # Config file parsers
│   │   │   │   ├── TomlParser.ts
│   │   │   │   ├── JsonParser.ts
│   │   │   │   └── YamlParser.ts
│   │   │   ├── api/           # External APIs
│   │   │   │   ├── ModrinthAPI.ts
│   │   │   │   └── CurseForgeAPI.ts
│   │   │   ├── JarScanner.ts
│   │   │   ├── InstanceDetector.ts
│   │   │   ├── BackupManager.ts
│   │   │   └── SmartSearchService.ts
│   │   ├── types/             # TypeScript definitions
│   │   ├── utils/             # Helper functions
│   │   └── styles/            # CSS/Tailwind styles
│   └── shared/                 # Shared types between main/renderer
├── assets/                     # Icons and images
├── build/                      # Build resources (icons for Linux/Mac)
├── public/                     # Static assets
├── scripts/                    # Build and release scripts
├── .github/workflows/          # CI/CD pipeline
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite build config
├── tailwind.config.js         # Tailwind CSS config
├── BUILD_GUIDE.md             # Detailed build instructions
├── COMMENTS_SYSTEM.md         # Config comments documentation
├── LAUNCHER_SUPPORT.md        # Launcher compatibility guide
├── STATUS.md                  # Current development status
└── README.md                  # This file
```

## 🛠️ Technologies

### Core Stack

- **Electron 28**: Cross-platform desktop framework
- **React 18**: UI library with TypeScript
- **Vite 5**: Fast build tool and dev server
- **TypeScript**: Type-safe development
- **Zustand**: Lightweight state management

### UI/Styling

- **TailwindCSS**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Framer Motion**: Smooth animations
- **Lucide React**: Modern icon library
- **Monaco Editor**: Code editor for raw config editing

### Config Parsers

- `@iarna/toml` - TOML parsing with comment preservation
- `json5` - JSON5 with comments and trailing commas
- `js-yaml` - YAML parsing
- `adm-zip` - JAR file extraction

### Utilities

- `fuse.js` - Fuzzy search for smart searching
- `axios` - HTTP client for API requests
- `properties-parser` - Java properties file parsing
- `react-window` - Virtual scrolling for large mod lists

## 📝 Development

### Running Tests

```bash
npm test
```

### Linting & Formatting

```bash
npm run lint
npm run format
```

### Development Mode

The app runs in development mode with:

- Hot reload for React components
- DevTools enabled
- Detailed error messages
- Source maps

For detailed build instructions, see [BUILD_GUIDE.md](BUILD_GUIDE.md).

## 🎯 Features & Roadmap

### ✅ Completed Features

**Core Functionality:**

- ✅ Instance detection (Modrinth, CurseForge, MultiMC, Prism, etc.)
- ✅ JAR metadata extraction for all major mod loaders
- ✅ Config file parsing (TOML, JSON, JSON5, YAML) with comment preservation
- ✅ Modern UI with glassmorphism effects and dark mode
- ✅ Comprehensive config editing with various input types
- ✅ Smart search with natural language and fuzzy matching
- ✅ Config comment system with timestamps
- ✅ Automatic backup system before editing
- ✅ Settings system with API configuration
- ✅ Modrinth API integration for mod metadata

**UI Components:**

- ✅ Responsive header with instance info
- ✅ Searchable mod list sidebar with icons
- ✅ Detailed mod information cards
- ✅ Config editor with toggles, sliders, dropdowns, text inputs, list editors
- ✅ Settings modal with all preferences
- ✅ Backup browser and restore UI
- ✅ Status bar with save indicator

### 🚧 In Progress

- 🔨 Config validation with real-time error messages
- 🔨 CurseForge API integration (partial)
- 🔨 Warning system for dangerous config values
- 🔨 Config profiles (save/load/share presets)

### 🔮 Future Features

- Config profiles manager UI
- Diff viewer for config changes before/after
- Multi-instance management
- Enhanced undo/redo system
- Light mode theme
- Performance optimization for 250+ mods
- Export configs as shareable text
- Plugin system for custom parsers
- Recently edited highlights
- More keyboard shortcuts

See [STATUS.md](STATUS.md) for detailed development status.

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

- Some legacy Forge mods may not have complete metadata
- Very large modpacks (500+ mods) may take time to load initially (optimization in progress)
- CurseForge API integration is partial (can be configured in settings)
- Light mode not yet implemented (setting exists but not functional)
- Comments only supported in TOML files (JSON/JSON5 support coming)

## 💡 Tips & Tricks

1. **Search**: Use `Ctrl+F` to quickly find any config setting
2. **Comments**: Add comments to settings to document your changes and reasoning
3. **Backup**: Backups are automatically created - restore from Settings → Backup Management
4. **Settings**: Configure API keys, auto-save, and other preferences in Settings (gear icon)
5. **Recent Instances**: Quickly reopen recent instances from the landing page
6. **Smart Search Operators**:
   - `mod:create` - Filter by mod
   - `type:boolean` - Filter by type
   - `value:true` - Filter by value
   - `/regex/` - Use regex patterns
7. **Keyboard Shortcuts**: View all shortcuts in Settings → Keyboard Shortcuts

## 📞 Support

- **Documentation**: See additional docs in this repository:
  - [BUILD_GUIDE.md](BUILD_GUIDE.md) - Build instructions for all platforms
  - [COMMENTS_SYSTEM.md](COMMENTS_SYSTEM.md) - Config comments feature guide
  - [LAUNCHER_SUPPORT.md](LAUNCHER_SUPPORT.md) - Launcher compatibility details
  - [STATUS.md](STATUS.md) - Current development progress
- **Issues**: [GitHub Issues](https://github.com/yourusername/mced/issues)
- **License**: MIT - See [LICENSE](LICENSE) file

## 🙏 Acknowledgments

- Minecraft modding community
- Forge, Fabric, NeoForge, and Quilt teams
- All mod developers who make Minecraft amazing
- Open source libraries and their maintainers
- Modrinth and CurseForge for their APIs

---

**Made with ❤️ for the Minecraft modding community**

Current Version: **1.0.6** | License: **MIT** | Platform: **Windows, Linux, macOS**
