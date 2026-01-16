import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Package } from 'lucide-react';

interface Item {
  id: string;
  name: string;
  modId: string;
  type: 'item' | 'block';
  texture?: string;
}

interface ItemSelectorProps {
  instancePath: string;
  onSelect?: (item: Item) => void;
}

const ITEMS_PER_PAGE = 100;

export const ItemSelector: React.FC<ItemSelectorProps> = ({ instancePath, onSelect }) => {
  const [allItems, setAllItems] = useState<Item[]>([]);
  const [displayedItems, setDisplayedItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [page, setPage] = useState(0);
  const observerTarget = useRef(null);

  useEffect(() => {
    initializeRegistry();
  }, [instancePath]);

  useEffect(() => {
    if (isInitialized && allItems.length === 0 && !searchQuery) {
      loadInitialItems();
    }
  }, [isInitialized]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && displayedItems.length < allItems.length) {
          loadMoreItems();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [displayedItems, allItems]);

  const initializeRegistry = async () => {
    setIsLoading(true);
    try {
      const modsFolder = instancePath + '/mods';
      await window.api.itemRegistryInitialize(instancePath, modsFolder);
      setIsInitialized(true);
    } catch (error) {
      console.error('Failed to initialize items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadInitialItems = async () => {
    setIsLoading(true);
    try {
      const result = await window.api.itemRegistryGetAllItems(instancePath);
      if (result.success && result.data) {
        const items = result.data;
        setAllItems(items);
        setDisplayedItems(items.slice(0, ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Failed to load items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreItems = useCallback(() => {
    const nextPage = page + 1;
    const startIdx = displayedItems.length;
    const endIdx = Math.min(startIdx + ITEMS_PER_PAGE, allItems.length);
    
    if (startIdx < allItems.length) {
      setDisplayedItems(prev => [...prev, ...allItems.slice(startIdx, endIdx)]);
      setPage(nextPage);
    }
  }, [allItems, displayedItems, page]);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setPage(0);
    
    if (!isInitialized) return;

    if (!query.trim()) {
      // Load all items when search is cleared
      await loadInitialItems();
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.api.itemRegistrySearchItems(instancePath, query);
      if (result.success && result.data) {
        const items = result.data;
        setAllItems(items);
        setDisplayedItems(items.slice(0, ITEMS_PER_PAGE));
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [instancePath, isInitialized]);

  const handleItemClick = (item: Item) => {
    setSelectedItem(item);
    if (onSelect) {
      onSelect(item);
    }
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search items... (e.g., 'minecraft:diamond', 'iron', 'create')"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
        />
      </div>

      {/* Selected Item Display */}
      {selectedItem && (
        <div className="bg-secondary border border-border rounded-lg p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-background border border-border rounded flex items-center justify-center">
              {selectedItem.texture ? (
                <img
                  src={`data:image/png;base64,${selectedItem.texture}`}
                  alt={selectedItem.name}
                  className="w-12 h-12 pixelated"
                />
              ) : (
                <Package className="w-8 h-8 text-muted-foreground" />
              )}
            </div>
            <div>
              <h4 className="font-medium text-foreground">{selectedItem.name}</h4>
              <p className="text-sm text-muted-foreground">{selectedItem.id}</p>
              <span className="text-xs text-primary">{selectedItem.modId}</span>
            </div>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="bg-secondary border border-border rounded-lg p-4">
        {!isInitialized ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Initializing item registry...</div>
          </div>
        ) : !searchQuery.trim() && displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Search className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Loading items...</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try searching by mod, item name, or ID</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">Searching...</div>
          </div>
        ) : displayedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No items found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Try a different search query</p>
          </div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-8 gap-2">
              {displayedItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className={`group relative aspect-square bg-background border rounded hover:border-primary transition-all ${
                    selectedItem?.id === item.id
                      ? 'border-primary ring-2 ring-primary/20'
                      : 'border-border'
                  }`}
                  title={`${item.name}\n${item.id}`}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-1">
                    {item.texture ? (
                      <img
                        src={`data:image/png;base64,${item.texture}`}
                        alt={item.name}
                        className="w-full h-full object-contain pixelated"
                        loading="lazy"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                    <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-border">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">{item.id}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            {/* Infinite scroll trigger */}
            {displayedItems.length < allItems.length && (
              <div ref={observerTarget} className="flex items-center justify-center py-4">
                <div className="text-sm text-muted-foreground">Loading more...</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Item Count */}
      {displayedItems.length > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Showing {displayedItems.length} of {allItems.length} item{allItems.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};
