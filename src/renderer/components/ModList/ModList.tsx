import React, { useMemo } from 'react';
import { useAppStore } from '@/store';
import { ModSearch } from './ModSearch';
import { ModListItem } from './ModListItem';

export function ModList() {
  const { mods, searchQuery, selectedMod, setSelectedMod } = useAppStore();

  const filteredMods = useMemo(() => {
    if (!searchQuery) return mods;
    
    const query = searchQuery.toLowerCase();
    return mods.filter(mod =>
      mod.name.toLowerCase().includes(query) ||
      mod.modId.toLowerCase().includes(query) ||
      mod.description?.toLowerCase().includes(query)
    );
  }, [mods, searchQuery]);

  return (
    <>
      <ModSearch />
      
      <div className="flex-1 overflow-y-auto">
        {filteredMods.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">
            {searchQuery ? 'No mods found' : 'No mods loaded'}
          </div>
        ) : (
          filteredMods.map(mod => (
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
