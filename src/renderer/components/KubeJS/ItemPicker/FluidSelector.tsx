import React, { useState, useEffect, useMemo } from 'react';
import { Search, Droplet } from 'lucide-react';
import { useAppStore } from "@/store";

interface Fluid {
  id: string;
  name: string;
  modId: string;
  texture?: string | null;
}

interface FluidSelectorProps {
  onSelect: (fluid: Fluid) => void;
  onClose: () => void;
}

export const FluidSelector: React.FC<FluidSelectorProps> = ({ onSelect, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [fluids, setFluids] = useState<Fluid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const currentInstance = useAppStore((state) => state.currentInstance);

  const loadFluids = async () => {
    if (!currentInstance) return;
    
    try {
      const result = await window.api.fluidRegistryGetAllFluids(currentInstance.path);
      if (result.success && result.data) {
        setFluids(result.data);
      }
    } catch (error) {
      console.error('Failed to load fluids:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const rebuildCache = async () => {
    if (!currentInstance) return;
    
    setIsRebuilding(true);
    try {
      await window.api.fluidRegistryRebuildCache(currentInstance.path, currentInstance.modsFolder);
      await loadFluids();
    } catch (error) {
      console.error('Failed to rebuild fluid cache:', error);
    } finally {
      setIsRebuilding(false);
    }
  };

  useEffect(() => {
    loadFluids();
  }, [currentInstance]);

  const filteredFluids = useMemo(() => {
    if (!searchQuery) return fluids;
    
    const query = searchQuery.toLowerCase();
    return fluids.filter(
      fluid =>
        fluid.id.toLowerCase().includes(query) ||
        fluid.name.toLowerCase().includes(query)
    );
  }, [searchQuery, fluids]);

  return (
    <>
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-foreground">Select Fluid</h3>
          <div className="flex gap-2">
            <button
              onClick={rebuildCache}
              disabled={isRebuilding}
              className="px-3 py-1 text-xs bg-primary hover:bg-primary/90 text-primary-foreground rounded disabled:opacity-50"
            >
              {isRebuilding ? 'Rebuilding...' : 'Rebuild Cache'}
            </button>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search fluids..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-secondary border border-border rounded text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
            autoFocus
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">
            Loading fluids...
          </div>
        ) : filteredFluids.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            No fluids found
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {filteredFluids.map((fluid) => (
              <button
                key={fluid.id}
                onClick={() => onSelect(fluid)}
                className="flex items-center gap-3 p-3 bg-secondary hover:bg-secondary/80 border border-border rounded transition-colors text-left"
              >
                <div className="w-10 h-10 bg-secondary border border-border rounded flex items-center justify-center">
                  {fluid.texture ? (
                    <img
                      src={fluid.texture.startsWith('data:') ? fluid.texture : `data:image/png;base64,${fluid.texture}`}
                      alt={fluid.name}
                      className="w-8 h-8 pixelated"
                    />
                  ) : (
                    <Droplet className="w-6 h-6 text-blue-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-foreground">{fluid.name}</div>
                  <div className="text-xs text-muted-foreground">{fluid.id}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
