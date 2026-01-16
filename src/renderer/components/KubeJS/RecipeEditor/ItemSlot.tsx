import React from 'react';
import { Package, Plus, X } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  modId: string;
  texture?: string;
  count?: number;
  chance?: number;
}

interface ItemSlotProps {
  item: Item | string | null;
  size?: 'small' | 'normal' | 'large' | 'md' | 'lg';
  onClick?: () => void;
  onClear?: () => void;
  showCount?: boolean;
  showChance?: boolean;
  count?: number;
  onCountChange?: (count: number) => void;
  allowCount?: boolean;
}

export const ItemSlot: React.FC<ItemSlotProps> = ({
  item,
  size = 'normal',
  onClick,
  onClear,
  showCount = true,
  showChance = false,
  count,
  onCountChange,
  allowCount = false
}) => {
  // Normalize item to always be an Item object or null
  const normalizedItem: Item | null = item 
    ? (typeof item === 'string' 
        ? { id: item, name: item, modId: '' } 
        : item)
    : null;

  const displayCount = count || normalizedItem?.count;
  const sizeClasses = {
    small: 'w-12 h-12',
    normal: 'w-16 h-16',
    large: 'w-24 h-24',
    md: 'w-16 h-16',
    lg: 'w-24 h-24'
  }[size];

  const iconSize = {
    small: 'w-6 h-6',
    normal: 'w-8 h-8',
    large: 'w-12 h-12',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  }[size];

  const plusSize = {
    small: 'w-4 h-4',
    normal: 'w-6 h-6',
    large: 'w-8 h-8',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }[size];

  const clearSize = {
    small: 'w-4 h-4',
    normal: 'w-5 h-5',
    large: 'w-6 h-6',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  }[size];

  const padding = {
    small: 'p-1.5',
    normal: 'p-2',
    large: 'p-3',
    md: 'p-2',
    lg: 'p-3'
  }[size];

  return (
    <div 
      className={`relative ${sizeClasses} bg-secondary border-2 border-border rounded ${onClick ? 'cursor-pointer hover:border-primary' : ''} transition-colors group`}
      onClick={onClick}
    >
      {normalizedItem ? (
        <>
          <div className={`absolute inset-0 flex items-center justify-center ${padding}`}>
            {normalizedItem.texture ? (
              <img
                src={normalizedItem.texture.startsWith('data:') ? normalizedItem.texture : `data:image/png;base64,${normalizedItem.texture}`}
                alt={normalizedItem.name}
                className="w-full h-full object-contain pixelated"
              />
            ) : (
              <Package className={`${iconSize} text-muted-foreground`} />
            )}
          </div>
          
          {onClear && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClear();
              }}
              className={`absolute -top-2 -right-2 ${clearSize} bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center`}
            >
              <X className={size === 'small' ? 'w-2.5 h-2.5' : size === 'large' ? 'w-4 h-4' : 'w-3 h-3'} />
            </button>
          )}

          {/* Count Badge */}
          {showCount && displayCount && displayCount > 1 && (
            <div className="absolute bottom-1 right-1 bg-background text-foreground text-xs font-bold px-1.5 py-0.5 rounded shadow-lg border border-border">
              {displayCount}
            </div>
          )}

          {/* Count Input */}
          {allowCount && onCountChange && (
            <input
              type="number"
              min="1"
              value={displayCount || 1}
              onChange={(e) => onCountChange(Math.max(1, parseInt(e.target.value) || 1))}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-1 right-1 w-10 h-6 bg-background text-foreground text-xs font-bold px-1 rounded shadow-lg border border-border text-center"
            />
          )}

          {/* Chance Badge */}
          {showChance && normalizedItem.chance !== undefined && normalizedItem.chance < 1 && (
            <div className="absolute top-1 right-1 bg-yellow-500/90 text-yellow-950 text-xs font-bold px-1.5 py-0.5 rounded shadow-lg">
              {Math.round(normalizedItem.chance * 100)}%
            </div>
          )}

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
            <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-border">
              <div className="font-medium">{normalizedItem.name}</div>
              <div className="text-muted-foreground">{normalizedItem.id}</div>
              {displayCount && displayCount > 1 && <div className="text-muted-foreground">Count: {displayCount}</div>}
              {normalizedItem.chance !== undefined && normalizedItem.chance < 1 && <div className="text-yellow-400">Chance: {Math.round(normalizedItem.chance * 100)}%</div>}
            </div>
          </div>
        </>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <Plus className={`${plusSize} text-muted-foreground/30 group-hover:text-primary/50 transition-colors`} />
        </div>
      )}
    </div>
  );
};
