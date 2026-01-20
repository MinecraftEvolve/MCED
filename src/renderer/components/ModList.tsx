import React, { useMemo, useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { useSettingsStore } from "@/store/settingsStore";
import { ModSearch } from "./ModSearch";
import { ModListItem } from "./ModListItem";
import { ModInfo } from "../../shared/types/mod.types";
import { FolderSync, FileCode } from "lucide-react";

export function ModList() {
  const {
    mods,
    searchQuery,
    selectedMod,
    setSelectedMod,
    currentInstance,
    reloadMods,
    viewMode,
    setViewMode,
    kubeJSDetected,
    setKubeJSDetected,
  } = useAppStore();
  const { settings } = useSettingsStore();
  const [isMigrating, setIsMigrating] = useState(false);

  // Detect KubeJS on instance load
  useEffect(() => {
    const detectKubeJS = async () => {
      if (!currentInstance) return;

      try {
        const result = await window.api.kubeJSDetect(currentInstance.path);
        if (result.success && result.data) {
          setKubeJSDetected(result.data.isInstalled);
        }
      } catch (error) {
        setKubeJSDetected(false);
      }
    };

    detectKubeJS();
  }, [currentInstance, setKubeJSDetected]);

  const handleModSelect = (mod: ModInfo) => {
    setViewMode("mods"); // Switch to mods view when selecting a mod
    setSelectedMod(mod);

    // Update Discord RPC with selected mod
    if (settings.discordRpcEnabled) {
      window.api.discordSetMod(mod.name, mods.length);
    }
  };

  const handleKubeJSClick = () => {
    setViewMode("kubejs");
    setSelectedMod(null);
  };

  const handleMigrateAll = async () => {
    if (!currentInstance) return;

    setIsMigrating(true);
    try {
      const result = await window.api.migrateAllServerConfigs(currentInstance.path);
      if (result.success) {
        // Reload mods to reflect changes without leaving the page
        await reloadMods();
      } else {
        console.error("Migration failed:", result.error);
      }
    } catch (error) {
      console.error("Migration error:", error);
    } finally {
      setIsMigrating(false);
    }
  };

  const filteredMods = useMemo(() => {
    let filtered = mods;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = mods.filter(
        (mod) =>
          mod.name.toLowerCase().includes(query) ||
          mod.modId.toLowerCase().includes(query) ||
          mod.description?.toLowerCase().includes(query)
      );
    }

    if (settings.modsWithoutConfigsAtEnd) {
      filtered = [...filtered].sort((a, b) => {
        const aHasConfig = a.configFiles && a.configFiles.length > 0;
        const bHasConfig = b.configFiles && b.configFiles.length > 0;

        if (aHasConfig && !bHasConfig) return -1;
        if (!aHasConfig && bHasConfig) return 1;

        return a.name.localeCompare(b.name);
      });
    } else {
      filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
    }

    return filtered;
  }, [mods, searchQuery, settings.modsWithoutConfigsAtEnd]);

  return (
    <>
      <ModSearch />

      <div className="flex-1 overflow-y-auto outline-none">
        {filteredMods.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {searchQuery ? "No mods found" : "No mods loaded"}
          </div>
        ) : (
          filteredMods.map((mod) => (
            <ModListItem
              key={mod.modId}
              mod={mod}
              isSelected={selectedMod?.modId === mod.modId}
              onClick={() => handleModSelect(mod)}
            />
          ))
        )}
      </div>

      <div className="p-4 border-t border-primary/20 bg-card/30 backdrop-blur-sm space-y-3">
        {kubeJSDetected && (
          <button
            onClick={handleKubeJSClick}
            className={`w-full px-4 py-3 text-sm font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md ${
              viewMode === "kubejs"
                ? "bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white shadow-purple-500/30 scale-105"
                : "bg-purple-600/10 hover:bg-purple-600/20 text-purple-400 border-2 border-purple-500/20 hover:border-purple-500/40 hover:scale-105"
            }`}
            title="Open KubeJS Editor"
          >
            <FileCode size={16} />
            KubeJS Editor
          </button>
        )}
        <button
          onClick={handleMigrateAll}
          disabled={isMigrating || !currentInstance}
          className="w-full px-4 py-3 text-sm font-semibold rounded-xl bg-primary/10 hover:bg-primary/20 text-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 border-2 border-primary/20 hover:border-primary/40 hover:scale-105 shadow-md hover:shadow-primary/20"
          title="Move all server configs to defaultconfigs folder"
        >
          <FolderSync size={16} />
          {isMigrating ? "Migrating..." : "Migrate All Configs"}
        </button>
        <div className="text-xs text-muted-foreground text-center font-medium pt-1">
          {filteredMods.length} of {mods.length} mods
        </div>
      </div>
    </>
  );
}
