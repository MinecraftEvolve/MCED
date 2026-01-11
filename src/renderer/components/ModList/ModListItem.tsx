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
        p-3 cursor-pointer transition-all duration-200 group
        ${isSelected 
          ? 'bg-primary/20 border-l-2 border-primary shadow-sm' 
          : 'hover:bg-accent/30 border-l-2 border-transparent hover:border-primary/50'
        }
      `}
    >
      <div className="flex items-center gap-3">
        {mod.icon ? (
          <img
            src={mod.icon}
            alt={mod.name}
            className="w-10 h-10 rounded-lg shadow-md group-hover:scale-110 transition-transform"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center text-primary text-sm font-bold shadow-md group-hover:scale-110 transition-transform ${mod.icon ? 'hidden' : ''}`}>
          {mod.name.substring(0, 2).toUpperCase()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold truncate text-sm group-hover:text-primary transition-colors">
            {mod.name}
          </h3>
          <p className="text-xs text-muted-foreground truncate">
            v{mod.version}
          </p>
        </div>

        {isSelected && (
          <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
        )}
      </div>
    </div>
  );
}
