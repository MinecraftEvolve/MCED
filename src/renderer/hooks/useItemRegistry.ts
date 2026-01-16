import { useState, useEffect, useCallback } from "react";

export interface ItemInfo {
  id: string;
  modId: string;
  name: string;
  texture: string | null;
  type: "item" | "block";
}

export function useItemRegistry(instancePath?: string | null) {
  const [items, setItems] = useState<ItemInfo[]>([]);
  const [blocks, setBlocks] = useState<ItemInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const loadItems = useCallback(async () => {
    if (!instancePath) return;

    setLoading(true);
    setError(null);

    try {
      const result = await window.api.itemRegistryGetAllItems(instancePath);
      
      if (result.success && result.data) {
        // Separate items and blocks
        const itemList = result.data.filter((item: ItemInfo) => item.type === 'item');
        const blockList = result.data.filter((item: ItemInfo) => item.type === 'block');
        setItems(itemList);
        setBlocks(blockList);
      } else {
        setError(result.error || "Failed to load items");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [instancePath]);

  const initialize = useCallback(async () => {
    if (!instancePath || initialized) return;

    setLoading(true);
    setError(null);

    try {
      const modsFolder = `${instancePath}/mods`;
      const result = await window.api.itemRegistryInitialize(instancePath, modsFolder);
      
      if (result.success) {
        setInitialized(true);
        // Load items after initialization
        await loadItems();
      } else {
        setError(result.error || "Failed to initialize item registry");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [instancePath, initialized, loadItems]);

  const searchItems = useCallback(async (query: string): Promise<ItemInfo[]> => {
    if (!instancePath) return [];

    try {
      const result = await window.api.itemRegistrySearchItems(instancePath, query);
      return result.success ? result.data : [];
    } catch {
      return [];
    }
  }, [instancePath]);

  const getItemById = useCallback(async (itemId: string): Promise<ItemInfo | null> => {
    if (!instancePath) return null;

    try {
      const result = await window.api.itemRegistryGetItemById(instancePath, itemId);
      return result.success ? result.data : null;
    } catch {
      return null;
    }
  }, [instancePath]);

  const rebuildCache = useCallback(async () => {
    if (!instancePath) return;

    setLoading(true);
    setError(null);

    try {
      const modsFolder = `${instancePath}/mods`;
      const result = await window.api.itemRegistryRebuildCache(instancePath, modsFolder);
      
      if (result.success) {
        setInitialized(false); // Force re-initialization
        await initialize();
      } else {
        setError(result.error || "Failed to rebuild cache");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [instancePath, initialize]);

  // Auto-initialize when instancePath changes
  useEffect(() => {
    if (instancePath && !initialized) {
      initialize();
    }
  }, [instancePath, initialized, initialize]);

  return {
    items,
    blocks,
    loading,
    error,
    initialized,
    searchItems,
    getItemById,
    rebuildCache,
    refresh: loadItems,
  };
}
