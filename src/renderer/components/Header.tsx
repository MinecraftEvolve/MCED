import React, { useState, useEffect } from "react";
import { notifySuccess, notifyError } from "../utils/notify";
import { useAppStore } from "@/store";
import { useSettingsStore } from "@/store/settingsStore";
import { BackupModal } from "./Backup/BackupModal";
import { Settings } from "./Settings";
import { GameConsole } from "./GameConsole";
import {
  Settings as SettingsIcon,
  Search as SearchIcon,
  FolderOpen,
  X,
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
  Server,
} from "lucide-react";
import { useRemoteConnectionStore } from "@/store/remoteConnectionStore";
import { CrashAnalyzer } from "./CrashAnalyzer";
import { StartupLog } from "./StartupLog";
import { InstanceDiff } from "./InstanceDiff";
import { DependencyGraph } from "./DependencyGraph";
import { ConfigTemplates } from "./ConfigTemplates";
import { BulkConfigReplace } from "./BulkConfigReplace";
import { ConfigReset } from "./ConfigReset";
import { JvmOptimizer } from "./JvmOptimizer";
import { ConfigSync } from "./ConfigSync";
import { ModNotes } from "./ModNotes";
import { ChangelogFeed } from "./ChangelogFeed";
import { ModInstaller } from "./ModInstaller";
import { PerformanceQuickApply } from "./PerformanceQuickApply";
import { LocalRemoteDiff } from "./LocalRemoteDiff";
import { LauncherIcon } from "./LauncherIcon";
import { ToolsMenu } from "./ToolsMenu";
import { ModUpdateChecker } from "./ModUpdateChecker";
import { ConfigValidator } from "./ConfigValidator";

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
  const { currentInstance, launcherType, viewMode, setViewMode } = useAppStore();
  const { settings: appSettings } = useSettingsStore();
  const { connectionStatus } = useRemoteConnectionStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [showInstanceMenu, setShowInstanceMenu] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [showConsole, setShowConsole] = useState(false);
  const [hasLogs, setHasLogs] = useState(false);
  const [showCrashAnalyzer, setShowCrashAnalyzer] = useState(false);
  const [showStartupLog, setShowStartupLog] = useState(false);
  const [showInstanceDiff, setShowInstanceDiff] = useState(false);
  const [showDependencyGraph, setShowDependencyGraph] = useState(false);
  const [showConfigTemplates, setShowConfigTemplates] = useState(false);
  const [showBulkReplace, setShowBulkReplace] = useState(false);
  const [showConfigReset, setShowConfigReset] = useState(false);
  const [showJvmOptimizer, setShowJvmOptimizer] = useState(false);
  const [showConfigSync, setShowConfigSync] = useState(false);
  const [showModNotes, setShowModNotes] = useState(false);
  const [showChangelogFeed, setShowChangelogFeed] = useState(false);
  const [showModInstaller, setShowModInstaller] = useState(false);
  const [showPerfQuickApply, setShowPerfQuickApply] = useState(false);
  const [showLocalRemoteDiff, setShowLocalRemoteDiff] = useState(false);
  const [showModUpdateChecker, setShowModUpdateChecker] = useState(false);
  const [showConfigValidator, setShowConfigValidator] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

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

  useEffect(() => {
    if (!currentInstance) return;
    setHasLogs(false);
    const unsubscribe = window.api.onGameLog((entry) => {
      if (entry.instancePath === currentInstance.path) {
        setHasLogs(true);
      }
    });
    return () => unsubscribe();
  }, [currentInstance?.path]);

  const handleLaunch = async () => {
    if (!currentInstance || isLaunching || isRunning) return;
    setIsLaunching(true);
    setLaunchError(null);
    try {
      const result = await window.api.launchGame(
        currentInstance.path,
        launcherType || "unknown",
        currentInstance.minecraftVersion,
        currentInstance.loader?.version || "",
        appSettings.jvmMaxMemory ?? 4096,
        appSettings.jvmMinMemory ?? 1024
      );
      if (result.success) {
        setIsRunning(true);
      } else {
        setLaunchError(result.error || "Launch failed");
      }
    } finally {
      setIsLaunching(false);
    }
  };

  const handleStop = async () => {
    if (!currentInstance) return;
    await window.api.killGame(currentInstance.path);
  };

  const handleExportModpack = async () => {
    if (!currentInstance || isExporting) return;
    const packName = prompt("Modpack name:", currentInstance.name || "My Modpack");
    if (!packName) return;
    setIsExporting(true);
    try {
      const result = await window.api.exportModpack(
        currentInstance.path,
        packName,
        currentInstance.minecraftVersion,
        currentInstance.loader?.type || "forge",
        currentInstance.loader?.version || ""
      );
      if (result.success) {
        notifySuccess("Exported", `Exported to: ${result.outputPath}`);
      } else {
        notifyError("Export Failed", result.error || "Unknown error");
      }
    } finally {
      setIsExporting(false);
    }
  };

  if (!currentInstance) {
    return (
      <header className="border-b border-primary/20 bg-card/50 backdrop-blur-xl relative z-10">
        <div className="flex h-16 items-center px-6 gap-4">
          <div className="flex items-center gap-3">
            <img src="./icon.png" alt="Logo" className="w-10 h-10 rounded-lg shadow-lg" />
            <span className="text-base font-bold">Minecraft Config Editor</span>
          </div>
          <div className="flex-1"></div>
          <button
            onClick={() => setShowSettings(true)}
            className="mc-button-icon"
            title="Settings"
          >
            <SettingsIcon className="h-4 w-4" />
          </button>
        </div>
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </header>
    );
  }

  return (
    <header className="border-b border-primary/20 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-xl shadow-lg relative z-10">
      <div className="flex h-16 px-6 gap-4">
        <div className="flex items-center gap-3 group">
          <img src="./icon.png" alt="Logo" className="w-10 h-10 rounded-xl shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-purple-500/50" />
          <div className="flex flex-col">
            <span className="text-xs font-medium text-muted-foreground">Minecraft Config Editor</span>
          </div>
        </div>

        <div className="h-8 w-px bg-gradient-to-b from-transparent via-primary/40 to-transparent self-center" />

        <div className="relative flex flex-1 items-center gap-2 py-2 animate-fadeIn">
          <div className="flex flex-col justify-center flex-1">
            <div className="mb-1 text-base font-bold text-foreground">{currentInstance.name}</div>
            <div className="flex items-center gap-2 text-xs">
              {launcherType && launcherType !== "unknown" && (
                <div
                  className="flex items-center transition-transform hover:scale-110"
                  title={`Launcher: ${(launcherType as string) === "modrinth"
                    ? "Modrinth App"
                    : (launcherType as string) === "curseforge"
                      ? "CurseForge"
                      : (launcherType as string) === "packwiz"
                        ? "Packwiz"
                        : (launcherType as string) === "prism"
                          ? "Prism Launcher"
                          : (launcherType as string) === "multimc"
                            ? "MultiMC"
                            : (launcherType as string) === "atlauncher"
                              ? "ATLauncher"
                              : "Generic Launcher"}`}
                >
                  <LauncherIcon launcher={launcherType} className="w-4 h-4" />
                </div>
              )}
              <span className="mc-chip border-green-500/20 bg-green-500/10 text-green-400">
                MC {currentInstance.minecraftVersion}
              </span>
              <span className="mc-chip border-purple-500/20 bg-purple-500/10 text-purple-300">
                {currentInstance.loader.type.charAt(0).toUpperCase() +
                  currentInstance.loader.type.slice(1)} {currentInstance.loader.version}
              </span>
            </div>
          </div>

          <div className="relative">
            <button
              onClick={() => setShowInstanceMenu(!showInstanceMenu)}
              className="mc-button-icon"
              title="Instance Menu"
            >
              <ChevronDown className={`h-5 w-5 transition-transform ${showInstanceMenu ? "rotate-180" : ""}`} />
            </button>

            {showInstanceMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowInstanceMenu(false)} />
                <div className="absolute top-full right-0 z-50 mt-2 w-64 rounded-xl border-2 border-purple-500/30 bg-card py-2 shadow-2xl animate-slideInRight">
                  <button
                    onClick={() => {
                      setShowInstanceMenu(false);
                      onOpenInstance?.();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-purple-500/10"
                  >
                    <Folder className="h-5 w-5 text-purple-400 transition-transform group-hover:scale-110" />
                    <div>
                      <div className="font-semibold text-foreground">Open Instance</div>
                      <div className="text-xs text-muted-foreground">Load a different instance</div>
                    </div>
                  </button>
                  <div className="mx-2 my-1 h-px bg-purple-500/20" />
                  <button
                    onClick={() => {
                      setShowInstanceMenu(false);
                      onCloseInstance?.();
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition-all hover:bg-destructive/10"
                  >
                    <FolderX className="h-5 w-5 text-destructive transition-transform group-hover:scale-110" />
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

        <div className="flex items-center gap-2">
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex items-center gap-1">
              {isRunning ? (
                <button
                  onClick={handleStop}
                  className="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 shadow-lg transition-all hover:scale-[1.02] hover:bg-red-500/20 hover:shadow-red-500/20"
                  title="Stop Minecraft"
                >
                  <span className="flex items-center gap-2">
                    <Square className="h-4 w-4" />
                    Running
                  </span>
                </button>
              ) : (
                <button
                  onClick={handleLaunch}
                  disabled={isLaunching}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold shadow-lg transition-all ${
                    launchError
                      ? "border-red-500/30 bg-red-500/10 text-red-400"
                      : isLaunching
                        ? "cursor-not-allowed border-green-500/10 bg-green-500/5 text-green-500/50"
                        : "border-green-500/20 bg-green-500/10 text-green-400 hover:scale-[1.02] hover:bg-green-500/20 hover:shadow-green-500/20"
                  }`}
                  title="Launch Minecraft"
                >
                  <span className="flex items-center gap-2">
                    {isLaunching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                    {isLaunching ? "Launching…" : "Play"}
                  </span>
                </button>
              )}

              <div className="relative group/info">
                <button
                  className="rounded-lg p-1.5 text-blue-400/60 transition-colors hover:bg-blue-500/10 hover:text-blue-400"
                  tabIndex={-1}
                  aria-label="First-time launch info"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
                <div className="pointer-events-none absolute right-0 top-full mt-2 z-50 w-80 opacity-0 transition-opacity group-hover/info:opacity-100">
                  <div className="rounded-xl border border-blue-500/30 bg-card p-3 text-xs leading-relaxed text-muted-foreground shadow-2xl">
                    <p className="mb-1 font-semibold text-blue-400">Good to know</p>
                    <p>
                      To play through MCED for the first time, the instance must have been <strong className="text-foreground">launched at least once via your launcher</strong> so that the version files are present.
                    </p>
                    <p className="mt-1.5 text-muted-foreground/70">
                      If no auth tokens are found, MCED silently falls back to offline mode.
                    </p>
                  </div>
                </div>
              </div>

              {(hasLogs || isRunning) && (
                <button
                  onClick={() => setShowConsole(true)}
                  className="rounded-xl border border-purple-500/20 bg-purple-500/10 p-2 text-purple-400 transition-all hover:scale-[1.02] hover:bg-purple-500/20"
                  title="Open Game Console"
                >
                  <Terminal className="h-4 w-4" />
                </button>
              )}
            </div>
            {launchError && (
              <span className="max-w-[200px] truncate text-xs text-red-400/90" title={launchError}>
                ⚠ {launchError}
              </span>
            )}
          </div>

          <button
            onClick={() => onSearchClick()}
            className="mc-button-primary"
          >
            <SearchIcon className="h-4 w-4" />
            Search
            <kbd className="rounded-md border border-purple-500/30 bg-background/50 px-2 py-0.5 text-[10px] text-muted-foreground">
              Ctrl+F
            </kbd>
          </button>

          <div className="h-6 w-px bg-primary/20 self-center mx-1" />

          {/* Permanent utility buttons */}
          <div className="flex items-center gap-0.5 bg-secondary/60 rounded-xl p-1 border border-border/50">
            {onStatsClick && (
              <button onClick={() => onStatsClick()} className="mc-button-ghost h-8 w-8 p-0" title="Statistics">
                <BarChart3 className="h-4 w-4" />
              </button>
            )}
            {onChangelogClick && (
              <button onClick={() => onChangelogClick()} className="mc-button-ghost h-8 w-8 p-0" title="Change History">
                <History className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={() => setViewMode(viewMode === "remote" ? "mods" : "remote")}
              className={`relative h-8 w-8 rounded-lg transition-all hover:scale-[1.03] ${
                viewMode === "remote" ? "bg-green-500/15 text-green-400" : "text-muted-foreground hover:bg-primary/10 hover:text-foreground"
              }`}
              title="Remote Config (MCED-Remote)"
            >
              <Server className="h-4 w-4 mx-auto" />
              {connectionStatus === "connected" && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-green-400 shadow-[0_0_4px_1px_rgba(74,222,128,0.5)]" />
              )}
            </button>
            <button onClick={() => setShowSettings(true)} className="mc-button-ghost h-8 w-8 p-0" title="Settings">
              <SettingsIcon className="h-4 w-4" />
            </button>
          </div>

          {/* Tools dropdown */}
          <ToolsMenu
            hasInstance={!!currentInstance}
            onTool={(id) => {
              switch (id) {
                case "configTemplates": setShowConfigTemplates(true); break;
                case "bulkReplace": setShowBulkReplace(true); break;
                case "configReset": setShowConfigReset(true); break;
                case "configValidator": setShowConfigValidator(true); break;
                case "configSync": setShowConfigSync(true); break;
                case "localRemoteDiff": setShowLocalRemoteDiff(true); break;
                case "jvmOptimizer": setShowJvmOptimizer(true); break;
                case "modNotes": setShowModNotes(true); break;
                case "perfQuickApply": setShowPerfQuickApply(true); break;
                case "crashAnalyzer": setShowCrashAnalyzer(true); break;
                case "startupLog": setShowStartupLog(true); break;
                case "instanceDiff": setShowInstanceDiff(true); break;
                case "dependencyGraph": setShowDependencyGraph(true); break;
                case "backups": setShowBackups(true); break;
                case "modInstaller": setShowModInstaller(true); break;
                case "changelogFeed": setShowChangelogFeed(true); break;
                case "modUpdateChecker": setShowModUpdateChecker(true); break;
                case "exportModpack": handleExportModpack(); break;
              }
            }}
          />
        </div>
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showBackups && <BackupModal onClose={() => setShowBackups(false)} />}
      {showConsole && currentInstance && (
        <GameConsole instancePath={currentInstance.path} onClose={() => setShowConsole(false)} />
      )}
      {showCrashAnalyzer && <CrashAnalyzer onClose={() => setShowCrashAnalyzer(false)} />}
      {showStartupLog && <StartupLog onClose={() => setShowStartupLog(false)} />}
      {showInstanceDiff && <InstanceDiff onClose={() => setShowInstanceDiff(false)} />}
      {showDependencyGraph && <DependencyGraph onClose={() => setShowDependencyGraph(false)} />}
      {showConfigTemplates && <ConfigTemplates onClose={() => setShowConfigTemplates(false)} />}
      {showBulkReplace && <BulkConfigReplace onClose={() => setShowBulkReplace(false)} />}
      {showConfigReset && <ConfigReset onClose={() => setShowConfigReset(false)} />}
      {showJvmOptimizer && <JvmOptimizer onClose={() => setShowJvmOptimizer(false)} />}
      {showConfigSync && <ConfigSync onClose={() => setShowConfigSync(false)} />}
      {showModNotes && <ModNotes onClose={() => setShowModNotes(false)} />}
      {showChangelogFeed && <ChangelogFeed onClose={() => setShowChangelogFeed(false)} />}
      {showModInstaller && <ModInstaller onClose={() => setShowModInstaller(false)} />}
      {showPerfQuickApply && <PerformanceQuickApply onClose={() => setShowPerfQuickApply(false)} />}
      {showLocalRemoteDiff && <LocalRemoteDiff onClose={() => setShowLocalRemoteDiff(false)} />}
      {showModUpdateChecker && <ModUpdateChecker onClose={() => setShowModUpdateChecker(false)} />}
      {showConfigValidator && <ConfigValidator onClose={() => setShowConfigValidator(false)} />}
    </header>
  );
}
