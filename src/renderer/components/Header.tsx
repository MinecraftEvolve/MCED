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

  // If no instance, show minimal header with just settings button
  if (!currentInstance) {
    return (
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="flex h-16 items-center px-6 gap-4">
          <div className="flex items-center gap-3">
            <img
              src="./icon.png"
              alt="Logo"
              className="w-10 h-10 rounded-lg shadow-lg"
            />
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
    <header className="border-b border-border bg-card/50 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 gap-4">
        {/* App Logo & Title */}
        <div className="flex items-center gap-3">
          <img
            src="./icon.png"
            alt="Logo"
            className="w-10 h-10 rounded-lg shadow-lg"
          />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">
              Minecraft Config Editor
            </span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border"></div>

        {/* Instance Info */}
        <div className="flex-1 flex flex-col">
          <h1 className="text-base font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            {currentInstance.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {launcherType && launcherType !== 'unknown' && (
              <div 
                className="flex items-center"
                title={`Launcher: ${
                  launcherType === 'modrinth' ? 'Modrinth App' : 
                  launcherType === 'curseforge' ? 'CurseForge' : 
                  launcherType === 'packwiz' ? 'Packwiz' :
                  launcherType === 'prism' ? 'Prism Launcher' : 
                  launcherType === 'multimc' ? 'MultiMC' : 
                  launcherType === 'atlauncher' ? 'ATLauncher' : 
                  'Generic Launcher'
                }`}
              >
                <LauncherIcon launcher={launcherType} className="w-5 h-5" />
              </div>
            )}
            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded font-medium">
              MC {currentInstance.minecraftVersion}
            </span>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded font-medium">
              {currentInstance.loader.type.charAt(0).toUpperCase() +
                currentInstance.loader.type.slice(1)}{" "}
              {currentInstance.loader.version}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onSearchClick()}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-sm"
          >
            <SearchIcon className="w-4 h-4 group-hover:scale-110 transition-transform" />
            Search
            <kbd className="text-xs text-muted-foreground ml-1 px-1.5 py-0.5 bg-background rounded border border-border">
              Ctrl+F
            </kbd>
          </button>

          <button
            onClick={() => setShowBackups(true)}
            className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-sm"
            title="Backup Manager"
          >
            <Database className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>

          {onStatsClick && (
            <button
              onClick={() => onStatsClick()}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-sm"
              title="Statistics"
            >
              <BarChart3 className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {onChangelogClick && (
            <button
              onClick={() => onChangelogClick()}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-sm"
              title="Change History"
            >
              <History className="w-4 h-4 group-hover:scale-110 transition-transform" />
            </button>
          )}

          {onOpenInstance && (
            <button
              onClick={() => onOpenInstance()}
              className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-sm"
              title="Open Another Instance"
            >
              <FolderOpen className="w-4 h-4" />
            </button>
          )}

          {onCloseInstance && (
            <button
              onClick={() => onCloseInstance()}
              className="px-3 py-2 bg-destructive/10 hover:bg-destructive/20 text-destructive rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-sm"
              title="Close Instance"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-sm"
            title="Settings"
          >
            <SettingsIcon className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" />
          </button>
        </div>
      </div>

      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      {showBackups && <BackupModal onClose={() => setShowBackups(false)} />}
    </header>
  );
}
