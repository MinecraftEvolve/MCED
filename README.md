<img src="assets/logo.png" alt="MCED Logo" width="100" align="right" style="margin-top: -20px;"/>

# Minecraft Config Editor Desktop
###### MCED for short

Ever spent 20 minutes hunting through nested TOML files just to disable one annoying feature? Yeah, we've been there too. MCED gives you a proper GUI for managing your modpack configs, because life's too short for manual TOML editing.

![GitHub Release](https://img.shields.io/github/v/release/MinecraftEvolve/MCED)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## What's this? 

MCED (Minecraft Config Editor) is a desktop app that turns your messy pile of config files into an organized, searchable interface. Think of it as a control panel for your modpack - toggle switches for booleans, sliders for numbers, and a search bar that actually understands "that weird spawn setting from Create."

Works with pretty much any launcher (CurseForge, Modrinth, MultiMC, Prism, you name it) and handles TOML, JSON, JSON5, and YAML configs without breaking a sweat.

## ✨ Features

- **Smart instance detection** - Automatically finds your Minecraft installations, no matter which launcher you use
- **Mod JAR parsing** - Reads mod info straight from the files (because manually typing mod names is for chumps)
- **Intelligent search** - Type naturally and it'll find what you need.  No regex required.
- **Config comments** - Leave notes for your future self about why you changed that spawn rate
- **Safety first** - Auto-backups before every save, because we've all accidentally nuked a config at 2 AM
- **Pretty mod info** - Pulls descriptions and icons from Modrinth so you remember what that cryptically-named mod actually does
- **Easy on the eyes** - Dark mode that doesn't feel like staring into the sun (or the void)

## 🚀 Getting Started

### Download

Grab the latest version for your OS:  

- **Windows**: `.exe` installer or portable version
- **Linux**: `.AppImage` or `.deb` package  
- **macOS**: `.dmg` or `.zip`

[→ Download from releases](https://github.com/MinecraftEvolve/MCED/releases)

### How to use

1. Launch MCED and click "Open Instance"
2. Navigate to your Minecraft instance folder
3. Pick a mod from the sidebar
4. Edit settings with actual UI controls instead of typing strings into a text file like a caveman
5. Hit save - it'll backup your old config automatically, just in case

### Building from source

Want to hack on it yourself? 

```bash
git clone https://github.com/MinecraftEvolve/MCED.git
cd MCED
npm install
npm run dev  # Opens in dev mode
```

For production builds:
```bash
npm run build
npm run package
```

## 🎮 Compatibility

**Launchers**: CurseForge, Modrinth, MultiMC, Prism Launcher, ATLauncher, GDLauncher, vanilla launcher  
**Mod loaders**: Forge, Fabric, NeoForge, Quilt  
**Config formats**: TOML, JSON, JSON5, YAML

Basically if it's a Minecraft config file, we probably support it. 

## 🛠️ Tech Stack

Built with Electron, React, TypeScript, and Vite. State management via Zustand, styling with TailwindCSS. We chose these because they're fast and we're impatient.

## 🤝 Contributing

Found a bug?  Got a feature idea? PRs and issues are welcome!  We're all about making this tool better for the community.

## 📄 License

MIT - go wild.  Fork it, modify it, ship it with your modpack.  We just ask that you share improvements back if you can.

## 💙 Acknowledgments

Big thanks to the Minecraft modding community for being awesome, the Modrinth and CurseForge teams for their excellent APIs, and everyone maintaining Forge, Fabric, NeoForge, and Quilt. You all make this hobby possible.

Also shoutout to every modder who's ever written a config file - we see you, and we're trying to make your users' lives easier.

---

**Current Version:** 1.2.1 | **Platforms:** Windows, Linux, macOS | **License:** MIT

*Built with ❤️ for the Minecraft modding community*
