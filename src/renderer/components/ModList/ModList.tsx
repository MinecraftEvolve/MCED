import React, { useMemo } from "react";
import { useAppStore } from "@/store";
import { useSettingsStore } from "@/store/settingsStore";
import { ModSearch } from "./ModSearch";
import { ModListItem } from "./ModListItem";

export function ModList() {
  const { mods, searchQuery, selectedMod, setSelectedMod } = useAppStore();
  const { settings } = useSettingsStore();

  const filteredMods = useMemo(() => {
    let filtered = mods;

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = mods.filter(
        (mod) =>
          mod.name.toLowerCase().includes(query) ||
          mod.modId.toLowerCase().includes(query) ||
          mod.description?.toLowerCase().includes(query),
      );
    }

    // Sort mods without configs to the end if enabled
    if (settings.modsWithoutConfigsAtEnd) {
      filtered = [...filtered].sort((a, b) => {
        const aHasConfig = a.configFiles && a.configFiles.length > 0;
        const bHasConfig = b.configFiles && b.configFiles.length > 0;

        // First, separate by config availability
        if (aHasConfig && !bHasConfig) return -1;
        if (!aHasConfig && bHasConfig) return 1;

        // Then sort alphabetically within each group
        return a.name.localeCompare(b.name);
      });
    } else {
      // Just sort alphabetically when setting is off
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
              onClick={() => setSelectedMod(mod)}
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
