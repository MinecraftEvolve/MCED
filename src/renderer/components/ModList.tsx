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
    setViewMode("mods");
    setSelectedMod(mod);

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
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
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

      <div className="space-y-3 border-t border-primary/20 bg-card/30 p-4 backdrop-blur-sm">
        {kubeJSDetected && (
          <button
            onClick={handleKubeJSClick}
            className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold shadow-md transition-all duration-200 ${
              viewMode === "kubejs"
                ? "scale-[1.01] bg-gradient-to-r from-purple-600 to-purple-700 text-white shadow-purple-500/30"
                : "border-2 border-purple-500/20 bg-purple-600/10 text-purple-400 hover:border-purple-500/40 hover:bg-purple-600/20 hover:scale-[1.01]"
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
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 px-4 py-3 text-sm font-semibold text-primary transition-all duration-200 hover:bg-primary/20 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-50"
          title="Move all server configs to defaultconfigs folder"
        >
          <FolderSync size={16} />
          {isMigrating ? "Migrating..." : "Migrate All Configs"}
        </button>

        <div className="pt-1 text-center text-xs font-medium text-muted-foreground">
          {filteredMods.length} of {mods.length} mods
        </div>
      </div>
    </>
  );
}
