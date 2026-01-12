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
} from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import "./Settings.css";

export function Settings({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, clearRecentInstances, resetSettings } =
    useSettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);
  const [appVersion, setAppVersion] = useState("");

  // Apply settings only when explicitly changed
  const applySettings = useCallback(
    (newSettings: typeof settings) => {
      const root = document.documentElement;

      // Apply theme
      if (newSettings.theme === "auto") {
        const isDark = window.matchMedia(
          "(prefers-color-scheme: dark)",
        ).matches;
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
    [updateSettings],
  );

  useEffect(() => {
    // Fetch app version on mount
    window.api.getAppVersion().then((version) => {
      setAppVersion(version);
    });
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

  const handleResetSettings = useCallback(() => {
    if (confirm("Are you sure you want to reset all settings to default?")) {
      resetSettings();
      const newSettings = useSettingsStore.getState().settings;
      setLocalSettings(newSettings);
      applySettings(newSettings);
    }
  }, [resetSettings, applySettings]);

  const handleRemoveRecentInstance = useCallback(
    (index: number) => {
      const updated = localSettings.recentInstances.filter(
        (_, i) => i !== index,
      );
      const newSettings = {
        ...localSettings,
        recentInstances: updated,
      };
      setLocalSettings(newSettings);
      applySettings(newSettings);
    },
    [localSettings, applySettings],
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
                <span className="setting-description">
                  Choose your preferred color scheme
                </span>
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
                <span className="setting-description">
                  Show more items with smaller spacing
                </span>
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
                <span className="setting-description">
                  Display advanced configuration options
                </span>
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
                <span className="setting-label">
                  Mods Without Configs at End
                </span>
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
                  value={localSettings.curseforgeApiKey || ""}
                  onChange={(e) =>
                    setLocalSettings({
                      ...localSettings,
                      curseforgeApiKey: e.target.value,
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

              {localSettings.recentInstances &&
                localSettings.recentInstances.length > 0 && (
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
                      <button
                        onClick={handleClearRecentInstances}
                        className="btn-secondary"
                      >
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
                <span>Discard changes</span>
                <Kbd>Ctrl+Z</Kbd>
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
              <p>
                A modern desktop application for editing Minecraft modpack
                configurations.
              </p>
              <div className="about-links">
                <a
                  href="https://github.com/yourusername/minecraft-config-editor"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub
                </a>
                <a
                  href="https://github.com/yourusername/minecraft-config-editor/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Report Issue
                </a>
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
    document.body,
  );
}
