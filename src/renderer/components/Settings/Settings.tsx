import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSettingsStore } from '@/store/settingsStore';
import './Settings.css';

export function Settings({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, clearRecentInstances, resetSettings } = useSettingsStore();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    
    // Apply theme immediately
    if (localSettings.theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    
    // Apply accent color
    if (localSettings.accentColor) {
      document.documentElement.style.setProperty('--color-primary', localSettings.accentColor);
    }
    
    onClose();
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear the API cache?')) {
      try {
        await window.electron.invoke('clear-api-cache');
        alert('Cache cleared successfully!');
      } catch (error) {
        alert('Failed to clear cache: ' + error);
      }
    }
  };

  const handleClearRecentInstances = () => {
    if (confirm('Are you sure you want to clear all recent instances?')) {
      clearRecentInstances();
      setLocalSettings({ ...localSettings, recentInstances: [] });
    }
  };

  const handleResetSettings = () => {
    if (confirm('Are you sure you want to reset all settings to default?')) {
      resetSettings();
      setLocalSettings(useSettingsStore.getState().settings);
    }
  };

  return createPortal(
    <div className="settings-overlay" onClick={onClose}>
      <div className="settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="settings-content">
          {/* Appearance Section */}
          <section className="settings-section">
            <h3>🎨 Appearance</h3>
            
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Theme</span>
                <span className="setting-description">Choose your preferred color scheme</span>
              </div>
              <select
                value={localSettings.theme}
                onChange={(e) => setLocalSettings({ ...localSettings, theme: e.target.value as any })}
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
                  onChange={(e) => setLocalSettings({ ...localSettings, compactMode: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>

          {/* Behavior Section */}
          <section className="settings-section">
            <h3>⚡ Behavior</h3>
            
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Auto-save</span>
                <span className="setting-description">Automatically save changes after editing</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.autoSave}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoSave: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Create Backup Before Save</span>
                <span className="setting-description">Automatically backup configs before saving changes</span>
              </div>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.createBackupBeforeSave}
                  onChange={(e) => setLocalSettings({ ...localSettings, createBackupBeforeSave: e.target.checked })}
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
                  onChange={(e) => setLocalSettings({ ...localSettings, showAdvancedOptions: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </section>

          {/* API Integration Section */}
          <section className="settings-section">
            <h3>🔌 API Integration</h3>
            
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">CurseForge API Key</span>
                <span className="setting-description">Optional: Add your CurseForge API key for better rate limits</span>
              </div>
              <input
                type="password"
                value={localSettings.curseforgeApiKey || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, curseforgeApiKey: e.target.value })}
                placeholder="Enter API key..."
                className="setting-input"
              />
            </div>

            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Cache Duration</span>
                <span className="setting-description">How long to cache API responses (hours)</span>
              </div>
              <input
                type="number"
                min="1"
                max="168"
                value={localSettings.cacheDuration}
                onChange={(e) => setLocalSettings({ ...localSettings, cacheDuration: parseInt(e.target.value) })}
                className="setting-input-small"
              />
            </div>

            <div className="setting-row">
              <button onClick={handleClearCache} className="btn-secondary">
                🗑️ Clear API Cache
              </button>
            </div>
          </section>

          {/* Recent Instances Section */}
          <section className="settings-section">
            <h3>📂 Recent Instances</h3>
            
            <div className="setting-row">
              <div className="setting-info">
                <span className="setting-label">Max Recent Instances</span>
                <span className="setting-description">Number of recent instances to remember</span>
              </div>
              <input
                type="number"
                min="3"
                max="20"
                value={localSettings.maxRecentInstances}
                onChange={(e) => setLocalSettings({ ...localSettings, maxRecentInstances: parseInt(e.target.value) })}
                className="setting-input-small"
              />
            </div>

            {localSettings.recentInstances && localSettings.recentInstances.length > 0 && (
              <>
                <div className="recent-instances-list">
                  {localSettings.recentInstances.map((path, index) => (
                    <div key={index} className="recent-instance-item">
                      <span className="instance-path" title={path}>{path}</span>
                      <button
                        onClick={() => {
                          const updated = localSettings.recentInstances.filter((_, i) => i !== index);
                          setLocalSettings({ ...localSettings, recentInstances: updated });
                        }}
                        className="remove-btn"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="setting-row">
                  <button onClick={handleClearRecentInstances} className="btn-secondary">
                    🗑️ Clear All Recent Instances
                  </button>
                </div>
              </>
            )}
          </section>

          {/* Keyboard Shortcuts Section */}
          <section className="settings-section">
            <h3>⌨️ Keyboard Shortcuts</h3>
            <div className="shortcuts-grid">
              <div className="shortcut-item">
                <span>Save changes</span>
                <kbd>Ctrl+S</kbd>
              </div>
              <div className="shortcut-item">
                <span>Search mods</span>
                <kbd>Ctrl+F</kbd>
              </div>
              <div className="shortcut-item">
                <span>Discard changes</span>
                <kbd>Ctrl+Z</kbd>
              </div>
              <div className="shortcut-item">
                <span>Clear search</span>
                <kbd>ESC</kbd>
              </div>
            </div>
          </section>

          {/* About Section */}
          <section className="settings-section">
            <h3>ℹ️ About</h3>
            <div className="about-box">
              <strong>Minecraft Config Editor</strong>
              <span className="version-badge">v1.0.0</span>
              <p>A modern desktop application for editing Minecraft modpack configurations.</p>
              <div className="about-links">
                <a href="https://github.com/yourusername/minecraft-config-editor" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                <a href="https://github.com/yourusername/minecraft-config-editor/issues" target="_blank" rel="noopener noreferrer">
                  Report Issue
                </a>
              </div>
            </div>
          </section>
        </div>

        <div className="settings-footer">
          <button onClick={handleResetSettings} className="btn-danger">Reset to Defaults</button>
          <div className="footer-right">
            <button onClick={onClose} className="btn-secondary">Cancel</button>
            <button onClick={handleSave} className="btn-primary">💾 Save Settings</button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
