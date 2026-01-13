# Windows Installation Guide

## 📦 Installation Methods

MCED offers two installation methods:

### Method 1: Portable Version (Recommended - No Installation Required)
**File**: `Minecraft-Config-Editor-1.0.9-portable.exe`

✅ **Advantages:**
- No installation required
- No SmartScreen warnings
- Run directly from any folder
- Easy to move/backup

**Steps:**
1. Download `Minecraft-Config-Editor-1.0.9-portable.exe`
2. Double-click to run
3. That's it!

### Method 2: Traditional Installer
**File**: `Minecraft-Config-Editor-1.0.9.exe`

⚠️ **Note:** Windows may show a SmartScreen warning because the app is not code-signed (costs $400+/year).

**Steps:**
1. Download `Minecraft-Config-Editor-1.0.9.exe`
2. Double-click to run the installer
3. If you see "Windows protected your PC":
   - Click "More info"
   - Click "Run anyway"
4. Follow the installation wizard

## 🛡️ Why Does Windows Show a Warning?

Windows SmartScreen shows warnings for unsigned applications. Code signing certificates cost $100-600/year, which is not feasible for free, open-source projects.

**This does NOT mean the app is unsafe!**
- ✅ The code is fully open-source on GitHub
- ✅ You can review every line of code
- ✅ Built with legitimate tools (Electron, TypeScript)
- ✅ No malware, no tracking, no data collection

## 🔍 Verification Steps

To verify the app is safe:

1. **Check the Source Code**
   - Visit: https://github.com/MinecraftEvolve/MCED
   - Review the code yourself

2. **Build From Source** (Ultimate verification)
   ```bash
   git clone https://github.com/MinecraftEvolve/MCED.git
   cd MCED
   npm install
   npm run build
   npm run package:win
   ```

3. **Scan with Antivirus**
   - Run your preferred antivirus scanner
   - VirusTotal: https://www.virustotal.com

## 🚫 What to Do if Windows Blocks the App

### During Download:
1. Browser may say "file isn't commonly downloaded"
2. Click the "^" arrow next to the download
3. Select "Keep"

### During Installation:
1. Windows Defender SmartScreen popup appears
2. Click "More info"
3. Click "Run anyway"

### If Windows Defender Removes the File:
1. Open Windows Security
2. Go to "Virus & threat protection"
3. Click "Protection history"
4. Find MCED in the list
5. Click "Actions" → "Allow"
6. Click "Restore"

## 🎯 Portable vs Installer - Which Should I Choose?

| Feature | Portable | Installer |
|---------|----------|-----------|
| SmartScreen Warning | ❌ None | ⚠️ Shows warning |
| Installation Required | ❌ No | ✅ Yes |
| Start Menu Entry | ❌ No | ✅ Yes |
| Desktop Shortcut | ❌ Manual | ✅ Automatic |
| Auto-Updates | ⚠️ Manual | ⚠️ Manual |
| Uninstallation | Delete file | Add/Remove Programs |

**Recommendation**: Use **Portable** if you want zero hassle.

## 💡 For Advanced Users

### Code Signing Certificate Info
If you want to help eliminate this warning for all users, consider sponsoring a code signing certificate:
- Standard Certificate: ~$100-200/year
- EV Certificate (instant trust): ~$300-600/year

Sponsorship options: [GitHub Sponsors](https://github.com/sponsors/Luke1505)

### Alternative: Build from Source
The most secure way is to build the app yourself:
```bash
npm run package:win
```
Your self-built version will still show a warning, but you'll know it's safe because you built it!

---

**Still have concerns?** Open an issue: https://github.com/MinecraftEvolve/MCED/issues
