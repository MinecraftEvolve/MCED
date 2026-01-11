import React from 'react';
import { useAppStore } from '@/store';

export function Settings() {
  const { theme, setTheme } = useAppStore();

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Settings</h2>
      </div>

      {/* Theme Selection */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Appearance</h3>
        <div className="flex gap-4">
          <button
            onClick={() => setTheme('dark')}
            className={`px-4 py-2 rounded-md transition-colors ${
              theme === 'dark'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-accent'
            }`}
          >
            Dark Mode
          </button>
          <button
            onClick={() => setTheme('light')}
            className={`px-4 py-2 rounded-md transition-colors ${
              theme === 'light'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-foreground hover:bg-accent'
            }`}
          >
            Light Mode
          </button>
        </div>
      </div>

      {/* Keyboard Shortcuts Reference */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Save changes</span>
            <kbd className="px-2 py-1 bg-secondary rounded text-xs">Ctrl+S</kbd>
          </div>
          <div className="flex justify-between">
            <span>Search mods</span>
            <kbd className="px-2 py-1 bg-secondary rounded text-xs">Ctrl+F</kbd>
          </div>
          <div className="flex justify-between">
            <span>Discard changes</span>
            <kbd className="px-2 py-1 bg-secondary rounded text-xs">Ctrl+Z</kbd>
          </div>
          <div className="flex justify-between">
            <span>Clear search</span>
            <kbd className="px-2 py-1 bg-secondary rounded text-xs">ESC</kbd>
          </div>
        </div>
      </div>

      {/* About Section */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">About</h3>
        <p className="text-sm text-muted-foreground">
          Minecraft Config Editor v1.0.0
        </p>
        <p className="text-sm text-muted-foreground">
          A modern desktop application for editing Minecraft modpack configurations.
        </p>
      </div>
    </div>
  );
}
