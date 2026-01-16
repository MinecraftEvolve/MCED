import React, { useState } from 'react';
import { Package, Target, Trash2, Plus } from 'lucide-react';
import { UnifiedSelector } from '../RecipeEditor/UnifiedSelector';

interface LootPool {
  id: string;
  rolls: { min: number; max: number };
  entries: LootEntry[];
}

interface LootEntry {
  id: string;
  type: 'item' | 'tag' | 'loot_table';
  item: string;
  weight: number;
  count: { min: number; max: number };
  conditions: LootCondition[];
  functions: LootFunction[];
}

interface LootCondition {
  id: string;
  type: string;
  parameters: Record<string, any>;
}

interface LootFunction {
  id: string;
  type: string;
  parameters: Record<string, any>;
}

interface LootTableEditorProps {
  instancePath: string;
}

export const LootTableEditor: React.FC<LootTableEditorProps> = ({ instancePath }) => {
  const [lootType, setLootType] = useState<'block' | 'entity' | 'chest'>('block');
  const [targetId, setTargetId] = useState('');
  const [pools, setPools] = useState<LootPool[]>([
    {
      id: 'pool_1',
      rolls: { min: 1, max: 1 },
      entries: []
    }
  ]);

  const addPool = () => {
    setPools([...pools, {
      id: `pool_${pools.length + 1}`,
      rolls: { min: 1, max: 1 },
      entries: []
    }]);
  };

  const removePool = (poolId: string) => {
    setPools(pools.filter(p => p.id !== poolId));
  };

  const addEntry = (poolId: string) => {
    setPools(pools.map(pool => {
      if (pool.id === poolId) {
        return {
          ...pool,
          entries: [...pool.entries, {
            id: `entry_${pool.entries.length + 1}`,
            type: 'item',
            item: '',
            weight: 1,
            count: { min: 1, max: 1 },
            conditions: [],
            functions: []
          }]
        };
      }
      return pool;
    }));
  };

  const removeEntry = (poolId: string, entryId: string) => {
    setPools(pools.map(pool => {
      if (pool.id === poolId) {
        return {
          ...pool,
          entries: pool.entries.filter(e => e.id !== entryId)
        };
      }
      return pool;
    }));
  };

  const updateEntry = (poolId: string, entryId: string, updates: Partial<LootEntry>) => {
    setPools(pools.map(pool => {
      if (pool.id === poolId) {
        return {
          ...pool,
          entries: pool.entries.map(entry => 
            entry.id === entryId ? { ...entry, ...updates } : entry
          )
        };
      }
      return pool;
    }));
  };

  const saveLootTable = async () => {
    try {
      const lootTable = {
        type: `minecraft:${lootType}`,
        targetId,
        lootType,
        pools: pools.map(pool => ({
          rolls: pool.rolls,
          entries: pool.entries.map(entry => ({
            type: `minecraft:${entry.type}`,
            name: entry.item,
            weight: entry.weight,
            functions: [
              {
                function: 'minecraft:set_count',
                count: entry.count
              }
            ]
          }))
        }))
      };

      await window.api.kubeJSSaveLootTable(instancePath, lootTable);
      alert('Loot table saved successfully!');
    } catch (error) {
      console.error('Failed to save loot table:', error);
      alert('Failed to save loot table');
    }
  };

  return (
    <div className="h-full overflow-auto p-6 bg-background">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">Loot Table Editor</h2>
          <button
            onClick={saveLootTable}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
          >
            Save Loot Table
          </button>
        </div>

        {/* Loot Type Selection */}
        <div className="bg-secondary/20 border border-border rounded-lg p-6 space-y-4">
          <h3 className="text-lg font-semibold text-foreground">Target Configuration</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Loot Type
              </label>
              <select
                value={lootType}
                onChange={(e) => setLootType(e.target.value as any)}
                className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="block">Block Loot</option>
                <option value="entity">Entity Loot</option>
                <option value="chest">Chest Loot</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {lootType === 'block' ? 'Block ID' : lootType === 'entity' ? 'Entity ID' : 'Chest ID'}
              </label>
              {lootType === 'block' ? (
                <UnifiedSelector
                  value={targetId}
                  onChange={(value) => {
                    const stringValue = typeof value === 'string' ? value : value?.id || '';
                    setTargetId(stringValue);
                  }}
                  type="block"
                  placeholder="Select block..."
                />
              ) : (
                <input
                  type="text"
                  value={targetId}
                  onChange={(e) => setTargetId(e.target.value)}
                  placeholder={`e.g., minecraft:${lootType === 'entity' ? 'zombie' : 'diamond_ore'}`}
                  className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground placeholder-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              )}
            </div>
          </div>
        </div>

        {/* Pools */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">Loot Pools</h3>
            <button
              onClick={addPool}
              className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Pool
            </button>
          </div>

          {pools.map((pool, poolIndex) => (
            <div key={pool.id} className="bg-secondary/20 border border-border rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-white">Pool {poolIndex + 1}</h4>
                <button
                  onClick={() => removePool(pool.id)}
                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Roll Configuration */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Min Rolls
                  </label>
                  <input
                    type="number"
                    value={pool.rolls.min}
                    onChange={(e) => {
                      const newPools = [...pools];
                      newPools[poolIndex].rolls.min = parseInt(e.target.value) || 1;
                      setPools(newPools);
                    }}
                    min="1"
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-2">
                    Max Rolls
                  </label>
                  <input
                    type="number"
                    value={pool.rolls.max}
                    onChange={(e) => {
                      const newPools = [...pools];
                      newPools[poolIndex].rolls.max = parseInt(e.target.value) || 1;
                      setPools(newPools);
                    }}
                    min="1"
                    className="w-full px-3 py-2 bg-zinc-700 border border-zinc-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Entries */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h5 className="text-sm font-medium text-zinc-300">Entries</h5>
                  <button
                    onClick={() => addEntry(pool.id)}
                    className="flex items-center gap-1.5 px-2 py-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm rounded transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add Entry
                  </button>
                </div>

                {pool.entries.map((entry) => (
                  <div key={entry.id} className="bg-zinc-700 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <select
                        value={entry.type}
                        onChange={(e) => updateEntry(pool.id, entry.id, { type: e.target.value as any })}
                        className="px-2 py-1 bg-zinc-600 border border-zinc-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="item">Item</option>
                        <option value="tag">Tag</option>
                        <option value="loot_table">Loot Table</option>
                      </select>
                      <button
                        onClick={() => removeEntry(pool.id, entry.id)}
                        className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-xs font-medium text-zinc-400 mb-1">
                          {entry.type === 'item' ? 'Item ID' : entry.type === 'tag' ? 'Tag' : 'Loot Table ID'}
                        </label>
                        {entry.type === 'item' ? (
                          <UnifiedSelector
                            value={entry.item}
                            onChange={(value) => {
                              const stringValue = typeof value === 'string' ? value : value?.id || '';
                              updateEntry(pool.id, entry.id, { item: stringValue });
                            }}
                            type="item"
                            placeholder="Select item..."
                          />
                        ) : (
                          <input
                            type="text"
                            value={entry.item}
                            onChange={(e) => updateEntry(pool.id, entry.id, { item: e.target.value })}
                            placeholder={`e.g., minecraft:${entry.type === 'tag' ? 'logs' : 'chests/village_blacksmith'}`}
                            className="w-full px-2 py-1.5 bg-zinc-600 border border-zinc-500 rounded text-white text-sm placeholder-zinc-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-zinc-400 mb-1">Weight</label>
                        <input
                          type="number"
                          value={entry.weight}
                          onChange={(e) => updateEntry(pool.id, entry.id, { weight: parseInt(e.target.value) || 1 })}
                          min="1"
                          className="w-full px-2 py-1.5 bg-zinc-600 border border-zinc-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">Min Count</label>
                          <input
                            type="number"
                            value={entry.count.min}
                            onChange={(e) => updateEntry(pool.id, entry.id, { 
                              count: { ...entry.count, min: parseInt(e.target.value) || 1 }
                            })}
                            min="1"
                            className="w-full px-2 py-1.5 bg-zinc-600 border border-zinc-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-zinc-400 mb-1">Max Count</label>
                          <input
                            type="number"
                            value={entry.count.max}
                            onChange={(e) => updateEntry(pool.id, entry.id, { 
                              count: { ...entry.count, max: parseInt(e.target.value) || 1 }
                            })}
                            min="1"
                            className="w-full px-2 py-1.5 bg-zinc-600 border border-zinc-500 rounded text-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {pool.entries.length === 0 && (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    No entries yet. Click "Add Entry" to start building the loot table.
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
