# 🚀 Minecraft Launcher Support

This document lists all Minecraft launchers and modpack platforms supported by MCED.

## ✅ Fully Supported Launchers

### 1. **Modrinth App** 
- **Detection Files**: `profile.json`, `modrinth.index.json`
- **Path Detection**: `ModrinthApp` in directory path
- **Features**:
  - ✅ Minecraft version detection
  - ✅ Mod loader detection (Forge, Fabric, NeoForge, Quilt)
  - ✅ Modpack metadata
  - ✅ Icon/thumbnail support
- **Tested**: ✅ Yes

### 2. **CurseForge**
- **Detection Files**: `minecraftinstance.json`, `manifest.json`
- **Path Detection**: N/A (file-based detection)
- **Features**:
  - ✅ Minecraft version detection
  - ✅ Mod loader detection (Forge, Fabric, NeoForge)
  - ✅ Modpack metadata (name, version, author, projectId)
  - ✅ CurseForge API integration
- **Tested**: ✅ Yes

### 3. **MultiMC**
- **Detection Files**: `mmc-pack.json`, `instance.cfg`
- **Path Detection**: Default `multimc` in path
- **Features**:
  - ✅ Minecraft version detection
  - ✅ Mod loader detection (Forge, Fabric, NeoForge, Quilt)
  - ✅ Component-based loader versioning
  - ✅ Instance configuration
- **Tested**: ✅ Yes

### 4. **Prism Launcher**
- **Detection Files**: `mmc-pack.json`, `instance.cfg`
- **Path Detection**: `PrismLauncher` in directory path
- **Features**:
  - ✅ Minecraft version detection
  - ✅ Mod loader detection (Forge, Fabric, NeoForge, Quilt)
  - ✅ Same format as MultiMC
  - ✅ Instance configuration
- **Tested**: ✅ Yes

### 5. **ATLauncher**
- **Detection Files**: `instance.json`
- **Path Detection**: `ATLauncher` in directory path
- **Features**:
  - ✅ Minecraft version detection
  - ✅ Mod loader detection with version
  - ✅ Modpack metadata
  - ✅ Launcher-specific configuration
- **Tested**: ⚠️ Needs testing

### 6. **FTB App (Feed The Beast)**
- **Detection Files**: `modpack.json`, `modpack/manifest.json`
- **Path Detection**: `FTBApp` or `FeedTheBeast` in path
- **Features**:
  - ✅ Minecraft version detection
  - ✅ Mod loader detection (Forge, Fabric)
  - ✅ Modpack metadata (name, version, author)
  - ✅ Legacy FTB format support
- **Tested**: ⚠️ Needs testing

### 7. **GDLauncher**
- **Detection Files**: `config.json`
- **Path Detection**: `gdlauncher` or `GDLauncher` in path
- **Features**:
  - ✅ Minecraft version detection
  - ✅ Mod loader detection (Forge, Fabric, NeoForge)
  - ✅ Instance configuration
  - ✅ Loader version tracking
- **Tested**: ⚠️ Needs testing

### 8. **Technic/Tekkit**
- **Detection Files**: `version.json`, `bin/modpack.jar`
- **Path Detection**: `technic` or `Technic` in path
- **Features**:
  - ✅ Minecraft version detection
  - ✅ Basic modpack detection
  - ✅ Platform pack support
  - ⚠️ Limited loader detection (legacy format)
- **Tested**: ⚠️ Needs testing

### 9. **Vanilla Minecraft Launcher**
- **Detection Files**: `.minecraft/versions/` folder
- **Path Detection**: N/A (folder structure-based)
- **Features**:
  - ✅ Minecraft version detection
  - ✅ Multiple version support
  - ✅ Vanilla instance detection
  - ⚠️ No modpack metadata
- **Tested**: ⚠️ Needs testing

---

## 📋 Detection Priority

The launcher detector checks files in this order:

1. **Profile-based** (Modrinth, ATLauncher, GDLauncher)
2. **Manifest-based** (CurseForge, FTB)
3. **Pack-based** (MultiMC, Prism)
4. **Version-based** (Technic, Vanilla)
5. **Path-based** (fallback detection)

---

## 🔍 Minecraft Version Detection

### Detection Methods (in order):

1. `instance.cfg` (MultiMC/Prism) → `IntendedVersion=`
2. `mmc-pack.json` (MultiMC/Prism) → `components[].version`
3. `minecraftinstance.json` (CurseForge) → `gameVersion`
4. `manifest.json` (CurseForge) → `minecraft.version`
5. `instance.json` (ATLauncher) → `id` or `minecraft`
6. `config.json` (GDLauncher) → `version`
7. `modpack.json` (FTB) → `mcVersion` or `gameVersion`
8. `version.json` (Technic) → `minecraft` or `version`
9. `profile.json` (Modrinth) → `game_version`
10. **Fallback**: Extract from mod JAR filenames

---

## 🔧 Mod Loader Detection

### Detection Methods (in order):

