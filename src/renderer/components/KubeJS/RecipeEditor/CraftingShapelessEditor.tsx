import React, { useState } from 'react';
import { Package, Plus, X } from 'lucide-react';
import { ItemPicker } from '../ItemPicker/ItemPicker';

interface Item {
  count: number;
  id: string;
  name: string;
  modId: string;
  texture?: string;
}

interface CraftingShapelessEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

export const CraftingShapelessEditor: React.FC<CraftingShapelessEditorProps> = ({ instancePath, onSave, initialRecipe }) => {
  const [ingredients, setIngredients] = useState<Item[]>([]);
  const [output, setOutput] = useState<Item | null>(null);
  const [outputCount, setOutputCount] = useState(initialRecipe?.results?.[0]?.count || 1);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingType, setPickingType] = useState<'ingredient' | 'output' | null>(null);

  const handleAddIngredient = () => {
    setPickingType('ingredient');
    setShowItemPicker(true);
  };

  const handleOutputSlotClick = () => {
    setPickingType('output');
    setShowItemPicker(true);
  };

  const handleItemSelected = async (itemId: string) => {
    try {
      const result = await window.api.itemRegistryGetItemById(instancePath, itemId);
      
      let item: Item;
      if (result.success && result.data) {
        item = {
          id: result.data.id,
          name: result.data.name,
          modId: result.data.modId,
          texture: result.data.texture,
          count: 1,
        };
      } else {
        item = {
          id: itemId,
          name: itemId.split(':')[1] || itemId,
          modId: itemId.split(':')[0] || 'minecraft',
          count: 1,
        };
      }
      if (pickingType === 'output') {
        setOutput(item);
      } else if (pickingType === 'ingredient') {
        setIngredients([...ingredients, item]);
      }
      setShowItemPicker(false);
      setPickingType(null);
    } catch (error) {
      console.error('Failed to fetch item data:', error);
      const item: Item = {
        id: itemId,
        name: itemId.split(':')[1] || itemId,
        modId: itemId.split(':')[0] || 'minecraft',
        count: 1,
      };
      if (pickingType === 'output') {
        setOutput(item);
      } else if (pickingType === 'ingredient') {
        setIngredients([...ingredients, item]);
      }
      setShowItemPicker(false);
      setPickingType(null);
    }
  };

  const handleRemoveIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const handleClearOutput = () => {
    setOutput(null);
  };

  const handleSave = () => {
    if (!output || ingredients.length === 0) {
      alert('Please provide at least one ingredient and an output item');
      return;
    }

    const recipe = {
      type: 'minecraft:crafting_shapeless',
      ingredients: ingredients.map(item => ({ item: item.id })),
      result: {
        item: output.id,
        count: outputCount
      }
    };

    onSave(recipe);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Ingredients */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Ingredients (any order)</h3>
          <div className="bg-muted/50 border border-border rounded-lg p-4 min-h-[200px]">
            <div className="flex flex-wrap gap-2">
              {ingredients.map((item, index) => (
                <div
                  key={index}
                  className="relative w-16 h-16 bg-secondary border-2 border-border rounded group"
                >
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    {item.texture ? (
                      <img
                        src={item.texture.startsWith('data:') ? item.texture : `data:image/png;base64,${item.texture}`}
                        alt={item.name}
                        className="w-full h-full object-contain pixelated"
                      />
                    ) : (
                      <Package className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    onClick={() => handleRemoveIngredient(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-border">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">{item.id}</div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Add Button */}
              {ingredients.length < 9 && (
                <button
                  onClick={handleAddIngredient}
                  className="w-16 h-16 bg-secondary border-2 border-dashed border-border rounded hover:border-primary transition-colors flex items-center justify-center"
                >
                  <Plus className="w-6 h-6 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Output */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Output</h3>
          <div className="inline-block bg-muted/50 border border-border rounded-lg p-4">
            <div
              onClick={handleOutputSlotClick}
              className="relative w-24 h-24 bg-secondary border-2 border-border rounded cursor-pointer hover:border-primary transition-colors group"
            >
              {output ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center p-3">
                    {output.texture ? (
                      <img
                        src={output.texture.startsWith('data:') ? output.texture : `data:image/png;base64,${output.texture}`}
                        alt={output.name}
                        className="w-full h-full object-contain pixelated"
                      />
                    ) : (
                      <Package className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleClearOutput();
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {outputCount > 1 && (
                    <div className="absolute bottom-1 right-1 bg-background text-foreground text-xs font-bold px-1.5 py-0.5 rounded shadow-lg border border-border">
                      {outputCount}
                    </div>
                  )}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-border">
                      <div className="font-medium">{output.name}</div>
                      <div className="text-muted-foreground">{output.id}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                </div>
              )}
            </div>
            
            {output && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-foreground mb-1">
                  Count
                </label>
                <input
                  type="number"
                  min="1"
                  max="64"
                  value={outputCount}
                  onChange={(e) => setOutputCount(Math.max(1, Math.min(64, parseInt(e.target.value) || 1)))}
                  className="w-20 px-2 py-1 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Code Preview */}
      {output && ingredients.length > 0 && (
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{'</>'}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-border overflow-x-auto">
{`event.shapeless('${output.id}'${outputCount > 1 ? ` * ${outputCount}` : ''}, [
${ingredients.map(ing => `  '${ing.id}'${ing.count > 1 ? ` * ${ing.count}` : ''}`).join(',\n')}
])`}
          </pre>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={() => {
            setIngredients([]);
            setOutput(null);
            setOutputCount(1);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!output || ingredients.length === 0}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Recipe
        </button>
      </div>

      {/* Item Picker Modal */}
      {showItemPicker && (
        <ItemPicker
          instancePath={instancePath}
          onSelect={handleItemSelected}
          onClose={() => {
            setShowItemPicker(false);
            setPickingType(null);
          }}
          title={pickingType === 'output' ? 'Select Output Item' : 'Select Ingredient'}
        />
      )}
    </div>
  );
};
