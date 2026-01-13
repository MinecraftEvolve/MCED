import React, { useMemo } from "react";
import { useAppStore } from "@/store";
import { useSettingsStore } from "@/store/settingsStore";
import { ModSearch } from "./ModSearch";
import { ModListItem } from "./ModListItem";
import { ModInfo } from "../../shared/types/mod.types";

export function ModList() {
  const { mods, searchQuery, selectedMod, setSelectedMod } = useAppStore();
  const { settings } = useSettingsStore();

  const handleModSelect = (mod: ModInfo) => {
    setSelectedMod(mod);
    
    // Update Discord RPC with selected mod
    if (settings.discordRpcEnabled) {
      window.api.discordSetMod(mod.name, mods.length);
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
          mod.description?.toLowerCase().includes(query),
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

      <div className="flex-1 overflow-y-auto">
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

      <div className="p-3 border-t border-border text-xs text-muted-foreground">
        {filteredMods.length} of {mods.length} mods
      </div>
    </>
  );
}
