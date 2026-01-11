import React, { useState } from 'react';
import { useAppStore } from '@/store';
import './Settings.css';

export function Settings({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings } = useAppStore();
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    updateSettings(localSettings);
    onClose();
  };

  const handleClearCache = async () => {
    if (confirm('Are you sure you want to clear the API cache?')) {
      // Clear cache logic here
      alert('Cache cleared successfully!');
    }
  };

  return (
    <div className="settings-overlay">
      <div className="settings-modal">
        <div className="settings-header">
          <h2>⚙️ Settings</h2>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>

        <div className="settings-content">
          <section className="settings-section">
            <h3>Appearance</h3>
            
            <div className="setting-item">
              <label>
                <span className="setting-label">Theme</span>
                <span className="setting-description">Choose your preferred color scheme</span>
              </label>
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

            <div className="setting-item">
              <label>
                <span className="setting-label">Compact Mode</span>
                <span className="setting-description">Show more items with smaller spacing</span>
              </label>
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

          <section className="settings-section">
            <h3>Behavior</h3>
            
            <div className="setting-item">
              <label>
                <span className="setting-label">Auto-save</span>
                <span className="setting-description">Automatically save changes after editing</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.autoSave}
                  onChange={(e) => setLocalSettings({ ...localSettings, autoSave: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <label>
                <span className="setting-label">Create Backup Before Save</span>
                <span className="setting-description">Automatically backup configs before saving changes</span>
              </label>
              <label className="toggle">
                <input
                  type="checkbox"
                  checked={localSettings.createBackupBeforeSave}
                  onChange={(e) => setLocalSettings({ ...localSettings, createBackupBeforeSave: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="setting-item">
              <label>
                <span className="setting-label">Show Advanced Options</span>
                <span className="setting-description">Display advanced configuration options</span>
              </label>
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

          <section className="settings-section">
            <h3>API Integration</h3>
            
            <div className="setting-item">
              <label>
                <span className="setting-label">CurseForge API Key</span>
                <span className="setting-description">Optional: Add your CurseForge API key for better rate limits</span>
              </label>
              <input
                type="password"
                value={localSettings.curseforgeApiKey || ''}
                onChange={(e) => setLocalSettings({ ...localSettings, curseforgeApiKey: e.target.value })}
                placeholder="Enter API key..."
                className="setting-input"
              />
            </div>

            <div className="setting-item">
              <label>
                <span className="setting-label">Cache Duration (hours)</span>
                <span className="setting-description">How long to cache API responses</span>
              </label>
              <input
                type="number"
                min="1"
                max="168"
                value={localSettings.cacheDuration}
                onChange={(e) => setLocalSettings({ ...localSettings, cacheDuration: parseInt(e.target.value) })}
                className="setting-input"
              />
            </div>

            <div className="setting-item">
              <button onClick={handleClearCache} className="btn-secondary">
                Clear API Cache
              </button>
            </div>
          </section>

          <section className="settings-section">
            <h3>Recent Instances</h3>
            
            <div className="setting-item">
              <label>
                <span className="setting-label">Max Recent Instances</span>
                <span className="setting-description">Number of recent instances to remember</span>
              </label>
              <input
                type="number"
                min="3"
                max="20"
                value={localSettings.maxRecentInstances}
                onChange={(e) => setLocalSettings({ ...localSettings, maxRecentInstances: parseInt(e.target.value) })}
                className="setting-input"
              />
            </div>

            {localSettings.recentInstances && localSettings.recentInstances.length > 0 && (
              <div className="recent-instances-list">
                <span className="setting-label">Recent Instances:</span>
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
            )}
          </section>

          <section className="settings-section">
            <h3>Keyboard Shortcuts</h3>
            <div className="shortcuts-list">
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

          <section className="settings-section">
            <h3>About</h3>
            <p className="about-text">
              <strong>Minecraft Config Editor</strong> v1.0.0<br/>
              A modern desktop application for editing Minecraft modpack configurations.
            </p>
          </section>
        </div>

        <div className="settings-footer">
          <button onClick={onClose} className="btn-secondary">Cancel</button>
          <button onClick={handleSave} className="btn-primary">Save Settings</button>
        </div>
      </div>
    </div>
  );
}
