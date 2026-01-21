import { useState, useEffect } from "react";
import { useAppStore } from "./store";
import { useSettingsStore } from "./store/settingsStore";
import { useStatsStore } from "./store/statsStore";
import { useChangelogStore } from "./store/changelogStore";
import { NotificationProvider } from "./components/common/Notifications";
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
import { LauncherIcon } from "./components/LauncherIcon";
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
  serverConfigFolder?: string
): Promise<ModInfo[]> {
  try {
    const modsWithConfigs = await Promise.all(
      mods.map(async (mod) => {
        try {
          const configFiles = await configService.loadModConfigs(
            instancePath,
            mod.modId,
            defaultConfigsFolder,
            serverConfigFolder
          );
          return { ...mod, configFiles };
        } catch (error) {
          return mod;
        }
      })
    );
    return modsWithConfigs;
  } catch (error) {
    return mods;
  }
}

async function enrichModsWithIcons(
  mods: ModInfo[],
  preferCurseForge: boolean = false
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
    })
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
    setLauncherType,
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

  // Global handler for external links
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "A") {
        const href = target.getAttribute("href");
        if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
          e.preventDefault();
          window.api.openExternal(href);
        }
      }
    };

    document.addEventListener("click", handleLinkClick);
    return () => document.removeEventListener("click", handleLinkClick);
  }, []);

  const handleOpenInstance = async (providedPath?: string) => {
    try {
      setError(null);
      setIsLoading(true);

      const instancePath = providedPath || (await window.electron.openDirectory());

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
      setLauncherType(result.launcherType || "unknown");
      addRecentInstance({
        path: String(instanceInfo.path),
        name: instanceInfo.name,
        minecraftVersion: instanceInfo.minecraftVersion,
        loader: instanceInfo.loader
          ? `${instanceInfo.loader.type} ${instanceInfo.loader.version}`.trim()
          : "unknown",
        launcher: result.launcherType,
      });

      // Start tracking sessions
      const sessionId = `session_${Date.now()}`;
      startSession();
      startChangelogSession(sessionId);

      // Update Discord RPC with instance name and loading state
      if (settings.discordRpcEnabled) {
        window.api.discordSetInstance(instanceInfo.name || "Minecraft Instance");
        window.api.discordSetMod("Loading mods...", 0);
      }

      const modsResult = await window.api.scanMods(instanceInfo.modsFolder);

      const modsList = modsResult.success && Array.isArray(modsResult.mods) ? modsResult.mods : [];

      const modsWithConfigs = await associateConfigsWithMods(
        modsList,
        instanceInfo.path,
        instanceInfo.defaultConfigsFolder,
        instanceInfo.serverConfigFolder
      );
      setMods(modsWithConfigs);

      // Detect KubeJS and load item registry if present
      const hasKubeJS = modsList.some(
        (mod) => mod.modId === "kubejs" || mod.name?.toLowerCase().includes("kubejs")
      );

      if (hasKubeJS) {
        try {
          await window.api.itemRegistryInitialize(instanceInfo.path, instanceInfo.modsFolder);
          await window.api.fluidRegistryInitialize(instanceInfo.path, instanceInfo.modsFolder);
        } catch (error) {
          console.error("Failed to load KubeJS registries:", error);
        }
      }

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
          "Failed to open instance. Please select a valid Minecraft instance folder."
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

  const handleReloadMods = async () => {
    if (!currentInstance) return;

    try {
      setIsLoading(true);

      const modsResult = await window.api.scanMods(currentInstance.modsFolder);
      const modsList = modsResult.success && Array.isArray(modsResult.mods) ? modsResult.mods : [];

      const modsWithConfigs = await associateConfigsWithMods(
        modsList,
        currentInstance.path,
        currentInstance.defaultConfigsFolder,
        currentInstance.serverConfigFolder
      );

      setMods(modsWithConfigs);
      setIsLoading(false);

      // Update Discord RPC
      if (settings.discordRpcEnabled && modsList.length > 0) {
        window.api.discordSetMod(`${modsList.length} mods installed`, modsList.length);
      }

      // Enrich with icons
      if (modsWithConfigs.length > 0) {
        const preferCurseForge = settings.curseForgeApiKey ? true : false;
        enrichModsWithIcons(modsWithConfigs, preferCurseForge)
          .then((modsWithIcons) => setMods(modsWithIcons))
          .catch(() => {});
      }
    } catch (error) {
      console.error("Failed to reload mods:", error);
      setIsLoading(false);
    }
  };

  // Set reloadMods in store
  useEffect(() => {
    useAppStore.setState({ reloadMods: handleReloadMods });
  }, [currentInstance, settings.discordRpcEnabled, settings.curseForgeApiKey]);

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none animate-fadeIn">
      <div className="bg-card/90 backdrop-blur-xl p-10 rounded-3xl shadow-2xl flex flex-col items-center pointer-events-auto border-2 border-purple-500/30 animate-slideInRight">
        <Loader2 className="w-20 h-20 text-purple-500 animate-spin mb-6" />
        <p className="text-2xl font-bold text-foreground mb-2">Loading instance...</p>
        <p className="text-sm text-muted-foreground">This may take a moment</p>
      </div>
    </div>
  ) : null;

  if (!currentInstance) {
    return (
      <>
        {LoadingOverlay}
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          {/* Content */}
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo */}
            <div className="mb-6 group">
              <img
                src="./logo.png"
                alt="Minecraft Config Editor Desktop"
                className="w-24 h-24 drop-shadow-2xl group-hover:scale-110 transition-transform duration-300 animate-fadeIn"
              />
            </div>

            {/* Title */}
            <h1 className="text-4xl font-bold mb-2 pb-2 text-primary animate-fadeIn">
              Minecraft Config Editor Desktop
            </h1>
            <p className="text-muted-foreground mb-8 text-base animate-fadeIn" style={{ animationDelay: '0.1s' }}>
              Modern config editing for your modpacks
            </p>

            {/* Main Actions */}
            <div className="flex flex-col gap-3 w-80 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleOpenInstance();
                }}
                className="w-full px-6 py-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-base
                         transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg hover:shadow-xl group"
              >
                <FolderOpen size={20} className="group-hover:scale-110 transition-transform" />
                <span>Open Instance</span>
              </button>

              {recentInstances && recentInstances.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-xs font-semibold text-muted-foreground mb-3 px-2 flex items-center gap-2">
                    <div className="w-1 h-3 bg-purple-500 rounded-full"></div>
                    Recent Instances
                  </h3>
                  <div className="space-y-2">
                    {recentInstances.slice(0, 3).map((instance, idx) => {
                      const instancePath = typeof instance === "string" ? instance : instance.path;
                      const instanceName =
                        (typeof instance === "object" && instance.name) ||
                        instancePath.split(/[/\\]/).pop() ||
                        instancePath;
                      return (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleOpenInstance(instancePath);
                          }}
                          className="w-full px-4 py-3 bg-card/50 backdrop-blur-sm hover:bg-purple-900/30 rounded-xl text-left
                                   transition-all duration-200 border-2 border-purple-500/20 hover:border-purple-500/50 group overflow-hidden hover:shadow-lg transform hover:scale-[1.01]"
                          style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm">
                              {instanceName}
                            </div>
                            {typeof instance === "object" && instance.launcher && (
                              <LauncherIcon launcher={instance.launcher} size={18} />
                            )}
                          </div>
                          {typeof instance === "object" &&
                            instance.minecraftVersion &&
                            instance.loader && (
                              <div className="flex items-center gap-2 text-xs mt-1.5">
                                <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded-md text-xs font-semibold border border-green-500/30">
                                  MC {instance.minecraftVersion}
                                </span>
                                <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded-md text-xs font-semibold border border-purple-500/30">
                                  {instance.loader}
                                </span>
                              </div>
                            )}
                          <div className="text-xs text-muted-foreground truncate mt-1.5 font-mono opacity-70">
                            {instancePath}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="absolute top-4 right-4 p-3 rounded-xl bg-card/50 backdrop-blur-sm hover:bg-card/80 border-2 border-primary/20 
                     hover:border-primary/50 transition-all duration-200 group shadow-lg hover:shadow-primary/20 transform hover:scale-105"
            title="Settings (Ctrl+,)"
          >
            <SettingsIcon size={20} className="group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>

        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </>
    );
  }

  return (
    <NotificationProvider>
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
          {showSearch && <SmartSearch onClose={() => setShowSearch(false)} />}
          <div className="flex flex-1 overflow-hidden">
            <Sidebar />
            <MainPanel />
          </div>
          <StatusBar />
        </div>
        {showStats && <StatsModal onClose={() => setShowStats(false)} />}
        {showChangelog && <ChangelogViewer onClose={() => setShowChangelog(false)} />}
        <UpdateNotification />
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
        {/* useKeyboardShortcuts() - temporarily disabled due to hooks order issue */}
      </>
    </NotificationProvider>
  );
}

export default App;
