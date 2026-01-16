import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { ItemPicker } from '../ItemPicker/ItemPicker';
import { ItemSlot } from './ItemSlot';
import { TagDisplay } from './TagDisplay';

interface Item {
  id: string;
  name: string;
  modId: string;
  texture?: string;
  count?: number;
}

interface CreateDeployingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  onCancel: () => void;
  initialRecipe?: any;
}

export const CreateDeployingEditor: React.FC<CreateDeployingEditorProps> = ({
  instancePath,
  onSave,
  onCancel,
  initialRecipe
}) => {
  const [baseItem, setBaseItem] = useState<Item | null>(null); // Item on the belt
  const [deployedItem, setDeployedItem] = useState<Item | null>(null); // Item being deployed
  const [output, setOutput] = useState<Item | null>(null);
  const [outputCount, setOutputCount] = useState(1);
  const [keepHeldItem, setKeepHeldItem] = useState(false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<'base' | 'deployed' | 'output' | null>(null);

  useEffect(() => {
    if (initialRecipe?.raw) {
      parseAndLoadItems();
    }
  }, [initialRecipe?.raw]);

  const parseAndLoadItems = async () => {
    if (!initialRecipe?.raw) return;

    console.log('Parsing deploying recipe:', initialRecipe.raw);

    // Parse: event.recipes.create.deploying("output", ["ingredient", "tool"])
    const match = initialRecipe.raw.match(/event\.recipes\.create\.deploying\s*\(\s*["']([^"']+)["']\s*,\s*\[(.*?)\]/s);
    
    console.log('Match result:', match);
    
    if (match) {
      const outputId = match[1];
      const ingredientsStr = match[2];
      
      console.log('Output ID:', outputId);
      console.log('Ingredients string:', ingredientsStr);
      
      // Parse output count
      let count = 1;
      const outputMatch = initialRecipe.raw.match(/Item\.of\s*\(\s*["']([^"']+)["']\s*,\s*(\d+)\s*\)/);
      if (outputMatch && outputMatch[1] === outputId) {
        count = parseInt(outputMatch[2]);
      }
      setOutputCount(count);

      // Parse ingredients array
      const ingredientMatches = ingredientsStr.match(/["']([^"']+)["']/g);
      console.log('Ingredient matches:', ingredientMatches);
      
      if (ingredientMatches && ingredientMatches.length >= 2) {
        const baseItemId = ingredientMatches[0].replace(/["']/g, '');
        const deployedItemId = ingredientMatches[1].replace(/["']/g, '');
        
        console.log('Parsed base item ID:', baseItemId);
        console.log('Parsed deployed item ID:', deployedItemId);

        // Load items
        try {
          const baseResult = await window.api.itemRegistryGetItemById(instancePath, baseItemId);
          const outputResult = await window.api.itemRegistryGetItemById(instancePath, outputId);

          if (baseResult.success && baseResult.data) {
            setBaseItem({
              id: baseResult.data.id,
              name: baseResult.data.name,
              modId: baseResult.data.modId,
              texture: baseResult.data.texture
            });
          }

          // Check if deployed item is a tag
          if (deployedItemId.startsWith('#')) {
            setDeployedItem({
              id: deployedItemId,
              name: deployedItemId.replace('#', ''),
              modId: 'tag',
              texture: undefined
            });
          } else {
            const deployedResult = await window.api.itemRegistryGetItemById(instancePath, deployedItemId);
            if (deployedResult.success && deployedResult.data) {
              setDeployedItem({
                id: deployedResult.data.id,
                name: deployedResult.data.name,
                modId: deployedResult.data.modId,
                texture: deployedResult.data.texture
              });
            }
          }

          if (outputResult.success && outputResult.data) {
            setOutput({
              id: outputResult.data.id,
              name: outputResult.data.name,
              modId: outputResult.data.modId,
              texture: outputResult.data.texture
            });
          }
        } catch (error) {
          console.error('Failed to load items:', error);
        }
      }
    }
  };

  const handleSlotClick = (slot: 'base' | 'deployed' | 'output') => {
    setPickingSlot(slot);
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
        };
      } else {
        item = {
          id: itemId,
          name: itemId.split(':')[1] || itemId,
          modId: itemId.split(':')[0] || 'minecraft',
        };
      }
      
      if (pickingSlot === 'base') setBaseItem(item);
      else if (pickingSlot === 'deployed') setDeployedItem(item);
      else if (pickingSlot === 'output') setOutput(item);
      
      setShowItemPicker(false);
      setPickingSlot(null);
    } catch (error) {
      console.error('Failed to fetch item data:', error);
    }
  };

  const handleSave = () => {
    if (!baseItem || !deployedItem || !output) {
      alert('Please provide select all items');
      return;
    }

    const recipe = {
      type: 'create:deploying',
      ingredients: [
        { item: baseItem.id },
        { item: deployedItem.id }
      ],
      results: [{ item: output.id, count: outputCount }]
    };

    onSave(recipe);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-6">
        {/* Base Item */}
        <div className="text-center">
          <p className="text-xs font-medium text-foreground mb-2">Base Item (on belt/depot)</p>
          <ItemSlot
            item={baseItem}
            size="normal"
            onClick={() => handleSlotClick('base')}
            onClear={() => setBaseItem(null)}
          />
        </div>

        <span className="text-2xl text-muted-foreground mt-6">+</span>

        {/* Deployed Item */}
        <div className="text-center">
          <p className="text-xs font-medium text-foreground mb-2">Deployed Item (from deployer)</p>
          {deployedItem?.id.startsWith('#') ? (
            <TagDisplay
              tag={deployedItem.id}
              instancePath={instancePath}
              size={64}
              onClick={() => handleSlotClick('deployed')}
            />
          ) : (
            <ItemSlot
              item={deployedItem}
              size="normal"
              onClick={() => handleSlotClick('deployed')}
              onClear={() => setDeployedItem(null)}
            />
          )}
        </div>

        <ArrowRight className="w-6 h-6 text-primary mt-6" />

        {/* Output */}
        <div className="text-center">
          <p className="text-xs font-medium text-foreground mb-2">Output</p>
          <ItemSlot
            item={output ? { ...output, count: outputCount } : null}
            size="large"
            onClick={() => handleSlotClick('output')}
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

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={() => {
            setBaseItem(null);
            setDeployedItem(null);
            setOutput(null);
            setOutputCount(1);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!baseItem || !deployedItem || !output}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Recipe
        </button>
      </div>

      {/* Code Preview */}
      {baseItem && deployedItem && output && (
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{'</>'}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-border overflow-x-auto">
{`event.recipes.create.deploying('${output.id}'${outputCount > 1 ? ` * ${outputCount}` : ''}, [
  '${baseItem.id}',
  '${deployedItem.id}'
])${keepHeldItem ? `.keepHeldItem()` : ''}`}
          </pre>
        </div>
      )}

      {showItemPicker && (
        <ItemPicker
          instancePath={instancePath}
          onSelect={handleItemSelected}
          onClose={() => {
            setShowItemPicker(false);
            setPickingSlot(null);
          }}
          selectedItem={
            pickingSlot === 'base' ? baseItem?.id :
            pickingSlot === 'deployed' ? deployedItem?.id :
            pickingSlot === 'output' ? output?.id : undefined
          }
          title={
            pickingSlot === 'base' ? 'Select Base Item' :
            pickingSlot === 'deployed' ? 'Select Deployed Item' :
            'Select Output Item'
          }
        />
      )}
    </div>
  );
};
