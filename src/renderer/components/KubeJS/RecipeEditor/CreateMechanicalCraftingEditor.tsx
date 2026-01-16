import React, { useState } from 'react';
import { ItemPicker } from '../ItemPicker/ItemPicker';
import { Package, Plus, X } from 'lucide-react';

interface CreateMechanicalCraftingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

export const CreateMechanicalCraftingEditor: React.FC<CreateMechanicalCraftingEditorProps> = ({ instancePath, onSave, initialRecipe }) => {
  const [gridSize, setGridSize] = useState(initialRecipe?.pattern?.length || 5);
  const [pattern, setPattern] = useState<string[]>(
    initialRecipe?.pattern || Array(gridSize).fill(' '.repeat(gridSize))
  );
  const [key, setKey] = useState<Record<string, string>>(initialRecipe?.key || {});
  const [result, setResult] = useState(initialRecipe?.result?.item || '');
  const [resultCount, setResultCount] = useState(initialRecipe?.result?.count || 1);
  const [selectedSlot, setSelectedSlot] = useState<{ row: number; col: number } | 'output' | null>(null);
  const [showItemPicker, setShowItemPicker] = useState(false);

  const handleSlotClick = (row: number, col: number) => {
    setSelectedSlot({ row, col });
    setShowItemPicker(true);
  };

  const handleItemSelect = (item: string) => {
    if (!selectedSlot) return;
    
    if (selectedSlot === 'output') {
      setResult(item);
    } else {
      const char = String.fromCharCode(65 + Object.keys(key).length);
      const newKey = { ...key, [char]: item };
      setKey(newKey);

      const newPattern = [...pattern];
      const row = newPattern[selectedSlot.row].split('');
      row[selectedSlot.col] = char;
      newPattern[selectedSlot.row] = row.join('');
      setPattern(newPattern);
    }

    setShowItemPicker(false);
    setSelectedSlot(null);
  };

  const clearSlot = (row: number, col: number) => {
    const newPattern = [...pattern];
    const patternRow = newPattern[row].split('');
    patternRow[col] = ' ';
    newPattern[row] = patternRow.join('');
    setPattern(newPattern);
  };

  const handleSave = () => {
    onSave({
      type: 'create:mechanical_crafting',
      pattern,
      key,
      result: {
        item: result,
        count: resultCount
      }
    });
  };

  const changeGridSize = (newSize: number) => {
    setGridSize(newSize);
    setPattern(Array(newSize).fill(' '.repeat(newSize)));
    setKey({});
  };

  return (
    <div className="space-y-6">
      {/* Grid Size Selector */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Grid Size</label>
        <select
          value={gridSize}
          onChange={(e) => changeGridSize(Number(e.target.value))}
          className="w-48 bg-secondary border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary"
        >
          {[3, 4, 5, 6, 7, 8, 9].map(size => (
            <option key={size} value={size}>{size}x{size}</option>
          ))}
        </select>
      </div>

      {/* Crafting Grid */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Crafting Pattern ({gridSize}x{gridSize})</label>
        <div 
          className="grid gap-1 mx-auto"
          style={{
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            maxWidth: `${gridSize * 64}px`
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, index) => {
            const row = Math.floor(index / gridSize);
            const col = index % gridSize;
            const char = pattern[row]?.[col] || ' ';
            const itemId = char !== ' ' ? key[char] : null;

            // Get item data from window.itemRegistry if available
            const itemData = itemId && (window as any).itemRegistry?.[itemId];

            return (
              <div
                key={index}
                onClick={() => handleSlotClick(row, col)}
                className="relative w-16 h-16 bg-secondary border-2 border-border rounded cursor-pointer hover:border-primary transition-colors group"
              >
                {itemData ? (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      {itemData.texture ? (
                        <img
                          src={`data:image/png;base64,${itemData.texture}`}
                          alt={itemData.name}
                          className="w-full h-full object-contain pixelated"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSlot(row, col);
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-border">
                        <div className="font-medium">{itemData.name}</div>
                        <div className="text-muted-foreground">{itemId}</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Result */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">Output Item</label>
        <div className="flex items-center gap-4">
          <div
            onClick={() => {
              setSelectedSlot('output');
              setShowItemPicker(true);
            }}
            className="relative w-16 h-16 bg-secondary border-2 border-border rounded cursor-pointer hover:border-primary transition-colors group"
          >
            {result && (window as any).itemRegistry?.[result] ? (
              <>
                <div className="absolute inset-0 flex items-center justify-center p-2">
                  {(window as any).itemRegistry[result].texture ? (
                    <img
                      src={`data:image/png;base64,${(window as any).itemRegistry[result].texture}`}
                      alt={(window as any).itemRegistry[result].name}
                      className="w-full h-full object-contain pixelated"
                    />
                  ) : (
                    <Package className="w-8 h-8 text-muted-foreground" />
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setResult('');
                    setResultCount(1);
                  }}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                  <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-border">
                    <div className="font-medium">{(window as any).itemRegistry[result].name}</div>
                    <div className="text-muted-foreground">{result}</div>
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Plus className="w-6 h-6 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Count</label>
            <input
              type="number"
              value={resultCount}
              onChange={(e) => setResultCount(Number(e.target.value))}
              min="1"
              max="64"
              className="w-20 bg-secondary border border-border text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={() => {
            setPattern(Array(gridSize).fill(' '.repeat(gridSize)));
            setKey({});
            setResult('');
            setResultCount(1);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!result || !pattern.some(row => row.trim())}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Recipe
        </button>
      </div>

      {/* Code Preview */}
      {result && pattern.some(row => row.trim()) && (
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{'</>'}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-border overflow-x-auto">
{`event.recipes.create.mechanical_crafting('${result}'${resultCount > 1 ? ` * ${resultCount}` : ''}, [
${pattern.map(row => `  '${row}'`).join(',\n')}
], {
${Object.entries(key).map(([char, item]) => `  ${char}: '${item}'`).join(',\n')}
})`}
          </pre>
        </div>
      )}

      {/* Item Picker Modal */}
      {showItemPicker && (
        <ItemPicker
          instancePath={instancePath}
          onSelect={handleItemSelect}
          onClose={() => {
            setShowItemPicker(false);
            setSelectedSlot(null);
          }}
          title={selectedSlot === 'output' ? 'Select Output Item' : 'Select Ingredient'}
        />
      )}
    </div>
  );
};
