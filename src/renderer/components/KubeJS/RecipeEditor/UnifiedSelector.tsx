import React, { useState } from 'react';
import { X, Droplet, Tag, Package } from 'lucide-react';
import { ItemSelector } from './ItemSelector';
import { FluidSelector } from '../ItemPicker/FluidSelector';
import { TagSelector } from '../ItemPicker/TagSelector';

export type SelectorType = 'item' | 'fluid' | 'tag' | 'block';

export interface SelectedValue {
  type: SelectorType;
  id: string;
  name: string;
  icon?: string;
  count?: number;
}

interface UnifiedSelectorProps {
  value: SelectedValue | string | null;
  onChange: (value: SelectedValue | string | null) => void;
  type?: SelectorType;
  allowedTypes?: SelectorType[];
  instancePath?: string;
  placeholder?: string;
  showCount?: boolean;
}

export const UnifiedSelector: React.FC<UnifiedSelectorProps> = ({
  value,
  onChange,
  type,
  allowedTypes = ['item', 'fluid', 'tag'],
  instancePath,
  placeholder = 'Select...',
  showCount = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeType, setActiveType] = useState<SelectorType>(type || allowedTypes[0]);

  // Normalize value to SelectedValue object
  const normalizedValue: SelectedValue | null = typeof value === 'string' 
    ? (value ? { type: activeType, id: value, name: value } : null)
    : value;

  const handleSelect = (selected: any) => {
    const newValue: SelectedValue = {
      type: activeType,
      id: selected.id,
      name: selected.name || selected.id,
      icon: selected.texture || selected.icon,
      count: normalizedValue?.count || 1
    };
    onChange(newValue);
    setIsOpen(false);
  };

  const handleCountChange = (count: number) => {
    if (normalizedValue) {
      onChange({ ...normalizedValue, count });
    }
  };

  const getIcon = () => {
    if (!normalizedValue) return null;
    
    switch (normalizedValue.type) {
      case 'item':
      case 'block':
        return normalizedValue.icon ? (
          <img src={normalizedValue.icon} alt={normalizedValue.name} className="w-8 h-8 pixelated" />
        ) : (
          <Package className="w-8 h-8 text-gray-400" />
        );
      case 'fluid':
        return normalizedValue.icon ? (
          <img src={normalizedValue.icon} alt={normalizedValue.name} className="w-8 h-8 pixelated" />
        ) : (
          <div className="w-8 h-8 bg-blue-500/20 rounded flex items-center justify-center">
            <Droplet className="w-5 h-5 text-blue-400" />
          </div>
        );
      case 'tag':
        return (
          <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
            <Tag className="w-5 h-5 text-purple-400" />
          </div>
        );
    }
  };

  return (
    <div className="relative">
      <div className="flex gap-2">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center p-2 bg-secondary hover:bg-secondary/80 border border-border rounded transition-colors w-12 h-12"
          title={normalizedValue ? `${normalizedValue.name}\n${normalizedValue.id}` : placeholder}
        >
          {normalizedValue ? (
            getIcon()
          ) : (
            <span className="text-muted-foreground text-xs">+</span>
          )}
        </button>

        {normalizedValue && (
          <button
            onClick={() => onChange(null)}
            className="p-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded transition-colors"
            title="Clear"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {showCount && normalizedValue && (
          <input
            type="number"
            min="1"
            value={normalizedValue.count || 1}
            onChange={(e) => handleCountChange(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-20 px-3 py-2 bg-secondary border border-border rounded text-foreground text-center focus:outline-none focus:border-primary"
            placeholder="Count"
          />
        )}
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1e1e1e] rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            {/* Type Selector */}
            {allowedTypes.length > 1 && (
              <div className="p-4 border-b border">
                <div className="flex gap-2">
                  {allowedTypes.includes('item') && (
                    <button
                      onClick={() => setActiveType('item')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded transition-colors ${
                        activeType === 'item'
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-foreground'
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      Items
                    </button>
                  )}
                  {allowedTypes.includes('fluid') && (
                    <button
                      onClick={() => setActiveType('fluid')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded transition-colors ${
                        activeType === 'fluid'
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-foreground'
                      }`}
                    >
                      <Droplet className="w-4 h-4" />
                      Fluids
                    </button>
                  )}
                  {allowedTypes.includes('tag') && (
                    <button
                      onClick={() => setActiveType('tag')}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded transition-colors ${
                        activeType === 'tag'
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#2a2a2a] hover:bg-[#3a3a3a] text-foreground'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      Tags
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Selector Content */}
            <div className="flex-1 overflow-hidden">
              {activeType === 'item' && instancePath && (
                <ItemSelector
                  instancePath={instancePath}
                  onSelect={(item) => handleSelect(item)}
                />
              )}
              {activeType === 'fluid' && instancePath && (
                <FluidSelector
                  onSelect={(fluid) => handleSelect(fluid)}
                  onClose={() => setIsOpen(false)}
                />
              )}
              {activeType === 'tag' && (
                <TagSelector
                  onSelect={(tag) => handleSelect(tag)}
                  onClose={() => setIsOpen(false)}
                />
              )}
            </div>

            <div className="p-4 border-t border">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-foreground rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
