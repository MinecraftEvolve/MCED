import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { BackupModal } from "./Backup/BackupModal";
import { Settings } from "./Settings";
import { GameConsole } from "./GameConsole";
import {
  Settings as SettingsIcon,
  Search as SearchIcon,
  FolderOpen,
  X,
  Database,
  BarChart3,
  History,
  ChevronDown,
  Folder,
  FolderX,
  Play,
  Square,
  Loader2,
  Info,
  Terminal,
} from "lucide-react";
import { LauncherIcon } from "./LauncherIcon";

interface HeaderProps {
  onSearchClick: () => void;
  onOpenInstance?: () => void;
  onCloseInstance?: () => void;
  onStatsClick?: () => void;
  onChangelogClick?: () => void;
}

export function Header({
  onSearchClick,
  onOpenInstance,
  onCloseInstance,
  onStatsClick,
  onChangelogClick,
}: HeaderProps) {
  const { currentInstance, launcherType } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [showInstanceMenu, setShowInstanceMenu] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [hasLogs, setHasLogs] = useState(false);

  // Poll running state every 3s while an instance is open
  useEffect(() => {
    if (!currentInstance) {
      setIsRunning(false);
      return;
    }
    let cancelled = false;
    const check = async () => {
      const running = await window.api.isGameRunning(currentInstance.path);
      if (!cancelled) setIsRunning(running);
    };
    check();
    const interval = setInterval(check, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [currentInstance?.path]);

  // Track whether any log output has arrived so we can show the console button
  useEffect(() => {
    if (!currentInstance) return;
    setHasLogs(false);
    window.api.onGameLog((entry) => {
      if (entry.instancePath === currentInstance.path) {
        setHasLogs(true);
      }
    });
    return () => {
      window.api.removeGameLogListener();
    };
  }, [currentInstance?.path]);

  const handleLaunch = async () => {
    if (!currentInstance || isLaunching || isRunning) return;
    setIsLaunching(true);
    setLaunchError(null);
    try {
      const result = await window.api.launchGame(
        currentInstance.path,
        launcherType || 'unknown',
        currentInstance.minecraftVersion,
        currentInstance.loader?.version || ''
      );
      if (result.success) {
        setIsRunning(true);
      } else {
        setLaunchError(result.error || 'Launch failed');
      }
    } finally {
      setIsLaunching(false);
    }
  };

  const handleStop = async () => {
    if (!currentInstance) return;
    await window.api.killGame(currentInstance.path);
    setIsRunning(false);
  };

  // If no instance, show minimal header with just settings button
  if (!currentInstance) {
    return (
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-xl">
        <div className="flex h-16 items-center px-6 gap-4">
          <div className="flex items-center gap-3">
            <img src="./icon.png" alt="Logo" className="w-10 h-10 rounded-lg shadow-lg" />
            <span className="text-base font-bold">Minecraft Config Editor</span>
          </div>
          <div className="flex-1"></div>
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-sm"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </div>
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </header>
    );
  }

  return (
    <header className="border-b border-primary/20 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-xl shadow-lg">
      <div className="flex h-16 px-6 gap-4">
        {/* App Logo & Title */}
        <div className="flex items-center gap-3 group">
          <img src="./icon.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg group-hover:shadow-purple-500/50 transition-all duration-300 group-hover:scale-105" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">
              Minecraft Config Editor
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent self-center"></div>

        {/* Instance Info mit Dropdown */}
        <div className="flex-1 flex items-center gap-2 animate-fadeIn py-2 relative">
          <div className="flex flex-col justify-center flex-1">
            <div className="text-base font-bold text-foreground mb-1">
              {currentInstance.name}
            </div>
            <div className="flex items-center gap-2 text-xs">
              {launcherType && launcherType !== "unknown" && (
                <div
                  className="flex items-center hover:scale-110 transition-transform"
                  title={`Launcher: ${
                    launcherType === "modrinth"
                      ? "Modrinth App"
                      : launcherType === "curseforge"
                        ? "CurseForge"
                        : launcherType === "packwiz"
                          ? "Packwiz"
                          : launcherType === "prism"
                            ? "Prism Launcher"
                            : launcherType === "multimc"
                              ? "MultiMC"
                              : launcherType === "atlauncher"
                                ? "ATLauncher"
                                : "Generic Launcher"
                  }`}
                >
                  <LauncherIcon launcher={launcherType} className="w-4 h-4" />
                </div>
              )}
              <span className="px-2 py-0.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-md font-semibold border border-green-500/20 hover:bg-green-500/20 transition-colors">
                MC {currentInstance.minecraftVersion}
              </span>
              <span className="px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-md font-semibold border border-purple-500/20 hover:bg-purple-500/20 transition-colors">
                {currentInstance.loader.type.charAt(0).toUpperCase() +
                  currentInstance.loader.type.slice(1)}{" "}
                {currentInstance.loader.version}
              </span>
            </div>
          </div>

          {/* Instance Menu Button */}
          <div className="relative">
            <button
              onClick={() => setShowInstanceMenu(!showInstanceMenu)}
              className="p-2 hover:bg-purple-500/20 rounded-xl transition-all border-2 border-transparent hover:border-purple-500/30"
              title="Instance Menu"
            >
              <ChevronDown className={`w-5 h-5 text-purple-400 transition-transform ${showInstanceMenu ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {showInstanceMenu && (
              <>
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setShowInstanceMenu(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-64 bg-card border-2 border-purple-500/30 rounded-xl shadow-2xl z-50 py-2 animate-slideInRight">
                  <button
                    onClick={() => {
                      setShowInstanceMenu(false);
                      onOpenInstance?.();
                    }}
                    className="w-full px-4 py-3 hover:bg-purple-500/10 transition-all flex items-center gap-3 text-left group"
                  >
                    <Folder className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-foreground">Open Instance</div>
                      <div className="text-xs text-muted-foreground">Load a different instance</div>
                    </div>
                  </button>
                  <div className="h-px bg-purple-500/20 my-1 mx-2"></div>
                  <button
                    onClick={() => {
                      setShowInstanceMenu(false);
                      onCloseInstance?.();
                    }}
                    className="w-full px-4 py-3 hover:bg-destructive/10 transition-all flex items-center gap-3 text-left group"
                  >
                    <FolderX className="w-5 h-5 text-destructive group-hover:scale-110 transition-transform" />
                    <div>
                      <div className="font-semibold text-destructive">Close Instance</div>
                      <div className="text-xs text-muted-foreground">Return to main menu</div>
                    </div>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Launch / Stop button group */}
          <div className="flex items-center gap-1">
            {isRunning ? (
              <button
                onClick={handleStop}
                className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all hover:scale-105 flex items-center gap-2 text-sm font-semibold group shadow-lg hover:shadow-red-500/20 border border-red-500/20"
                title="Stop Minecraft"
              >
                <Square className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Running
              </button>
            ) : (
              <button
                onClick={handleLaunch}
                disabled={isLaunching}
                className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 text-sm font-semibold group shadow-lg border ${
                  isLaunching
                    ? 'bg-green-500/5 text-green-500/50 border-green-500/10 cursor-not-allowed'
                    : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 hover:scale-105 hover:shadow-green-500/20 border-green-500/20'
                }`}
                title={launchError ? `Letzter Fehler: ${launchError}` : 'Minecraft starten'}
              >
                {isLaunching ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                )}
                {isLaunching ? 'Starte…' : 'Play'}
              </button>
            )}

            {/* Info icon with launch hint tooltip */}
            <div className="relative group/info">
              <button
                className="p-1.5 text-blue-400/60 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-500/10"
                tabIndex={-1}
                aria-label="Hinweis zur Erstnutzung"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
              <div className="absolute right-0 top-full mt-2 w-80 z-50 pointer-events-none opacity-0 group-hover/info:opacity-100 transition-opacity">
                <div className="bg-card border border-blue-500/30 rounded-xl shadow-2xl p-3 text-xs text-muted-foreground leading-relaxed">
                  <p className="font-semibold text-blue-400 mb-1">Wichtig zu wissen</p>
                  <p>
                    Das erste Mal in MCED spielen erfordert, dass die Instanz <strong className="text-foreground">vorher mindestens einmal im Launcher gestartet</strong> wurde, damit die Version-JARs und Libraries heruntergeladen sind.
                  </p>
                  <p className="mt-1.5 text-muted-foreground/70">
                    Beim Auth-Lesen gibt es einen stillen Offline-Fallback, falls keine Tokens gefunden werden.
                  </p>
                </div>
              </div>
            </div>

            {/* Console button — visible once logs exist or game is running */}
            {(hasLogs || isRunning) && (
              <button
                onClick={() => setShowConsole(true)}
                className="p-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl transition-all hover:scale-105 border border-purple-500/20 shadow-md"
                title="Game Console anzeigen"
              >
                <Terminal className="w-4 h-4" />
              </button>
            )}
          </div>

          <button
            onClick={() => onSearchClick()}
            className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 rounded-xl transition-all hover:scale-105 flex items-center gap-2 text-sm font-semibold group shadow-lg hover:shadow-purple-500/20 border border-purple-500/20"
          >
            <SearchIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Search
            <kbd className="text-xs text-muted-foreground ml-1 px-2 py-0.5 bg-background/50 rounded-md border border-purple-500/30">
              Ctrl+F
            </kbd>
          </button>

          <button
            onClick={() => setShowBackups(true)}
            className="px-3 py-2 bg-secondary hover:bg-purple-500/20 rounded-xl transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-md hover:shadow-purple-500/20 border border-border hover:border-purple-500/30"
            title="Backup Manager"
          >
            <Database className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          {onStatsClick && (
            <button
              onClick={() => onStatsClick()}
              className="px-3 py-2 bg-secondary hover:bg-purple-500/20 rounded-xl transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-md hover:shadow-purple-500/20 border border-border hover:border-purple-500/30"
              title="Statistics"
            >
              <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {onChangelogClick && (
            <button
              onClick={() => onChangelogClick()}
              className="px-3 py-2 bg-secondary hover:bg-purple-500/20 rounded-xl transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-md hover:shadow-purple-500/20 border border-border hover:border-purple-500/30"
              title="Change History"
            >
              <History className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-2 bg-secondary hover:bg-purple-500/20 rounded-xl transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-md hover:shadow-purple-500/20 border border-border hover:border-purple-500/30"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showBackups && <BackupModal onClose={() => setShowBackups(false)} />}
      {showConsole && currentInstance && (
        <GameConsole instancePath={currentInstance.path} onClose={() => setShowConsole(false)} />
      )}
    </header>
  );
}
