import React from 'react';
import { ModInfo } from '@shared/types/mod.types';

interface ModListItemProps {
  mod: ModInfo;
  isSelected: boolean;
  onClick: () => void;
}

export function ModListItem({ mod, isSelected, onClick }: ModListItemProps) {
  return (
    <div
      onClick={onClick}
      className={`
        p-3 cursor-pointer border-b border-border transition-colors
        ${isSelected ? 'bg-accent' : 'hover:bg-accent/50'}
      `}
    >
      <div className="flex items-center gap-3">
        {mod.icon ? (
          <img
            src={mod.icon}
            alt={mod.name}
            className="w-12 h-12 rounded"
          />
        ) : (
          <div className="w-12 h-12 rounded bg-secondary flex items-center justify-center text-muted-foreground text-xs font-bold">
            {mod.name.substring(0, 2).toUpperCase()}
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{mod.name}</h3>
          <p className="text-xs text-muted-foreground truncate">v{mod.version}</p>
        </div>
      </div>
    </div>
  );
}
