import React, { useState, useEffect, useMemo } from 'react';
import { Search, X, Package, Clock } from 'lucide-react';
import { useItemRegistry } from '../../../hooks/useItemRegistry';

interface ItemPickerProps {
  instancePath: string;
  onSelect: (itemId: string) => void;
  onClose: () => void;
  selectedItem?: string;
  title?: string;
}

const RECENT_ITEMS_KEY = 'kubejs_recent_items';
const MAX_RECENT_ITEMS = 12;

export const ItemPicker: React.FC<ItemPickerProps> = ({
  instancePath,
  onSelect,
  onClose,
  selectedItem,
  title = 'Select Item'
}) => {
  const { items, blocks, loading, searchItems } = useItemRegistry(instancePath);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'items' | 'blocks'>('recent');
  const [recentItems, setRecentItems] = useState<string[]>([]);

  // Load recent items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (stored) {
      try {
        setRecentItems(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse recent items:', e);
      }
    }
  }, []);

  // Save item to recent history
  const addToRecent = (itemId: string) => {
    const updated = [itemId, ...recentItems.filter(id => id !== itemId)].slice(0, MAX_RECENT_ITEMS);
    setRecentItems(updated);
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
  };

  const allItems = useMemo(() => {
    if (activeTab === 'recent') {
      const allCombined = [...items, ...blocks];
      return recentItems.map(id => allCombined.find(item => item.id === id)).filter(Boolean) as typeof items;
    }
    return activeTab === 'items' ? items : blocks;
  }, [activeTab, items, blocks, recentItems]);

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return allItems;
    
    const term = searchTerm.toLowerCase();
    return allItems.filter(item => 
      item.id.toLowerCase().includes(term) ||
      item.name.toLowerCase().includes(term) ||
      item.modId.toLowerCase().includes(term)
    );
  }, [allItems, searchTerm]);

  const handleSelect = (itemId: string) => {
    addToRecent(itemId);
    onSelect(itemId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-[#252526] border rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border">
          <h2 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-400" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-[#3e3e42] rounded transition-colors text-gray-400 hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by item ID, name, or mod..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#1e1e1e] border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border bg-[#2d2d30]">
          <button
            onClick={() => setActiveTab('recent')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'recent'
                ? 'bg-blue-600 text-white'
                : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#3e3e42] hover:text-gray-200'
            }`}
          >
            <Clock className="w-4 h-4" />
            Recent ({recentItems.length})
          </button>
          <button
            onClick={() => setActiveTab('items')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'items'
                ? 'bg-blue-600 text-white'
                : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#3e3e42] hover:text-gray-200'
            }`}
          >
            Items ({items.length})
          </button>
          <button
            onClick={() => setActiveTab('blocks')}
            className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
              activeTab === 'blocks'
                ? 'bg-blue-600 text-white'
                : 'bg-[#1e1e1e] text-gray-400 hover:bg-[#3e3e42] hover:text-gray-200'
            }`}
          >
            Blocks ({blocks.length})
          </button>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-400 text-sm">Loading items...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Package className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No items found</p>
              {searchTerm && (
                <p className="text-xs mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  className={`group relative flex flex-col items-center gap-2 p-3 bg-[#2d2d30] hover:bg-[#3e3e42] border rounded transition-all ${
                    selectedItem === item.id
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border hover:border-blue-500/50'
                  }`}
                  title={item.id}
                >
                  {/* Item Icon */}
                  <div className="w-12 h-12 flex items-center justify-center bg-[#1e1e1e] rounded border">
                    {item.texture ? (
                      <img
                        src={`data:image/png;base64,${item.texture}`}
                        alt={item.name}
                        className="w-10 h-10 pixelated"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  
                  {/* Item Info */}
                  <div className="w-full text-center">
                    <div className="text-xs font-medium text-gray-200 truncate">
                      {item.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground truncate">
                      {item.modId}
                    </div>
                  </div>

                  {/* Selected Indicator */}
                  {selectedItem === item.id && (
                    <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 border-t border bg-[#2d2d30]">
          <p className="text-xs text-muted-foreground">
            Showing {filteredItems.length} of {allItems.length} {activeTab}
          </p>
        </div>
      </div>
    </div>
  );
};