1. **mmc-pack.json** (MultiMC/Prism)
   - Checks `components[]` for:
     - `net.minecraftforge` → Forge
     - `net.fabricmc.fabric-loader` → Fabric
     - `net.neoforged` → NeoForge
     - `org.quiltmc.quilt-loader` → Quilt

2. **Modrinth profile.json**
   - `loader` field + `loader_version`

3. **CurseForge minecraftinstance.json**
   - `baseModLoader.name` + version

4. **ATLauncher instance.json**
   - `launcher.loaderVersion.type` + version

5. **GDLauncher config.json**
   - `loader` or `modloader` field

6. **FTB modpack.json**
   - `modLoader` + `modLoaderVersion`

7. **CurseForge manifest.json**
   - `minecraft.modLoaders[0].id`

8. **Fallback**: Scan mod JAR files
   - `fabric.mod.json` → Fabric
   - `META-INF/mods.toml` → Forge
   - `META-INF/neoforge.mods.toml` → NeoForge
   - `quilt.mod.json` → Quilt

---

## 📦 Modpack Metadata Detection

### What's Detected:

- **Source**: Which launcher/platform
- **Name**: Modpack name
- **Version**: Modpack version
- **Author**: Creator (when available)
- **Project ID**: CurseForge/Modrinth ID (when available)

### Examples:

**Modrinth:**
```json
{
  "source": "modrinth",
  "name": "Fabulously Optimized",
  "version": "5.2.3"
}
```

**CurseForge:**
```json
{
  "source": "curseforge",
  "name": "All the Mods 9",
  "version": "0.2.54",
  "author": "ATM Team",
  "projectId": 715572
}
```

**MultiMC:**
```json
{
  "source": "multimc",
  "name": "My Custom Pack"
}
```

---

## 🛠️ Testing Different Launchers

### How to Test:

1. **Install the launcher** you want to test
2. **Create/import an instance** in that launcher
3. **Launch MCED** and click "Open Instance"
4. **Navigate to** the launcher's instances folder:
   - Modrinth: `%APPDATA%\ModrinthApp\profiles\<instance>\<version>`
   - CurseForge: `%USERPROFILE%\curseforge\minecraft\Instances\<instance>`
   - MultiMC: `<install_dir>\instances\<instance>`
   - Prism: `%APPDATA%\PrismLauncher\instances\<instance>`
   - ATLauncher: `%APPDATA%\ATLauncher\instances\<instance>`
   - FTB: `%LOCALAPPDATA%\FTBApp\instances\<instance>`
   - GDLauncher: `%APPDATA%\gdlauncher_next\instances\<instance>`
5. **Check that** MCED correctly detects:
   - Minecraft version
   - Mod loader & version
   - Modpack name/source

---

## 📊 Launcher Support Matrix

| Launcher | Version | Loader | Modpack | Config | Status |
|----------|---------|--------|---------|--------|--------|
| Modrinth | ✅ | ✅ | ✅ | ✅ | **Fully Tested** |
| CurseForge | ✅ | ✅ | ✅ | ✅ | **Fully Tested** |
| MultiMC | ✅ | ✅ | ✅ | ✅ | **Fully Tested** |
| Prism | ✅ | ✅ | ✅ | ✅ | **Fully Tested** |
| ATLauncher | ✅ | ✅ | ✅ | ✅ | Needs Testing |
| FTB App | ✅ | ✅ | ✅ | ✅ | Needs Testing |
| GDLauncher | ✅ | ✅ | ✅ | ✅ | Needs Testing |
| Technic | ✅ | ⚠️ | ✅ | ✅ | Needs Testing |
| Vanilla | ✅ | ✅ | ❌ | ✅ | Needs Testing |

**Legend:**
- ✅ = Supported
- ⚠️ = Limited/Legacy support
- ❌ = Not applicable

---

## 🚨 Known Limitations

### Technic/Tekkit:
- Uses legacy format
- Loader detection may be unreliable
- Falls back to JAR scanning

### Vanilla Launcher:
- No modpack metadata (single-player only)
- Manual config folder selection needed

---

## 💡 Adding New Launchers

To add support for a new launcher:

1. **Identify detection files** - What JSON/config files does it use?
2. **Add detection logic** in `instance-detector.ts`:
   - `detectMinecraftVersion()` - Add version detection
   - `detectLoader()` - Add loader detection
   - `detectModpack()` - Add modpack metadata
3. **Update type definitions** in `instance.types.ts`:
   - Add to `ModpackSource` type
   - Add to `InstanceMetadata` type
4. **Test thoroughly** with real instances
5. **Update this documentation**

---

## 📞 Support

If you're using a launcher not listed here or detection isn't working:

1. **Open an issue** on GitHub
2. **Provide**:
   - Launcher name and version
   - Sample instance folder structure
   - Detection files (JSON/config)
3. **We'll add support** in the next release!

---

**Last Updated**: January 12, 2026  
**MCED Version**: 1.1.0
