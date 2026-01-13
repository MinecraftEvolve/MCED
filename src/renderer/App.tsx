import { useState, useEffect } from "react";
import { useAppStore } from "./store";
import { useSettingsStore } from "./store/settingsStore";
import { useStatsStore } from "./store/statsStore";
import { useChangelogStore } from "./store/changelogStore";
import { Loader2, Settings as SettingsIcon, FolderOpen } from "lucide-react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { MainPanel } from "./components/MainPanel";
import { StatusBar } from "./components/StatusBar";
import { SmartSearch } from "./components/SmartSearch";
import { Settings } from "./components/Settings";
import { UpdateNotification } from "./components/UpdateNotification";
import { StatsModal } from "./components/StatsModal";
import { ChangelogViewer } from "./components/ChangelogViewer";
import { smartSearchService } from "./services/SmartSearchService";
import { configService } from "./services/ConfigService";
import modrinthAPI from "./services/api/ModrinthAPI";
import curseForgeAPI from "./services/api/CurseForgeAPI";
import { ModInfo } from "../shared/types/mod.types";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

async function associateConfigsWithMods(
  mods: ModInfo[],
  instancePath: string,
  defaultConfigsFolder?: string,
  serverConfigFolder?: string,
): Promise<ModInfo[]> {
  try {
    const modsWithConfigs = await Promise.all(
      mods.map(async (mod) => {
        try {
          const configFiles = await configService.loadModConfigs(
            instancePath,
            mod.modId,
            defaultConfigsFolder,
            serverConfigFolder,
          );
          return { ...mod, configFiles };
        } catch (error) {
          return mod;
        }
      }),
    );
    return modsWithConfigs;
  } catch (error) {
    return mods;
  }
}

async function enrichModsWithIcons(
  mods: ModInfo[],
  preferCurseForge: boolean = false,
): Promise<ModInfo[]> {
  const enrichedMods = await Promise.all(
    mods.map(async (mod) => {
      if (mod.icon) {
        return mod;
      }

      try {
        if (preferCurseForge) {
          const curseForgeMod = await curseForgeAPI.searchMod(mod.modId);
          if (curseForgeMod && curseForgeMod.logo) {
            return { ...mod, icon: curseForgeMod.logo.url };
          }

          if (mod.name && mod.name !== mod.modId) {
            const curseForgeMod2 = await curseForgeAPI.searchMod(mod.name);
            if (curseForgeMod2 && curseForgeMod2.logo) {
              return { ...mod, icon: curseForgeMod2.logo.url };
            }
          }
        }

        const modrinthMod = await modrinthAPI.searchMod(mod.modId);
        if (modrinthMod && modrinthMod.icon_url) {
          return { ...mod, icon: modrinthMod.icon_url };
        }

        if (mod.name && mod.name !== mod.modId) {
          const modrinthMod2 = await modrinthAPI.searchMod(mod.name);
          if (modrinthMod2 && modrinthMod2.icon_url) {
            return { ...mod, icon: modrinthMod2.icon_url };
          }
        }
      } catch (error) {
        // Failed to fetch icon
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
  const { startSession, endSession } = useStatsStore();
  const { startSession: startChangelogSession } = useChangelogStore();
  const [error, setError] = useState<string | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showChangelog, setShowChangelog] = useState(false);

  useEffect(() => {
    if (settings.curseForgeApiKey) {
      curseForgeAPI.setApiKey(settings.curseForgeApiKey);
    }
  }, [settings.curseForgeApiKey]);

  // Initialize Discord RPC when settings load
  useEffect(() => {
    if (settings.discordRpcEnabled !== undefined) {
      window.api.discordSetEnabled(settings.discordRpcEnabled);
    }
  }, [settings.discordRpcEnabled]);

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

  const handleOpenInstance = async (providedPath?: string) => {
    try {
      setError(null);
      setIsLoading(true);

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

      const instanceInfo = result.instance;
      setCurrentInstance(instanceInfo);
      addRecentInstance(String(instanceInfo.path));

      // Start tracking sessions
      const sessionId = `session_${Date.now()}`;
      startSession();
      startChangelogSession(sessionId);

      // Update Discord RPC with instance name and loading state
      if (settings.discordRpcEnabled) {
        window.api.discordSetInstance(instanceInfo.name || 'Minecraft Instance');
        window.api.discordSetMod('Loading mods...', 0);
      }

      const modsResult = await window.api.scanMods(instanceInfo.modsFolder);

      const modsList =
        modsResult.success && Array.isArray(modsResult.mods)
          ? modsResult.mods
          : [];

      const modsWithConfigs = await associateConfigsWithMods(
        modsList,
        instanceInfo.path,
        instanceInfo.defaultConfigsFolder,
        instanceInfo.serverConfigFolder,
      );
      setMods(modsWithConfigs);
      setIsLoading(false);

      // Update Discord RPC - show total mod count (not just mods with configs)
      if (settings.discordRpcEnabled && modsList.length > 0) {
        window.api.discordSetMod(`${modsList.length} mods installed`, modsList.length);
      }

      if (modsWithConfigs.length > 0) {
        const preferCurseForge = settings.curseForgeApiKey ? true : false;
        enrichModsWithIcons(modsWithConfigs, preferCurseForge)
          .then((modsWithIcons) => setMods(modsWithIcons))
          .catch(() => {});
      }
    } catch (error) {
      setError(
        (error as Error)?.message ||
          "Failed to open instance. Please select a valid Minecraft instance folder.",
      );
      setIsLoading(false);
    }
  };

  const handleCloseInstance = () => {
    // End tracking sessions
    endSession();
    
    setCurrentInstance(null);
    setMods([]);
    setError(null);

    // Clear Discord RPC
    if (settings.discordRpcEnabled) {
      window.api.discordClearInstance();
    }
  };

  useKeyboardShortcuts({
    onOpenSettings: () => setShowSettings(true),
    onOpenBackups: () => {
      const backupBtn = document.querySelector('[title="Backup Manager"]') as HTMLButtonElement;
      backupBtn?.click();
    },
    onOpenSearch: () => setShowSearch(true),
    onOpenInstance: () => handleOpenInstance(),
    onCloseInstance: handleCloseInstance,
  });

  useEffect(() => {
    document.documentElement.classList.add("dark");

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setShowSearch(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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

  return (
    <>
      {LoadingOverlay}
      <div className="flex flex-col h-screen bg-background text-foreground">
        <Header
          onSearchClick={() => setShowSearch(true)}
          onOpenInstance={handleOpenInstance}
          onCloseInstance={handleCloseInstance}
          onStatsClick={() => setShowStats(true)}
          onChangelogClick={() => setShowChangelog(true)}
        />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <MainPanel />
        </div>
        <StatusBar />

        {showSearch && <SmartSearch onClose={() => setShowSearch(false)} />}
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showStats && <StatsModal onClose={() => setShowStats(false)} />}
      {showChangelog && <ChangelogViewer onClose={() => setShowChangelog(false)} />}
      <UpdateNotification />
    </>
  );
}

export default App;
