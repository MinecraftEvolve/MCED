import React, { useState } from 'react';
import { Package, Plus, X, Flame } from 'lucide-react';
import { ItemPicker } from '../ItemPicker/ItemPicker';

interface Item {
  type: string;
  amount: number;
  id: string;
  name: string;
  modId: string;
  texture?: string;
  count?: number;
}

interface CreateMixingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

export const CreateMixingEditor: React.FC<CreateMixingEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe
}) => {
  const getInitialInputs = (): Item[] => {
    if (!initialRecipe) return [];
    if (initialRecipe.inputs) {
      return initialRecipe.inputs.map((id: string) => ({
        id,
        name: id.split(':')[1] || id,
        modId: id.split(':')[0] || 'minecraft'
      }));
    }
    if (initialRecipe.ingredients) {
      return initialRecipe.ingredients.map((ing: any) => ({
        id: ing.item || ing.tag || '',
        name: (ing.item || ing.tag || '').split(':')[1],
        modId: (ing.item || ing.tag || '').split(':')[0]
      }));
    }
    return [];
  };

  const getInitialOutput = (): Item | null => {
    if (!initialRecipe) return null;
    const outputId = initialRecipe.output || initialRecipe.results?.[0]?.item;
    const outputCount = initialRecipe.outputCount || initialRecipe.results?.[0]?.count || 1;
    if (!outputId) return null;
    return {
  id: outputId,
  name: outputId.split(':')[1] || outputId,
  modId: outputId.split(':')[0] || 'minecraft',
  count: outputCount,
  type: '',
  amount: 0
};
  };

  const [inputs, setInputs] = useState<Item[]>(getInitialInputs());
  const [output, setOutput] = useState<Item | null>(getInitialOutput());
  const [heated, setHeated] = useState(initialRecipe?.properties?.heated || initialRecipe?.heated || false);
  const [superheated, setSuperheated] = useState(initialRecipe?.properties?.superheated || initialRecipe?.superheated || false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingType, setPickingType] = useState<'input' | 'output' | null>(null);

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
          type: '',
          amount: 0
        };
      } else {
        item = {
          id: itemId,
          name: itemId.split(':')[1] || itemId,
          modId: itemId.split(':')[0] || 'minecraft',
          count: 1,
          type: '',
          amount: 0
        };
      }

      if (pickingType === 'output') {
        setOutput(item);
      } else if (pickingType === 'input') {
        setInputs([...inputs, item]);
      }
      setShowItemPicker(false);
      setPickingType(null);
    } catch (error) {
      console.error('Failed to fetch item data:', error);
    }
  };

  const removeInput = (index: number) => {
    setInputs(inputs.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    if (!output || inputs.length === 0) {
      alert('Please provide at least one input and an output');
      return;
    }

    const recipe = {
      type: 'create:mixing',
      ingredients: inputs.map(item => ({ item: item.id })),
      results: [{ item: output.id, count: output.count || 1 }],
      heatRequirement: superheated ? 'superheated' : heated ? 'heated' : 'none'
    };

    onSave(recipe);
  };

  return (
    <div className="space-y-6">
      {/* Visual Recipe Layout */}
      <div className="grid grid-cols-[1fr_auto_1fr] gap-6 items-center">
        {/* Inputs */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Inputs</h3>
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div className="grid grid-cols-3 gap-2 mb-3">
              {inputs.map((item, index) => (
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
                    onClick={() => removeInput(index)}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-border">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-muted-foreground">{item.id}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setPickingType('input'); setShowItemPicker(true); }}
              className="w-full px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Input
            </button>
          </div>
        </div>

        {/* Process Visual */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-4xl">→</div>
          {(heated || superheated) && (
            <Flame className={`w-6 h-6 ${superheated ? 'text-blue-500' : 'text-orange-500'}`} />
          )}
        </div>

        {/* Output */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Output</h3>
          <div className="bg-muted/50 border border-border rounded-lg p-4">
            <div
              onClick={() => { setPickingType('output'); setShowItemPicker(true); }}
              className="relative w-20 h-20 mx-auto bg-secondary border-2 border-border rounded cursor-pointer hover:border-primary transition-colors group"
            >
              {output ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    {output.texture ? (
                      <img
                        src={output.texture.startsWith('data:') ? output.texture : `data:image/png;base64,${output.texture}`}
                        alt={output.name}
                        className="w-full h-full object-contain pixelated"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  {output.count && output.count > 1 && (
                    <div className="absolute bottom-1 right-1 bg-gray-900/90 text-white text-xs px-1 rounded">
                      {output.count}
                    </div>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setOutput(null);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
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
              <div className="mt-2">
                <label className="block text-xs text-muted-foreground mb-1">Count</label>
                <input
                  type="number"
                  min="1"
                  value={output.count || 1}
                  onChange={(e) => setOutput({ ...output, count: parseInt(e.target.value) || 1 })}
                  className="w-full px-2 py-1 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Heat Requirement */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <label className="block text-sm font-medium text-foreground mb-3">Heat Requirement</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="heat"
              checked={!heated && !superheated}
              onChange={() => { setHeated(false); setSuperheated(false); }}
              className="w-4 h-4"
            />
            <span className="text-foreground">None</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="heat"
              checked={heated && !superheated}
              onChange={() => { setHeated(true); setSuperheated(false); }}
              className="w-4 h-4"
            />
            <span className="text-foreground">▲ Heated (any heat source)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="heat"
              checked={superheated}
              onChange={() => { setHeated(true); setSuperheated(true); }}
              className="w-4 h-4"
            />
            <span className="text-foreground">🔵 Superheated (blaze burner)</span>
          </label>
        </div>
      </div>

      {/* Code Preview */}
      {output && inputs.length > 0 && (
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{'</>'}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-border overflow-x-auto">
{`event.recipes.create.mixing('${output.id}'${output.count && output.count > 1 ? ` * ${output.count}` : ''}, [
${inputs.map(input => {
  if (input.type === 'fluid') {
    return `  Fluid.of('${input.id}', ${input.amount || 1000})`;
  }
  return `  '${input.id}'${input.count && input.count > 1 ? ` * ${input.count}` : ''}`;
}).join(',\n')}
])${heated ? `.heated()` : ''}${superheated ? `.superheated()` : ''}`}
          </pre>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={() => {
            setInputs([]);
            setOutput(null);
            setHeated(false);
            setSuperheated(false);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!output || inputs.length === 0}
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
          title={pickingType === 'output' ? 'Select Output Item' : 'Select Input Item'}
        />
      )}
    </div>
  );
};
