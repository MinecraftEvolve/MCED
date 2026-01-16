import React, { useState, useMemo } from 'react';
import { Search, Tag as TagIcon } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
  category: string;
}

interface TagSelectorProps {
  onSelect: (tag: Tag) => void;
  onClose: () => void;
  type?: 'item' | 'block' | 'fluid';
}

const COMMON_TAGS: Tag[] = [
  // Minecraft Item Tags
  { id: 'minecraft:planks', name: 'Planks', category: 'Item' },
  { id: 'minecraft:logs', name: 'Logs', category: 'Item' },
  { id: 'minecraft:stone_crafting_materials', name: 'Stone Crafting Materials', category: 'Item' },
  { id: 'minecraft:wool', name: 'Wool', category: 'Item' },
  { id: 'minecraft:sand', name: 'Sand', category: 'Item' },
  { id: 'minecraft:coals', name: 'Coals', category: 'Item' },
  { id: 'forge:ingots', name: 'All Ingots', category: 'Item' },
  { id: 'forge:ingots/iron', name: 'Iron Ingots', category: 'Item' },
  { id: 'forge:ingots/gold', name: 'Gold Ingots', category: 'Item' },
  { id: 'forge:ingots/copper', name: 'Copper Ingots', category: 'Item' },
  { id: 'forge:ingots/zinc', name: 'Zinc Ingots', category: 'Item' },
  { id: 'forge:ingots/brass', name: 'Brass Ingots', category: 'Item' },
  { id: 'forge:plates', name: 'All Plates', category: 'Item' },
  { id: 'forge:plates/iron', name: 'Iron Plates', category: 'Item' },
  { id: 'forge:plates/gold', name: 'Gold Plates', category: 'Item' },
  { id: 'forge:plates/copper', name: 'Copper Plates', category: 'Item' },
  { id: 'forge:nuggets', name: 'All Nuggets', category: 'Item' },
  { id: 'forge:nuggets/iron', name: 'Iron Nuggets', category: 'Item' },
  { id: 'forge:nuggets/gold', name: 'Gold Nuggets', category: 'Item' },
  { id: 'forge:gems', name: 'All Gems', category: 'Item' },
  { id: 'forge:gems/diamond', name: 'Diamonds', category: 'Item' },
  { id: 'forge:gems/emerald', name: 'Emeralds', category: 'Item' },
  { id: 'forge:dusts', name: 'All Dusts', category: 'Item' },
  { id: 'forge:dusts/redstone', name: 'Redstone Dust', category: 'Item' },
  { id: 'forge:dusts/glowstone', name: 'Glowstone Dust', category: 'Item' },
  { id: 'forge:ores', name: 'All Ores', category: 'Item' },
  { id: 'forge:ores/iron', name: 'Iron Ores', category: 'Item' },
  { id: 'forge:ores/gold', name: 'Gold Ores', category: 'Item' },
  { id: 'forge:ores/copper', name: 'Copper Ores', category: 'Item' },
  { id: 'forge:storage_blocks', name: 'All Storage Blocks', category: 'Item' },
  { id: 'forge:storage_blocks/iron', name: 'Iron Blocks', category: 'Item' },
  { id: 'forge:storage_blocks/gold', name: 'Gold Blocks', category: 'Item' },
  { id: 'forge:rods', name: 'All Rods', category: 'Item' },
  { id: 'forge:rods/wooden', name: 'Wooden Rods', category: 'Item' },
  { id: 'create:crushed_ores', name: 'Crushed Ores', category: 'Item' },
  { id: 'create:sandpaper', name: 'Sandpaper', category: 'Item' },
  { id: 'create:toolboxes', name: 'Toolboxes', category: 'Item' },
];

export const TagSelector: React.FC<TagSelectorProps> = ({ onSelect, onClose, type = 'item' }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customTag, setCustomTag] = useState('');

  const filteredTags = useMemo(() => {
    if (!searchQuery) return COMMON_TAGS;
    
    const query = searchQuery.toLowerCase();
    return COMMON_TAGS.filter(
      tag =>
        tag.id.toLowerCase().includes(query) ||
        tag.name.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleCustomTag = () => {
    if (customTag.trim()) {
      onSelect({
        id: customTag.trim(),
        name: customTag.trim(),
        category: 'Custom'
      });
    }
  };

  return (
    <>
      <div className="p-4 border-b border-border">
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
              autoFocus
            />
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Or enter custom tag ID..."
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCustomTag();
                }
              }}
              className="flex-1 px-4 py-2 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              onClick={handleCustomTag}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors"
            >
              Use
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="grid grid-cols-1 gap-2">
          {filteredTags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => onSelect(tag)}
              className="flex items-center gap-3 p-3 bg-secondary hover:bg-secondary/80 border border-border rounded transition-colors text-left"
            >
              <div className="w-8 h-8 bg-purple-500/20 rounded flex items-center justify-center">
                <TagIcon className="w-4 h-4 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-foreground">{tag.name}</div>
                <div className="text-xs text-muted-foreground">{tag.id}</div>
              </div>
              <div className="text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded">
                {tag.category}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
};
