import { useState, useEffect } from 'react';
import { useAppStore } from './store';
import { Loader2 } from 'lucide-react';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { MainPanel } from './components/Layout/MainPanel';
import { StatusBar } from './components/Layout/StatusBar';
import { SmartSearch } from './components/SmartSearch/SmartSearch';
import { smartSearchService } from './services/SmartSearchService';

function App() {
  const { currentInstance, setCurrentInstance, setMods, setIsLoading, isLoading, mods } = useAppStore();
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);

  const handleOpenInstance = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Open directory dialog
      const path = await window.electronAPI.openDirectory();
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

      // Scan mods
      const modsResult = await window.electronAPI.scanMods(result.instance.modsFolder);
      if (!modsResult.success || !modsResult.mods) {
        throw new Error(modsResult.error || 'Failed to scan mods');
      }

      setMods(modsResult.mods);
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
      // Index all configs for search
      const configsByMod = new Map();
      // TODO: Load configs for all mods
      smartSearchService.indexConfigs(mods, configsByMod);
    }
  }, [mods, currentInstance]);

  if (!currentInstance) {
    return (
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
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header onSearchClick={() => setShowSearch(true)} />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainPanel />
      </div>
      <StatusBar />
      
      {showSearch && <SmartSearch onClose={() => setShowSearch(false)} />}
    </div>
  );
}

export default App;
