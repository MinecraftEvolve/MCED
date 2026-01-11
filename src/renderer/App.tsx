import { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { useSettingsStore } from './store/settingsStore';
import { Loader2, Settings as SettingsIcon, FolderOpen } from 'lucide-react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { MainPanel } from './components/Layout/MainPanel';
import { StatusBar } from './components/Layout/StatusBar';
import { SmartSearch } from './components/SmartSearch/SmartSearch';
import { Settings } from './components/Settings/Settings';
import { smartSearchService } from './services/SmartSearchService';
import modrinthAPI from './services/api/ModrinthAPI';
import { ModInfo } from '../shared/types/mod.types';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';

// Helper to fetch icons from Modrinth for mods that don't have icons
async function enrichModsWithModrinthIcons(mods: ModInfo[]): Promise<ModInfo[]> {
  const enrichedMods = await Promise.all(
    mods.map(async (mod) => {
      // If mod already has an icon, skip
      if (mod.icon) {
        return mod;
      }

      try {
        // Try to fetch from Modrinth using mod ID or name
        const modrinthMod = await modrinthAPI.searchMod(mod.modId);
        if (modrinthMod && modrinthMod.icon_url) {
          return {
            ...mod,
            icon: modrinthMod.icon_url,
          };
        }

        // Try with mod name if modId didn't work
        if (mod.name && mod.name !== mod.modId) {
          const modrinthMod2 = await modrinthAPI.searchMod(mod.name);
          if (modrinthMod2 && modrinthMod2.icon_url) {
            return {
              ...mod,
              icon: modrinthMod2.icon_url,
            };
          }
        }
      } catch (error) {
        console.error(`Failed to fetch Modrinth icon for ${mod.name}:`, error);
      }

      return mod;
    })
  );

  return enrichedMods;
}

function App() {
  const { currentInstance, setCurrentInstance, setMods, setIsLoading, isLoading, mods, recentInstances, addRecentInstance } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const handleOpenInstance = async (providedPath?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Check if electronAPI is available
      if (!window.electronAPI) {
        throw new Error('Electron API not available. Please restart the application.');
      }

      // Open directory dialog or use provided path
      const path = providedPath || await window.electronAPI.openDirectory();
      if (!path) {
        setIsLoading(false);
        return;
      }

      // Detect instance
      const result = await window.electronAPI.detectInstance(path);
      if (!result.success || !result.instance) {
        throw new Error(result.error || 'Failed to detect instance');
      }

      setCurrentInstance(result.instance);
      
      // Add to recent instances
      addRecentInstance(path);

      // Scan mods
      const modsResult = await window.electronAPI.scanMods(result.instance.modsFolder);
      if (!modsResult.success || !modsResult.mods) {
        throw new Error(modsResult.error || 'Failed to scan mods');
      }

      const modsWithIcons = await enrichModsWithModrinthIcons(modsResult.mods);
      setMods(modsWithIcons);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Error opening instance:', err);
      setError(err.message || 'An error occurred');
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add dark mode class to html element
    document.documentElement.classList.add('dark');

    // Keyboard shortcut for search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Index configs when mods are loaded
  useEffect(() => {
    if (mods.length > 0 && currentInstance) {
      const configsByMod = new Map();
      mods.forEach(mod => {
        if (mod.configs && mod.configs.length > 0) {
          configsByMod.set(mod.id, mod.configs);
        }
      });
      smartSearchService.indexConfigs(mods, configsByMod);
    }
  }, [mods, currentInstance]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <img src="/logo.png" alt="Minecraft Config Editor" className="w-24 h-24 mb-6 drop-shadow-2xl animate-pulse" />
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
        <p className="text-xl font-semibold text-muted-foreground">Loading instance...</p>
      </div>
    );
  }

  if (!currentInstance) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
          {/* Logo */}
          <div className="mb-8">
            <img src="/logo.png" alt="Minecraft Config Editor" className="w-32 h-32 drop-shadow-2xl" />
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Minecraft Config Editor
          </h1>
          <p className="text-muted-foreground mb-12 text-lg">
            Modern config editing for your modpacks
          </p>

          {/* Main Actions */}
          <div className="flex flex-col gap-4 w-80">
            <button
              onClick={handleOpenInstance}
              className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold 
                       transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <FolderOpen size={24} />
              <span>Open Instance</span>
            </button>

            {recentInstances && recentInstances.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">Recent Instances</h3>
                <div className="space-y-2">
                  {recentInstances.slice(0, 3).map((instancePath, idx) => {
                    const instanceName = instancePath.split(/[/\\]/).pop() || instancePath;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleOpenInstance(instancePath)}
                        className="w-full px-4 py-3 bg-card hover:bg-card/80 rounded-lg text-left
                                 transition-all duration-200 border border-border hover:border-purple-500/50 group"
                      >
                        <div className="font-medium text-foreground group-hover:text-purple-400 transition-colors">
                          {instanceName}
                        </div>
                        <div className="text-xs text-muted-foreground truncate mt-1">
                          {instancePath}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="absolute top-4 right-4 p-3 rounded-lg bg-card hover:bg-card/80 border border-border 
                     hover:border-purple-500/50 transition-all duration-200"
            title="Settings (Ctrl+,)"
          >
            <SettingsIcon size={20} />
          </button>
        </div>

        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </>
    );
  }

  if (isLoading && mods.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
          <div className="text-center max-w-md px-6">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Minecraft Config Editor
            </h1>
            <p className="text-muted-foreground mb-8">
              Modern, intuitive config editing for your Minecraft modpacks
            </p>

            {error && (
              <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                <p className="text-destructive text-sm">{error}</p>
              </div>
            )}

            <button
              onClick={handleOpenInstance}
              disabled={isLoading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold 
                       hover:bg-primary/90 transition-all duration-200 transform hover:scale-105
                       disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
                       flex items-center gap-2 mx-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  📁 Open Minecraft Instance
                </>
              )}
            </button>

            <button
              onClick={() => setShowSettings(true)}
              className="mt-4 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-semibold 
                       hover:bg-secondary/90 transition-all duration-200 transform hover:scale-105
                       flex items-center gap-2 mx-auto"
            >
              <SettingsIcon className="w-5 h-5" />
              Settings
            </button>

            <div className="mt-12 text-left">
              <p className="text-sm text-muted-foreground mb-2">✨ Features:</p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Auto-detect mods and configs</li>
                <li>• Smart config-to-mod matching</li>
                <li>• Modern, intuitive interface</li>
                <li>• Quick launch integration</li>
                <li>• Smart search across configs</li>
              </ul>
            </div>
          </div>
        </div>
        
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header onSearchClick={() => setShowSearch(true)} />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <MainPanel />
        </div>
        <StatusBar />
        
        {showSearch && <SmartSearch onClose={() => setShowSearch(false)} />}
      </div>
      
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </>
  );
}

export default App;
