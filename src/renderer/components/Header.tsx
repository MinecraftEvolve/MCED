import React, { useState } from "react";
import { useAppStore } from "@/store";
import { BackupModal } from "./Backup/BackupModal";
import { Settings } from "./Settings";
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
  Server,
} from "lucide-react";
import { LauncherIcon } from "./LauncherIcon";
import { useRemoteConnectionStore } from "../store/remoteConnectionStore";

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
  const { connectionStatus } = useRemoteConnectionStore();
  const [showSettings, setShowSettings] = useState(false);
  const [showBackups, setShowBackups] = useState(false);
  const [showInstanceMenu, setShowInstanceMenu] = useState(false);

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
            onClick={() => setViewMode(viewMode === "remote" ? "mods" : "remote")}
            className={`px-3 py-2 rounded-xl transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-md border ${
              viewMode === "remote"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40"
                : "bg-secondary hover:bg-purple-500/20 border-border hover:border-purple-500/30"
            }`}
            title="Remote Config (MCED-Remote)"
          >
            <Server className="w-4 h-4 group-hover:scale-110 transition-transform" />
            {connectionStatus === "connected" && (
              <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.4)]" />
            )}
          </button>

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
    </header>
  );
}
