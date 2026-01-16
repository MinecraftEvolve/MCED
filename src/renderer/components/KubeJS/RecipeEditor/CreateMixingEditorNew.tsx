import React, { useState } from 'react';
import { ArrowRight, Plus } from 'lucide-react';
import { ItemPicker } from '../ItemPicker/ItemPicker';
import { ItemSlot } from './ItemSlot';

interface Item {
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
  const [recipeId, setRecipeId] = useState(initialRecipe?.id || '');
  const [inputs, setInputs] = useState<(Item | null)[]>([null, null, null, null]);
  const [output, setOutput] = useState<Item | null>(null);
  const [outputCount, setOutputCount] = useState(initialRecipe?.results?.[0]?.count || 1);
  const [heated, setHeated] = useState(false);
  const [superheated, setSuperheated] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<number | 'output' | null>(null);

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
          count: 1
        };
      } else {
        item = {
          id: itemId,
          name: itemId.split(':')[1] || itemId,
          modId: itemId.split(':')[0] || 'minecraft',
          count: 1
        };
      }
      
      if (pickingSlot === 'output') {
        setOutput(item);
      } else if (typeof pickingSlot === 'number') {
        const newInputs = [...inputs];
        newInputs[pickingSlot] = item;
        setInputs(newInputs);
      }
      
      setShowItemPicker(false);
      setPickingSlot(null);
    } catch (error) {
      console.error('Failed to fetch item data:', error);
    }
  };

  const updateInput = (index: number, count: number) => {
    const newInputs = [...inputs];
    if (newInputs[index]) {
      newInputs[index] = { ...newInputs[index]!, count };
      setInputs(newInputs);
    }
  };

  const handleSave = () => {
    if (!recipeId) {
      alert('Please provide a recipe ID');
      return;
    }

    const validInputs = inputs.filter(i => i !== null) as Item[];
    if (validInputs.length === 0 || !output) {
      alert('Please add at least one input and an output');
      return;
    }

    const recipe: any = {
      id: recipeId,
      type: 'create:mixing',
      ingredients: validInputs.map(i => ({ item: i.id, count: i.count || 1 })),
      results: [{ item: output.id, count: outputCount }]
    };

    if (heated || superheated) {
      recipe.heatRequirement = superheated ? 'superheated' : 'heated';
    }

    onSave(recipe);
  };

  return (
    <div className="space-y-6">
      {/* Recipe ID */}
      <div className="grid grid-cols-[1fr,auto,auto] gap-8 items-center">
        {/* Inputs */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">Inputs (Basin)</p>
          <div className="grid grid-cols-2 gap-3">
            {inputs.map((input, index) => (
              <div key={index} className="flex items-center gap-2">
                <ItemSlot
                  item={input}
                  size="normal"
                  onClick={() => {
                    setPickingSlot(index);
                    setShowItemPicker(true);
                  }}
                  onClear={() => {
                    const newInputs = [...inputs];
                    newInputs[index] = null;
                    setInputs(newInputs);
                  }}
                  showCount={true}
                />
                {input && (
                  <div>
                    <label className="block text-xs font-medium text-foreground mb-1">Count</label>
                    <input
                      type="number"
                      min="1"
                      max="64"
                      value={input.count || 1}
                      onChange={(e) => updateInput(index, Math.max(1, Math.min(64, parseInt(e.target.value) || 1)))}
                      className="w-16 px-2 py-1 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:border-primary"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <ArrowRight className="w-8 h-8 text-primary" />

        {/* Output */}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground mb-3">Output</p>
          <ItemSlot
            item={output ? { ...output, count: outputCount } : null}
            size="large"
            onClick={() => {
              setPickingSlot('output');
              setShowItemPicker(true);
            }}
            onClear={() => setOutput(null)}
          />
          {output && (
            <div className="mt-2">
              <label className="block text-xs font-medium text-foreground mb-1">Count</label>
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

      {/* Heat Settings */}
      <div className="flex gap-4 p-4 bg-muted/50 border border-border rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={heated}
            onChange={(e) => {
              setHeated(e.target.checked);
              if (!e.target.checked) setSuperheated(false);
            }}
            className="w-4 h-4"
          />
          <span className="text-sm text-foreground">▲ Heated</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={superheated}
            onChange={(e) => {
              setSuperheated(e.target.checked);
              if (e.target.checked) setHeated(true);
            }}
            className="w-4 h-4"
          />
          <span className="text-sm text-foreground">▲▲ Superheated</span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={() => {
            setRecipeId('');
            setInputs([null, null, null, null]);
            setOutput(null);
            setOutputCount(1);
            setHeated(false);
            setSuperheated(false);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!recipeId || inputs.every(i => i === null) || !output}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Recipe
        </button>
      </div>

      {showItemPicker && (
        <ItemPicker
          instancePath={instancePath}
          onSelect={handleItemSelected}
          onClose={() => {
            setShowItemPicker(false);
            setPickingSlot(null);
          }}
          selectedItem={
            pickingSlot === 'output' ? output?.id :
            typeof pickingSlot === 'number' ? inputs[pickingSlot]?.id : undefined
          }
          title={pickingSlot === 'output' ? 'Select Output Item' : 'Select Input Item'}
        />
      )}
    </div>
  );
};
