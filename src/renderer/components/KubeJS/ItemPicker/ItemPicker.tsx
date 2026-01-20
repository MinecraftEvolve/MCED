import React, { useState, useEffect, useMemo, useCallback, memo } from "react";
import { Search, X, Package, Clock } from "lucide-react";
import { useItemRegistry } from "../../../hooks/useItemRegistry";
import { useDebounce } from "../../../hooks/useDebounce";
import { VirtualGrid } from "../../common/VirtualList";

interface ItemPickerProps {
  instancePath: string;
  onSelect: (itemId: string) => void;
  onClose: () => void;
  selectedItem?: string;
  title?: string;
}

// Memoized Item Component
const ItemComponent = memo<{
  item: any;
  isSelected: boolean;
  onSelect: (id: string) => void;
}>(({ item, isSelected, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(item.id);
  }, [item.id, onSelect]);

  return (
    <button
      onClick={handleClick}
      className={`group relative flex flex-col items-center gap-2 p-3 bg-item-bg hover:bg-item-hover border border-primary rounded item-transition ${
        isSelected ? "border-focus bg-item-selected" : ""
      }`}
      title={item.id}
    >
      {/* Item Icon */}
      <div className="w-12 h-12 flex items-center justify-center bg-recipe-slot border border-primary rounded">
        {item.texture ? (
          <img
            src={`data:image/png;base64,${item.texture}`}
            alt={item.name}
            className="w-10 h-10 pixelated"
            loading="lazy"
          />
        ) : (
          <Package className="w-6 h-6 text-muted" />
        )}
      </div>

      {/* Item Info */}
      <div className="w-full text-center">
        <div className="text-xs font-medium text-secondary truncate">{item.name}</div>
        <div className="text-[10px] text-muted truncate">{item.modId}</div>
      </div>

      {/* Selected Indicator */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-focus rounded pointer-events-none" />
      )}
    </button>
  );
});

ItemComponent.displayName = "ItemComponent";

const RECENT_ITEMS_KEY = "kubejs_recent_items";
const MAX_RECENT_ITEMS = 12;

export const ItemPicker: React.FC<ItemPickerProps> = ({
  instancePath,
  onSelect,
  onClose,
  selectedItem,
  title = "Select Item",
}) => {
  const { items, blocks, loading, searchItems } = useItemRegistry(instancePath);
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 150);
  const [activeTab, setActiveTab] = useState<"recent" | "items" | "blocks">("recent");
  const [recentItems, setRecentItems] = useState<string[]>([]);

  // Load recent items from localStorage
  useEffect(() => {
    const stored = localStorage.getItem(RECENT_ITEMS_KEY);
    if (stored) {
      try {
        setRecentItems(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse recent items:", e);
      }
    }
  }, []);

  // Save item to recent history
  const addToRecent = (itemId: string) => {
    const updated = [itemId, ...recentItems.filter((id) => id !== itemId)].slice(
      0,
      MAX_RECENT_ITEMS
    );
    setRecentItems(updated);
    localStorage.setItem(RECENT_ITEMS_KEY, JSON.stringify(updated));
  };

  // Memoize combined items to prevent recreation
  const allCombined = useMemo(() => [...items, ...blocks], [items, blocks]);

  const allItems = useMemo(() => {
    if (activeTab === "recent") {
      return recentItems
        .map((id) => allCombined.find((item) => item.id === id))
        .filter(Boolean) as typeof items;
    }
    return activeTab === "items" ? items : blocks;
  }, [activeTab, items, blocks, recentItems, allCombined]);

  // Debounced search with memoization
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm.trim()) return allItems;

    const term = debouncedSearchTerm.toLowerCase();
    const searchResults = allItems.filter(
      (item) =>
        item.id.toLowerCase().includes(term) ||
        item.name.toLowerCase().includes(term) ||
        item.modId.toLowerCase().includes(term)
    );

    // Limit results for performance
    return searchResults.slice(0, 200);
  }, [allItems, debouncedSearchTerm]);

  const handleSelect = (itemId: string) => {
    addToRecent(itemId);
    onSelect(itemId);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-surface border border-primary rounded-lg shadow-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-primary">
          <h2 className="text-lg font-semibold text-primary flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-surface-hover rounded btn-transition text-muted hover:text-secondary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-6 py-4 border-b border-primary">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted" />
            <input
              type="text"
              placeholder="Search by item ID, name, or mod..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-input-bg border border-primary rounded text-sm text-primary placeholder-muted focus:outline-none focus:border-focus btn-transition"
              autoFocus
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 px-6 py-3 border-b border-primary bg-surface">
          <button
            onClick={() => setActiveTab("recent")}
            className={`px-4 py-2 rounded text-sm font-medium btn-transition flex items-center gap-2 ${
              activeTab === "recent"
                ? "bg-btn-primary-bg text-btn-primary-text"
                : "bg-surface text-muted hover:bg-surface-hover hover:text-secondary"
            }`}
          >
            <Clock className="w-4 h-4" />
            Recent ({recentItems.length})
          </button>
          <button
            onClick={() => setActiveTab("items")}
            className={`px-4 py-2 rounded text-sm font-medium btn-transition ${
              activeTab === "items"
                ? "bg-btn-primary-bg text-btn-primary-text"
                : "bg-surface text-muted hover:bg-surface-hover hover:text-secondary"
            }`}
          >
            Items ({items.length})
          </button>
          <button
            onClick={() => setActiveTab("blocks")}
            className={`px-4 py-2 rounded text-sm font-medium btn-transition ${
              activeTab === "blocks"
                ? "bg-btn-primary-bg text-btn-primary-text"
                : "bg-surface text-muted hover:bg-surface-hover hover:text-secondary"
            }`}
          >
            Blocks ({blocks.length})
          </button>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-muted-foreground text-sm">Loading items...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
              <Package className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">No items found</p>
              {searchTerm && <p className="text-xs mt-1">Try a different search term</p>}
            </div>
          ) : (
            <VirtualGrid
              items={filteredItems}
              itemHeight={120}
              containerHeight={400}
              columns={6}
              gap={12}
              renderItem={(item, index) => (
                <ItemComponent
                  key={item.id}
                  item={item}
                  isSelected={selectedItem === item.id}
                  onSelect={handleSelect}
                />
              )}
            />
          )}
        </div>

        {/* Footer Info */}
        <div className="px-6 py-3 border-t border-primary bg-surface">
          <p className="text-xs text-muted">
            Showing {filteredItems.length} of {allItems.length} {activeTab}
          </p>
        </div>
      </div>
    </div>
  );
};
