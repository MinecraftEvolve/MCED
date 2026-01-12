import { useState, useEffect } from "react";
import { useAppStore } from "./store";
import { useSettingsStore } from "./store/settingsStore";
import { Loader2, Settings as SettingsIcon, FolderOpen } from "lucide-react";
import { Header } from "./components/Layout/Header";
import { Sidebar } from "./components/Layout/Sidebar";
import { MainPanel } from "./components/Layout/MainPanel";
import { StatusBar } from "./components/Layout/StatusBar";
import { SmartSearch } from "./components/SmartSearch/SmartSearch";
import { Settings } from "./components/Settings/Settings";
import { smartSearchService } from "./services/SmartSearchService";
import modrinthAPI from "./services/api/ModrinthAPI";
import { ModInfo } from "../shared/types/mod.types";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

// Helper to associate config files with mods
async function associateConfigsWithMods(
  mods: ModInfo[],
  configFolder: string,
): Promise<ModInfo[]> {
  try {
    // Get all config files
    const result = await window.api.readdir(configFolder);
    if (!result.success || !result.files) {
      return mods;
    }

    const configFiles = result.files.filter(
      (file: string) => file.endsWith(".toml") || file.endsWith(".json"),
    );

    // Associate configs with mods based on filename matching
    return mods.map((mod) => {
      const modConfigs = configFiles.filter((configFile: string) => {
        const fileName = configFile.toLowerCase().replace(/\.(toml|json)$/, "");
        const modIdLower = mod.modId.toLowerCase();

        // Normalize by removing hyphens and underscores
        const normalizedFileName = fileName.replace(/[-_]/g, "");
        const normalizedModId = modIdLower.replace(/[-_]/g, "");

        // Exact match
        if (normalizedFileName === normalizedModId) {
          return true;
        }

        // Check if filename is modId + config variant (client, common, server, etc.)
        const validSuffixes = ["client", "common", "server", "forge", "fabric"];
        for (const suffix of validSuffixes) {
          const normalizedSuffix = suffix.replace(/[-_]/g, "");
          if (normalizedFileName === normalizedModId + normalizedSuffix) {
            return true;
          }
        }

        return false;
      });

      return {
        ...mod,
        configFiles: modConfigs.map((file: string) => ({
          filename: file,
          name: file,
          path: `${configFolder}/${file}`,
          content: "",
          format: file.endsWith(".toml") ? "toml" : "json",
          settings: [],
        })),
      };
    });
  } catch (error) {
    return mods;
  }
}

// Helper to fetch icons from Modrinth for mods that don't have icons
async function enrichModsWithModrinthIcons(
  mods: ModInfo[],
): Promise<ModInfo[]> {
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
        // Failed to fetch icon - silently continue
      }

      return mod;
    }),
  );

  return enrichedMods;
}

function App() {
  const {
    currentInstance,
    setCurrentInstance,
    setMods,
    setIsLoading,
    isLoading,
    mods,
    recentInstances,
    addRecentInstance,
  } = useAppStore();
  const { settings } = useSettingsStore();
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // Apply theme on app load
  useEffect(() => {
    const root = document.documentElement;

    if (settings.theme === "auto") {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      root.classList.remove("light", "dark");
      root.classList.add(isDark ? "dark" : "light");
    } else if (settings.theme === "light") {
      root.classList.remove("dark");
      root.classList.add("light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
    }

    if (settings.accentColor) {
      root.style.setProperty("--color-primary", settings.accentColor);
    }

    if (settings.compactMode) {
      document.body.classList.add("compact-mode");
    } else {
      document.body.classList.remove("compact-mode");
    }
  }, [settings]);

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  const handleOpenInstance = async (providedPath?: string) => {
    try {
      setError(null);
      setIsLoading(true);

      // Get instance path
      const instancePath =
        providedPath || (await window.electron.openDirectory());

      if (!instancePath) {
        setIsLoading(false);
        return;
      }

      // Detect instance
      const result = await window.api.detectInstance(instancePath);

      if (!result.success || !result.instance) {
        setError("Could not detect a valid Minecraft instance in this folder.");
        setIsLoading(false);
        return;
      }

      // Store instance info
      const instanceInfo = result.instance;
      setCurrentInstance(instanceInfo);
      addRecentInstance(String(instanceInfo.path));

      // Scan mods from mods folder
      const modsResult = await window.api.scanMods(instanceInfo.modsFolder);

      const modsList =
        modsResult.success && Array.isArray(modsResult.mods)
          ? modsResult.mods
          : [];

      // Associate config files with mods
      const modsWithConfigs = await associateConfigsWithMods(
        modsList,
        instanceInfo.configFolder,
      );
      setMods(modsWithConfigs);
      setIsLoading(false);

      // Enrich with icons in background
      if (modsWithConfigs.length > 0) {
        enrichModsWithModrinthIcons(modsWithConfigs)
          .then((modsWithIcons) => setMods(modsWithIcons))
          .catch(() => {}); // Silently fail
      }
    } catch (error) {
      setError(
        (error as Error)?.message ||
          "Failed to open instance. Please select a valid Minecraft instance folder.",
      );
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Add dark mode class to html element
    document.documentElement.classList.add("dark");

    // Keyboard shortcut for search
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Index configs when mods are loaded
  useEffect(() => {
    if (mods.length > 0 && currentInstance) {
      const configsByMod = new Map();
      mods.forEach((mod) => {
        if (mod.configFiles && mod.configFiles.length > 0) {
          configsByMod.set(mod.modId, mod.configFiles);
        }
      });
      smartSearchService.indexConfigs(mods, configsByMod);
    }
  }, [mods, currentInstance]);

  // Loading overlay (doesn't block window interaction)
  const LoadingOverlay = isLoading ? (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-background p-8 rounded-lg shadow-xl flex flex-col items-center pointer-events-auto">
        <Loader2 className="w-16 h-16 text-purple-500 animate-spin mb-4" />
        <p className="text-xl font-semibold text-foreground">
          Loading instance...
        </p>
      </div>
    </div>
  ) : null;

  if (!currentInstance) {
    return (
      <>
        {LoadingOverlay}
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
          {/* Logo */}
          <div className="mb-8">
            <img
              src="./logo.png"
              alt="Minecraft Config Editor Desktop"
              className="w-32 h-32 drop-shadow-2xl"
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl font-bold mb-4 pb-2 bg-gradient-to-r from-purple-400 to-purple-600 bg-clip-text text-transparent">
            Minecraft Config Editor Desktop
          </h1>
          <p className="text-muted-foreground mb-12 text-lg">
            Modern config editing for your modpacks
          </p>

          {/* Main Actions */}
          <div className="flex flex-col gap-4 w-80">
            <button
              onClick={(e) => {
                e.preventDefault();
                handleOpenInstance();
              }}
              className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold 
                       transition-all duration-200 transform hover:scale-105 flex items-center justify-center gap-3"
            >
              <FolderOpen size={24} />
              <span>Open Instance</span>
            </button>

            {recentInstances && recentInstances.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3 px-2">
                  Recent Instances
                </h3>
                <div className="space-y-2">
                  {recentInstances.slice(0, 3).map((instancePath, idx) => {
                    const instanceName =
                      instancePath.split(/[/\\]/).pop() || instancePath;
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

  const handleCloseInstance = () => {
    setCurrentInstance(null);
    setMods([]);
    setError(null);
  };

  return (
    <>
      {LoadingOverlay}
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header
          onSearchClick={() => setShowSearch(true)}
          onOpenInstance={handleOpenInstance}
          onCloseInstance={handleCloseInstance}
        />
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
