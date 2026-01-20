# Changelog

All notable changes to MCED will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-01-20

### Added

- **Instance Menu** - New dropdown menu in header for quick access to open/close instance actions
- **Modern UI Design** - Complete redesign with rounded corners, smooth animations, and modern styling
- **Purple Theme** - Consistent purple accent color throughout the app (with green for Minecraft versions)
- **Enhanced Notifications** - Improved toast notifications with gradients and better visibility
- **Better Hover Effects** - Clear visual feedback on all interactive elements
- **Animated Background Elements** - Subtle pulsing gradients on landing page
- **Glassmorphism Effects** - Modern card effects with backdrop blur

### Improved

- **Landing Page**: Cleaner, more compact design with better sized buttons and improved recent instances cards
- **Header**: Better organized with instance dropdown menu, purple color scheme, removed redundant buttons
- **ModCard**: Better borders, shadows, and hover effects with rounded-2xl corners
- **ModListItem**: Modern card design with rounded corners and improved selected state
- **ModSearch**: Enhanced input styling with better focus states
- **StatusBar**: Enhanced dialog design with improved animations
- **Loading Overlay**: Better backdrop and animations
- **Sidebar**: Gradient background and improved spacing
- **Buttons**: All buttons now have consistent hover effects and scale animations
- **KubeJS Button**: Changed from blue to purple to match theme

### Changed

- **Color Palette**: Unified purple and black theme throughout (green kept for Minecraft versions)
- **Border Radius**: Increased globally from 0.5rem to 0.75rem
- **Animations**: Added fadeIn, slideInRight, and improved transitions
- **Shadows**: Enhanced with colored glows matching element colors

### Fixed

- Fixed instance name not displaying properly above version badges in header
- Fixed text gradient visibility issues on landing page
- Fixed instance menu positioning to open next to the button

## [1.1.1] - 2026-01-13

### Added

- **Recursive Config Scanning** - Now scans config folders recursively to find configs in subfolders
- **Properties File Support** - Added support for `.properties` config files
- **Text File Support** - Added support for `.txt` config files with improved type detection
- **Bulk Server Config Migration** - New global button to migrate all server configs to default configs at once
- **Priority System** - Default configs now take priority over server configs to avoid duplicates

### Improved

- Better config detection logic for determining which mods have configs
- Fixed config list overflow issues - properly scrolls when there are many files
- Enhanced text file parsing with better type detection for visual editor
- Better handling of version-specific config folders (e.g., `forge-1_20`)
- Improved handling of shared config folders (e.g., Xaero's mods)

### Fixed

- Fixed null value warnings in text inputs
- Fixed Discord RPC connection error handling
- Fixed navigation issue when migrating server configs
- Fixed path argument type error in migration functionality
- Removed debug console logs for cleaner output

### UI/UX

- Removed unnecessary config badges for cleaner interface
- Better handling of mods with multiple config files
- Improved visual editor for all config file types

## [1.0.9] - 2026-01-13

### Added

- **Discord Rich Presence** - Show your current activity in Discord with dynamic status updates
  - Real-time display of instance name, mod count, and current activity
  - Shows "Loading mods..." during mod scanning
  - Displays config file name on hover when editing
  - Toggle in Settings to enable/disable
- **Keyboard Shortcuts** - Quick access to common actions
  - Ctrl+S: Save all configs
  - Ctrl+Shift+S: Save current config
  - Ctrl+Z: Undo changes
  - Ctrl+F: Focus search
  - Ctrl+,: Open settings
  - Esc: Close modals
- **Advanced Search** - Enhanced search capabilities
  - Search within config values, not just mod names
  - Filter by config type (boolean, number, string, enum, array)
  - Recent searches history
- **Config Change Tracking** - Track and manage configuration changes
  - Visual indicators for modified settings
  - One-click reset to default values
  - "Modified" badges on changed settings
- **Config Statistics** - Analytics for your editing sessions
  - Most changed settings tracking
  - Time spent editing
  - Mod usage statistics
  - Per-session tracking
- **Changelog Viewer** - Complete change history
  - Track what you changed and when
  - Per-session changelog organization
  - Undo entire sessions
  - Detailed metadata with timestamps
- **Update Checker** - Stay up to date
  - Automatic update check on startup
  - Manual check from Settings
  - Non-intrusive notifications
  - Direct download links

### Fixed

- **Enum Detection** - Properly parse and display enum values
  - Fixed regex patterns to detect "Allowed Values: A, B, C" format
  - Now correctly handles CC:Tweaked monitor_renderer and similar settings
  - Enums now render as dropdowns instead of text inputs
  - Support for multiple enum comment formats:
    - `Allowed Values: BEST, TBO, VBO`
    - `Valid Options: OPTION_A, OPTION_B`
    - `Options: CHOICE_1, CHOICE_2`
    - `Enum: TYPE_A, TYPE_B`
- **Settings Modal UI** - Improved visual design
  - Opaque background for better separation
  - Better contrast for toggle switches
  - Neutral borders instead of purple
  - Cleaner overall appearance

### Changed

- **Config Parsing** - Enhanced type inference
  - Better detection of enum patterns
  - Improved metadata extraction from comments
  - Smarter type inference with metadata support
- **UI Components** - Better user experience
  - Improved dropdown rendering for enums
  - Better validation for value changes
  - More informative tooltips

### Technical

- Enhanced TOML, JSON, and Properties parsers with consistent enum detection
- Added Discord RPC service with automatic reconnection
- Implemented keyboard shortcut system
- Added comprehensive state management for new features
- Improved error handling in config parsing
- Better TypeScript typing throughout

## [1.0.8] - Previous Release

- Previous features and fixes

---

[1.0.9]: https://github.com/Luke1505/MCED/releases/tag/v1.0.9
[1.0.8]: https://github.com/Luke1505/MCED/releases/tag/v1.0.8
