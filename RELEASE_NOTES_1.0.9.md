# Release Notes - v1.0.9

**Release Date:** January 13, 2026

## 🎉 Major Features

### Discord Rich Presence Integration
- **Real-time Status Updates**: Show what you're working on in Discord
- **Dynamic Display**: Shows instance name, mod count, and current activity
- **Loading States**: Professional "Loading mods..." display while scanning
- **Config File Display**: Hover to see which config file you're editing
- **Settings Toggle**: Enable/disable in Settings
- **States**:
  - 🔵 "Browsing instances" - No instance open
  - 🟡 "Loading mods..." - Instance loading
  - 🟢 "Browsing X mods" - Mods loaded
  - 🟣 "Editing [Mod Name]" - Mod selected
  - 📄 Config file name shown on hover

### Keyboard Shortcuts
- **Ctrl+S** - Save all configs
- **Ctrl+Shift+S** - Save current config
- **Ctrl+Z** - Undo changes
- **Ctrl+F** - Focus search
- **Ctrl+,** - Open settings
- **Esc** - Close modals/dialogs

### Advanced Search
- **Search within config values** - Not just mod names
- **Filter by config type** - Boolean, number, string, enum, array
- **Recent searches history** - Quick access to previous searches
- **Real-time filtering** - Instant results as you type

### Config Change Tracking
- **Modified indicator** - See which settings changed from defaults
- **Reset to default** - One-click reset for individual settings
- **"Modified" badge** - Visual indicator on changed values
- **Track all changes** - See what was modified

### Config Statistics
- **Most changed settings** - See your most edited configs
- **Time spent editing** - Track editing sessions
- **Mod usage stats** - Which mods you edit most
- **Session tracking** - Per-session analytics

### Changelog Viewer
- **Change history** - Track what you changed and when
- **Per-session log** - Organized by editing session
- **Undo entire sessions** - Revert all changes from a session
- **Detailed metadata** - Timestamps, old/new values

### Update Checker
- **Automatic check** - Checks for updates on startup
- **Manual check** - Check anytime from Settings
- **Notification** - Non-intrusive update notification
- **Direct download** - Links to latest release

## 🐛 Bug Fixes

### Enhanced Config Parsing
- **Fixed enum detection** - Now properly detects "Allowed Values: A, B, C" patterns
- **Improved regex patterns** - Handles more enum comment formats
- **Better type inference** - Smarter detection of config types
- **CC:Tweaked support** - Correctly parses monitor_renderer and similar enums
- **Enum UI fix** - Enums now properly render as dropdowns instead of text inputs
- **Pattern detection**:
  - ✅ `Allowed Values: BEST, TBO, VBO`
  - ✅ `Valid Options: OPTION_A, OPTION_B`
  - ✅ `Options: CHOICE_1, CHOICE_2`
  - ✅ `Enum: TYPE_A, TYPE_B`

### UI Improvements
- **Settings modal** - Better visual separation with opaque background
- **Toggle visibility** - Improved contrast for toggle switches
- **Modal styling** - Cleaner, more professional appearance
- **Border styling** - Neutral borders instead of purple

## 🎨 UI/UX Improvements

### Settings Page
- **Redesigned layout** - Cleaner, more organized
- **Better contrast** - Easier to read toggles and options
- **Opaque background** - Clear visual separation from main content
- **Neutral styling** - Professional appearance

### Config Editor
- **Enum dropdowns** - Proper dropdown for enum values
- **Better validation** - Type-safe value changes
- **Improved tooltips** - More informative descriptions

## 🔧 Technical Improvements

### Code Quality
- **Better error handling** - More robust config parsing
- **Type safety** - Improved TypeScript types
- **Performance** - Optimized config loading
- **Maintainability** - Cleaner code structure

### Parsers
- **TOML parser** - Enhanced metadata extraction
- **JSON parser** - Improved enum detection
- **Properties parser** - Better type inference
- **All parsers** - Consistent behavior across formats

## 📝 Files Modified

### Core Services
- `src/main/DiscordRPC.ts` - Discord Rich Presence service
- `src/main/index.ts` - IPC handlers for Discord and updates
- `src/main/preload.ts` - API signatures

### UI Components
- `src/renderer/App.tsx` - Keyboard shortcuts, loading states
- `src/renderer/components/ModList.tsx` - Discord integration
- `src/renderer/components/ConfigEditor/ConfigEditor.tsx` - Config tracking, Discord integration
- `src/renderer/components/ConfigEditor/SettingWrapper.tsx` - Fixed enum rendering
- `src/renderer/components/Settings.tsx` - Styling improvements

### Services & Stores
- `src/renderer/services/ConfigService.ts` - Enhanced type inference
- `src/renderer/services/parsers/TomlParser.ts` - Improved enum detection
- `src/renderer/services/parsers/JsonParser.ts` - Enhanced parsing
- `src/renderer/services/parsers/PropertiesParser.ts` - Better detection
- `src/renderer/store/settingsStore.ts` - Discord settings
- `src/renderer/store/statsStore.ts` - Statistics tracking
- `src/renderer/store/changelogStore.ts` - Changelog management
- `src/renderer/store/changeTrackingStore.ts` - Change tracking

## 🚀 Installation

Download the appropriate installer for your platform:
- **Windows**: `MCED-Setup-1.0.9.exe`
- **macOS**: `MCED-1.0.9.dmg`
- **Linux**: `MCED-1.0.9.AppImage`

## 📦 What's Next?

Future features under consideration:
- Config templates/presets
- Multi-language support
- Config validation rules
- Batch editing operations
- Cloud sync for configs

## 🙏 Acknowledgments

Special thanks to:
- All users who reported issues
- Beta testers for feedback
- The Minecraft modding community

## 📄 Full Changelog

See [CHANGELOG.md](CHANGELOG.md) for complete details.

## 🐛 Known Issues

- None reported

## 💬 Support

- **Issues**: [GitHub Issues](https://github.com/Luke1505/MCED/issues)
- **Discussions**: [GitHub Discussions](https://github.com/Luke1505/MCED/discussions)

---

**Enjoy v1.0.9!** 🎉
