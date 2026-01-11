import React from 'react';
import { useAppStore } from '@/store';
import { ProfileManager } from '../ConfigEditor/ProfileManager';
import './Settings.css';

export function Settings() {
  const { settings, updateSettings } = useAppStore();

  if (!settings) return null;

  const handleThemeChange = (theme: 'dark' | 'light') => {
    updateSettings({ theme });
    document.documentElement.setAttribute('data-theme', theme);
  };

  const handleAccentChange = (accent: string) => {
    updateSettings({ accentColor: accent });
    document.documentElement.style.setProperty('--accent-color', accent);
  };

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
        <p>Customize your Minecraft Config Editor experience</p>
      </div>

      <div className="settings-section">
        <h3>Appearance</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Theme</label>
            <span className="setting-description">Choose your preferred theme</span>
          </div>
          <div className="theme-selector">
            <button
              className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
              onClick={() => handleThemeChange('dark')}
            >
              🌙 Dark
            </button>
            <button
              className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
              onClick={() => handleThemeChange('light')}
            >
              ☀️ Light
            </button>
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Accent Color</label>
            <span className="setting-description">Choose your accent color</span>
          </div>
          <div className="color-selector">
            {['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#ef4444'].map(color => (
              <button
                key={color}
                className={`color-btn ${settings.accentColor === color ? 'active' : ''}`}
                style={{ background: color }}
                onClick={() => handleAccentChange(color)}
                title={color}
              />
            ))}
          </div>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Show Animations</label>
            <span className="setting-description">Enable smooth animations and transitions</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.showAnimations}
              onChange={e => updateSettings({ showAnimations: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Editor</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Auto-save</label>
            <span className="setting-description">Automatically save changes</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.autoSave}
              onChange={e => updateSettings({ autoSave: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Auto-backup</label>
            <span className="setting-description">Create backups before saving</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.autoBackup}
              onChange={e => updateSettings({ autoBackup: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>Show Tooltips</label>
            <span className="setting-description">Display helpful tooltips</span>
          </div>
          <label className="switch">
            <input
              type="checkbox"
              checked={settings.showTooltips}
              onChange={e => updateSettings({ showTooltips: e.target.checked })}
            />
            <span className="slider"></span>
          </label>
        </div>
      </div>

      <div className="settings-section">
        <h3>Cache & API</h3>
        
        <div className="setting-item">
          <div className="setting-info">
            <label>Cache Duration</label>
            <span className="setting-description">How long to cache API responses (hours)</span>
          </div>
          <input
            type="number"
            min="1"
            max="168"
            value={settings.cacheDuration / (1000 * 60 * 60)}
            onChange={e => updateSettings({ cacheDuration: parseInt(e.target.value) * 1000 * 60 * 60 })}
            className="number-input"
          />
        </div>

        <div className="setting-item">
          <div className="setting-info">
            <label>API Rate Limit</label>
            <span className="setting-description">Maximum API requests per minute</span>
          </div>
          <input
            type="number"
            min="5"
            max="60"
            value={settings.apiRateLimit}
            onChange={e => updateSettings({ apiRateLimit: parseInt(e.target.value) })}
            className="number-input"
          />
        </div>
      </div>

      <div className="settings-section">
        <ProfileManager />
      </div>

      <div className="settings-section">
        <h3>About</h3>
        <div className="about-info">
          <p><strong>Minecraft Config Editor</strong></p>
          <p>Version 1.0.0</p>
          <p>Built with ❤️ by the MCED Team</p>
          <div className="about-links">
            <a href="https://github.com/MinecraftEvolve/MCED" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
            <a href="https://github.com/MinecraftEvolve/MCED/issues" target="_blank" rel="noopener noreferrer">
              Report Issue
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
