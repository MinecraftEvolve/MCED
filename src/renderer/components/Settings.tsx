import React, { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { useSettingsStore } from "@/store/settingsStore";
import {
  Settings as SettingsIcon,
  X,
  Palette,
  Zap,
  Plug,
  FolderOpen,
  Keyboard,
  Info,
  Trash2,
  FileCode,
  Database,
  ArrowRightLeft,
  Download,
  FileText,
} from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import "./Settings.css";

export function Settings({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, clearRecentInstances, resetSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [appVersion, setAppVersion] = useState("...");
  const [latestVersion, setLatestVersion] = useState<string | null>(null);
  const [changelog, setChangelog] = useState<string>("");

  // Apply settings only when explicitly changed
  const applySettings = useCallback(
    (newSettings: typeof settings) => {
      const root = document.documentElement;

      // Apply theme
      if (newSettings.theme === "auto") {
        const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        root.classList.remove("light", "dark");
        root.classList.add(isDark ? "dark" : "light");
      } else if (newSettings.theme === "light") {
        root.classList.remove("dark");
        root.classList.add("light");
      } else if (newSettings.theme === "dark") {
        root.classList.remove("light");
        root.classList.add("dark");
      }

      // Apply accent color
      if (newSettings.accentColor) {
        root.style.setProperty("--color-primary", newSettings.accentColor);
      }

      // Apply compact mode class
      if (newSettings.compactMode) {
        document.body.classList.add("compact-mode");
      } else {
        document.body.classList.remove("compact-mode");
      }

      // Update the store
      updateSettings(newSettings);
    },
    [updateSettings]
  );

  useEffect(() => {
    // Fetch app version on mount
    window.api.getAppVersion().then((version) => {
      setAppVersion(version);
    });

    // Fetch latest changelog
    fetchChangelog();
  }, []);

  const handleClearCache = useCallback(async () => {
    if (confirm("Are you sure you want to clear the API cache?")) {
      try {
        await window.api.clearApiCache();
        alert("Cache cleared successfully!");
      } catch (error) {
        alert("Failed to clear cache: " + error);
      }
    }
  }, []);

  const handleClearRecentInstances = useCallback(() => {
    if (confirm("Are you sure you want to clear all recent instances?")) {
      clearRecentInstances();
      const newSettings = { ...localSettings, recentInstances: [] };
      setLocalSettings(newSettings);
      applySettings(newSettings);
    }
  }, [clearRecentInstances, localSettings, applySettings]);

  const handleCheckForUpdates = useCallback(async () => {
    try {
      const response = await fetch(
        "https://api.github.com/repos/MinecraftEvolve/MCED/releases/latest"
      );
      const data = await response.json();
      const latest = data.tag_name.replace("v", "");
      setLatestVersion(latest);

      if (latest !== appVersion) {
        if (
          confirm(
            `New version ${latest} is available!\n\nCurrent version: ${appVersion}\n\nWould you like to download it?`
          )
        ) {
          await window.api.openExternal(data.html_url);
        }
      } else {
        alert("You are already using the latest version!");
      }
    } catch (error) {
      alert("Failed to check for updates: " + error);
    }
  }, [appVersion]);

  const fetchChangelog = useCallback(async () => {
    try {
      const response = await fetch(
        "https://raw.githubusercontent.com/MinecraftEvolve/MCED/main/CHANGELOG.md"
      );
      const text = await response.text();
      setChangelog(text);
    } catch (error) {
      // Silently fail - not critical
    }
  }, []);

  const handleViewChangelog = useCallback(async () => {
    if (changelog) {
      // Create a temp HTML file and open it in the default browser
      const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>MCED Changelog</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 20px;
      line-height: 1.6;
      background: #1a1a1a;
      color: #e0e0e0;
      max-width: 1200px;
      margin: 0 auto;
    }
    h1, h2, h3 { color: #fff; }
    code { background: #2a2a2a; padding: 2px 6px; border-radius: 3px; }
    pre { background: #2a2a2a; padding: 10px; border-radius: 5px; overflow-x: auto; white-space: pre-wrap; }
  </style>
</head>
<body>
  <pre>${changelog}</pre>
</body>
</html>`;

      try {
        const tempPath = await window.api.getAppPath("temp");
        if (tempPath.success && tempPath.path) {
          const changelogPath = `${tempPath.path}/mced-changelog.html`;
          await window.api.writeFile(changelogPath, htmlContent);
          await window.api.openExternal(`file:///${changelogPath.replace(/\\/g, "/")}`);
        }
      } catch (error) {
        alert("Failed to open changelog: " + error);
      }
    }
  }, [changelog]);

  const handleResetSettings = useCallback(() => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      resetSettings();
      const newSettings = useSettingsStore.getState().settings;
      setLocalSettings(newSettings);
      applySettings(newSettings);
    }
  }, [resetSettings, applySettings]);

  const handleBulkMigrateServerConfigs = useCallback(async () => {
    if (
      !confirm(
        "This will migrate all server configs to defaultconfigs folder for all loaded mods. Continue?"
      )
    ) {
      return;
    }

    try {
      // Get the current instance path
      const currentInstancePath = (window as any).currentInstancePath;
      if (!currentInstancePath) {
        alert("No instance is currently loaded.");
        return;
      }

      const serverConfigFolder = await window.api.joinPath(currentInstancePath, "saves");
      const defaultConfigsFolder = await window.api.joinPath(currentInstancePath, "defaultconfigs");

      // Check if folders exist
      const serverExists = await window.api.fileExists(serverConfigFolder);
      if (!serverExists) {
        alert("No server configs folder found.");
        return;
      }

      // Get all world folders
      const worldFolders = await window.api.listDirectory(serverConfigFolder);
      if (!worldFolders || worldFolders.length === 0) {
        alert("No world folders found in saves directory.");
        return;
      }

      let migratedCount = 0;
      const errors: string[] = [];

      // Process each world folder
      for (const worldFolder of worldFolders) {
        const worldPath = await window.api.joinPath(serverConfigFolder, worldFolder);
        const serverConfigPath = await window.api.joinPath(worldPath, "serverconfig");

        const serverConfigExists = await window.api.fileExists(serverConfigPath);
        if (!serverConfigExists) {
          continue;
        }

        // Get all config files in serverconfig
        const configFiles = await window.api.listDirectory(serverConfigPath);
        if (!configFiles || configFiles.length === 0) {
          continue;
        }

        // Migrate each config file
        for (const configFile of configFiles) {
          try {
            const sourcePath = await window.api.joinPath(serverConfigPath, configFile);
            const destPath = await window.api.joinPath(defaultConfigsFolder, configFile);

            // Read source file
            const fileResult = await window.api.readFile(sourcePath);
            if (!fileResult.success || !fileResult.content) {
              console.error(`Failed to read ${configFile}`);
              continue;
            }

            // Write to defaultconfigs (will overwrite if exists)
            await window.api.writeFile(destPath, fileResult.content);

            migratedCount++;
          } catch (error) {
            errors.push(`Failed to migrate ${configFile}: ${error}`);
          }
        }
      }

      if (errors.length > 0) {
        alert(
          `Migration completed with errors:\n- ${migratedCount} files migrated\n- ${errors.length} errors\n\nErrors:\n${errors.join("\n")}`
        );
      } else {
        alert(`Successfully migrated ${migratedCount} server config files to defaultconfigs!`);
      }
    } catch (error) {
      alert(`Failed to migrate configs: ${error}`);
    }
  }, []);

  const handleRemoveRecentInstance = useCallback(
    (index: number) => {
      const updated = localSettings.recentInstances.filter((_, i) => i !== index);
      const newSettings = {
        ...localSettings,
        recentInstances: updated,
      };
      setLocalSettings(newSettings);
      applySettings(newSettings);
    },
    [localSettings, applySettings]
  );

  return createPortal(
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>
            <SettingsIcon className="icon" size={24} />
            Settings
          </h2>
          <button onClick={onClose} className="close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="settings-content">
          {/* Appearance Section */}
          <section className="settings-section">
            <h3>
              <Palette className="icon" size={20} />
              Appearance
            </h3>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Theme</span>
                <span className="setting-description">Choose your preferred color scheme</span>
              </div>
              <select
                value={localSettings.theme}
                onChange={(e) => {
                  const newSettings = {
                    ...localSettings,
                    theme: e.target.value as "dark" | "light" | "auto",
                  };
                  setLocalSettings(newSettings);
                  applySettings(newSettings);
                }}
                className="setting-select"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
                <option value="auto">Auto (System)</option>
              </select>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Compact Mode</span>
                <span className="setting-description">Show more items with smaller spacing</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.compactMode}
                  onChange={(e) => {
                    const newSettings = {
                      ...localSettings,
                      compactMode: e.target.checked,
                    };
                    setLocalSettings(newSettings);
                    applySettings(newSettings);
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>

          {/* Behavior Section */}
          <section className="settings-section">
            <h3>
              <Zap className="icon" size={20} />
              Behavior
            </h3>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Auto-save</span>
                <span className="setting-description">
                  Automatically save changes after editing
                </span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.autoSave}
                  onChange={(e) => {
                    const newSettings = {
                      ...localSettings,
                      autoSave: e.target.checked,
                    };
                    setLocalSettings(newSettings);
                    applySettings(newSettings);
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Create Backup Before Save</span>
                <span className="setting-description">
                  Automatically backup configs before saving changes
                </span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.createBackupBeforeSave}
                  onChange={(e) => {
                    const newSettings = {
                      ...localSettings,
                      createBackupBeforeSave: e.target.checked,
                    };
                    setLocalSettings(newSettings);
                    applySettings(newSettings);
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Show Advanced Options</span>
                <span className="setting-description">Display advanced configuration options</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.showAdvancedOptions}
                  onChange={(e) => {
                    const newSettings = {
                      ...localSettings,
                      showAdvancedOptions: e.target.checked,
                    };
                    setLocalSettings(newSettings);
                    applySettings(newSettings);
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Mods Without Configs at End</span>
                <span className="setting-description">
                  Show mods without config files at the end of the list
                </span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.modsWithoutConfigsAtEnd}
                  onChange={(e) => {
                    const newSettings = {
                      ...localSettings,
                      modsWithoutConfigsAtEnd: e.target.checked,
                    };
                    setLocalSettings(newSettings);
                    applySettings(newSettings);
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>

          {/* Editor Section */}
          <section className="settings-section">
            <h3>
              <FileCode className="icon" size={20} />
              Editor
            </h3>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Show Line Numbers</span>
                <span className="setting-description">
                  Display line numbers in the config editor
                </span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.showLineNumbers}
                  onChange={(e) => {
                    const newSettings = {
                      ...localSettings,
                      showLineNumbers: e.target.checked,
                    };
                    setLocalSettings(newSettings);
                    applySettings(newSettings);
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Enable Validation</span>
                <span className="setting-description">
                  Validate config values against allowed ranges and types
                </span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.enableValidation}
                  onChange={(e) => {
                    const newSettings = {
                      ...localSettings,
                      enableValidation: e.target.checked,
                    };
                    setLocalSettings(newSettings);
                    applySettings(newSettings);
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>

          {/* Config Management Section */}
          <section className="settings-section">
            <h3>
              <Database className="icon" size={20} />
              Config Management
            </h3>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Bulk Migrate Server Configs</span>
                <span className="setting-description">
                  Migrate all server configs from world saves to defaultconfigs folder
                </span>
              </div>
              <button onClick={handleBulkMigrateServerConfigs} className="btn-secondary">
                <ArrowRightLeft className="icon" size={16} />
                Migrate All
              </button>
            </div>
          </section>

          {/* API Integration Section - Advanced */}
          {localSettings.showAdvancedOptions && (
            <section className="settings-section">
              <h3>
                <Plug className="icon" size={20} />
                API Integration
              </h3>

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">CurseForge API Key</span>
                  <span className="setting-description">
                    Optional: Add your CurseForge API key for better rate limits
                  </span>
                </div>
                <input
                  type="password"
                  value={localSettings.curseForgeApiKey || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      curseForgeApiKey: e.target.value,
                    })
                  }
                  onBlur={() => applySettings(localSettings)}
                  placeholder="Enter API key..."
                  className="setting-input"
                />
              </div>

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">Cache Duration</span>
                  <span className="setting-description">
                    How long to cache API responses (hours)
                  </span>
                </div>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={localSettings.cacheDuration}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      cacheDuration: parseInt(e.target.value),
                    })
                  }
                  onBlur={() => applySettings(localSettings)}
                  className="setting-input-small"
                />
              </div>

              <div className="setting-row">
                <button onClick={handleClearCache} className="btn-secondary">
                  <Trash2 className="icon" size={16} />
                  Clear API Cache
                </button>
              </div>
            </section>
          )}

          {/* Discord Rich Presence Section */}
          <section className="settings-section">
            <h3>
              <Zap className="icon" size={20} />
              Discord Integration
            </h3>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Discord Rich Presence</span>
                <span className="setting-description">Show what you're editing in Discord</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.discordRpcEnabled}
                  onChange={(e) => {
                    const newSettings = {
                      ...localSettings,
                      discordRpcEnabled: e.target.checked,
                    };
                    setLocalSettings(newSettings);
                    applySettings(newSettings);
                    // Enable/disable Discord RPC immediately
                    window.api.discordSetEnabled(e.target.checked);
                  }}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>

          {/* Recent Instances Section - Advanced */}
          {localSettings.showAdvancedOptions && (
            <section className="settings-section">
              <h3>
                <FolderOpen className="icon" size={20} />
                Recent Instances
              </h3>

              <div className="setting-row">
                <div className="setting-info">
                  <span className="setting-label">Max Recent Instances</span>
                  <span className="setting-description">
                    Number of recent instances to remember
                  </span>
                </div>
                <input
                  type="number"
                  min="3"
                  max="20"
                  value={localSettings.maxRecentInstances}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      maxRecentInstances: parseInt(e.target.value),
                    })
                  }
                  onBlur={() => applySettings(localSettings)}
                  className="setting-input-small"
                />
              </div>

              {localSettings.recentInstances && localSettings.recentInstances.length > 0 && (
                <>
                  <div className="recent-instances-list">
                    {localSettings.recentInstances.map((path, index) => (
                      <div key={index} className="recent-instance-item">
                        <span className="instance-path" title={path}>
                          {path}
                        </span>
                        <button
                          onClick={() => handleRemoveRecentInstance(index)}
                          className="remove-btn"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="setting-row">
                    <button onClick={handleClearRecentInstances} className="btn-secondary">
                      <Trash2 className="icon" size={16} />
                      Clear All Recent Instances
                    </button>
                  </div>
                </>
              )}
            </section>
          )}

          {/* Keyboard Shortcuts Section */}
          <section className="settings-section">
            <h3>
              <Keyboard className="icon" size={20} />
              Keyboard Shortcuts
            </h3>
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <span>Save changes</span>
                <Kbd>Ctrl+S</Kbd>
              </div>
              <div className="shortcut-item">
                <span>Save all</span>
                <Kbd>Ctrl+Shift+S</Kbd>
              </div>
              <div className="shortcut-item">
                <span>Undo</span>
                <Kbd>Ctrl+Z</Kbd>
              </div>
              <div className="shortcut-item">
                <span>Redo</span>
                <Kbd>Ctrl+Y</Kbd>
              </div>
              <div className="shortcut-item">
                <span>Search mods</span>
                <Kbd>Ctrl+F</Kbd>
              </div>
              <div className="shortcut-item">
                <span>Open settings</span>
                <Kbd>Ctrl+,</Kbd>
              </div>
              <div className="shortcut-item">
                <span>Open backups</span>
                <Kbd>Ctrl+B</Kbd>
              </div>
              <div className="shortcut-item">
                <span>Open instance</span>
                <Kbd>Ctrl+O</Kbd>
              </div>
              <div className="shortcut-item">
                <span>Close instance</span>
                <Kbd>Ctrl+W</Kbd>
              </div>
              <div className="shortcut-item">
                <span>Previous mod</span>
                <Kbd>Alt+←</Kbd>
              </div>
              <div className="shortcut-item">
                <span>Next mod</span>
                <Kbd>Alt+→</Kbd>
              </div>
              <div className="shortcut-item">
                <span>Clear search</span>
                <Kbd>ESC</Kbd>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="settings-section">
            <h3>
              <Info className="icon" size={20} />
              About
            </h3>
            <div className="about-box">
              <strong>Minecraft Config Editor Desktop</strong>
              <span className="version-badge">v{appVersion}</span>
              {latestVersion && latestVersion !== appVersion && (
                <span className="update-badge">Update Available: v{latestVersion}</span>
              )}
              <p>A modern desktop application for editing Minecraft modpack configurations.</p>
              <div className="about-links">
                <button
                  onClick={() => window.api.openExternal("https://github.com/MinecraftEvolve/MCED")}
                  className="link-button"
                >
                  GitHub
                </button>
                <button
                  onClick={() =>
                    window.api.openExternal("https://github.com/MinecraftEvolve/MCED/issues")
                  }
                  className="link-button"
                >
                  Report Issue
                </button>
              </div>
              <div className="setting-row" style={{ marginTop: "12px" }}>
                <button onClick={handleCheckForUpdates} className="btn-secondary">
                  <Download className="icon" size={16} />
                  Check for Updates
                </button>
                {changelog && (
                  <button onClick={handleViewChangelog} className="btn-secondary">
                    <FileText className="icon" size={16} />
                    View Changelog
                  </button>
                )}
              </div>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button onClick={handleResetSettings} className="btn-danger">
            Reset to Defaults
          </button>
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
