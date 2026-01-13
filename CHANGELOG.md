# Changelog

All notable changes to MCED will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
