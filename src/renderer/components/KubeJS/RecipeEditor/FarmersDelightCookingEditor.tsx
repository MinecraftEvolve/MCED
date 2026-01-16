import React, { useState } from 'react';
import { ItemSlot } from './ItemSlot';
import { ItemPicker } from '../ItemPicker/ItemPicker';

interface FarmersDelightCookingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

const FarmersDelightCookingEditor: React.FC<FarmersDelightCookingEditorProps> = ({ instancePath, onSave, initialRecipe }) => {
  const [ingredients, setIngredients] = useState<(string | null)[]>(
    initialRecipe?.ingredients || [null, null, null, null, null, null]
  );
  const [output, setOutput] = useState<string | null>(initialRecipe?.output || null);
  const [outputCount, setOutputCount] = useState(initialRecipe?.outputCount || 1);
  const [container, setContainer] = useState(initialRecipe?.container || 'minecraft:bowl');
  const [experience, setExperience] = useState(initialRecipe?.experience || 0);
  const [cookTime, setCookTime] = useState(initialRecipe?.cookTime || 200);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<number | 'output' | null>(null);

  const handleIngredientChange = (index: number, value: string | null) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = value;
    setIngredients(newIngredients);
  };

  const handleSave = () => {
    const validIngredients = ingredients.filter(i => i);
    if (validIngredients.length === 0 || !output) {
      alert('Please provide at least one ingredient and an output');
      return;
    }

    const recipe = {
      type: 'farmersdelight:cooking',
      ingredients: validIngredients.map(i => ({ item: i })),
      result: { item: output, count: outputCount },
      container: { item: container },
      experience,
      cookingtime: cookTime
    };

    onSave(recipe);
  };

  const handleItemSelected = (item: string) => {
    if (pickingSlot === 'output') {
      setOutput(item);
    } else if (typeof pickingSlot === 'number') {
      handleIngredientChange(pickingSlot, item);
    }
    setShowItemPicker(false);
    setPickingSlot(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Ingredients */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Ingredients (Max 6)</h3>
          <div className="inline-block bg-muted/50 border border-border rounded-lg p-4">
            <div className="grid grid-cols-3 gap-3">
              {ingredients.map((ingredient, index) => (
                <ItemSlot
                  key={index}
                  item={ingredient}
                  onClick={() => {
                    setPickingSlot(index);
                    setShowItemPicker(true);
                  }}
                  onClear={() => handleIngredientChange(index, null)}
                  size="md"
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Add up to 6 ingredients</p>
        </div>

        {/* Output */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Output Item</h3>
          <div className="inline-block bg-muted/50 border border-border rounded-lg p-4">
            <ItemSlot
              item={output}
              count={outputCount}
              onClick={() => {
                setPickingSlot('output');
                setShowItemPicker(true);
              }}
              onCountChange={setOutputCount}
              allowCount={true}
              size="lg"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Cooked meal</p>
        </div>
      </div>

      {/* Settings */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">Recipe Settings</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Container Item</label>
            <input
              type="text"
              value={container}
              onChange={(e) => setContainer(e.target.value)}
              placeholder="minecraft:bowl"
              className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">Bowl or container</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Experience Reward</label>
            <input
              type="number"
              value={experience}
              onChange={(e) => setExperience(parseFloat(e.target.value))}
              step={0.1}
              min={0}
              className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-2">Cook Time (ticks)</label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(parseInt(e.target.value))}
              min={1}
              className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:border-primary"
            />
            <p className="text-xs text-muted-foreground mt-1">200 = 10 seconds</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={() => {
            setIngredients([null, null, null, null, null, null]);
            setOutput(null);
            setOutputCount(1);
            setContainer('minecraft:bowl');
            setExperience(0);
            setCookTime(200);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!output || ingredients.every(i => !i)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Recipe
        </button>
      </div>

      {/* Code Preview */}
      {output && ingredients.some(i => i) && (
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{'</>'}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-border overflow-x-auto">
{`event.recipes.farmersdelight.cooking([
${ingredients.filter(i => i).map(ing => `  '${ing}'`).join(',\n')}
], '${output}'${outputCount > 1 ? ` * ${outputCount}` : ''}, '${container}', ${experience}, ${cookTime})`}
          </pre>
        </div>
      )}

      {/* Item Picker Modal */}
      {showItemPicker && (
        <ItemPicker
          instancePath={instancePath}
          onSelect={handleItemSelected}
          onClose={() => {
            setShowItemPicker(false);
            setPickingSlot(null);
          }}
          title={pickingSlot === 'output' ? 'Select Output Item' : `Select Ingredient ${typeof pickingSlot === 'number' ? pickingSlot + 1 : ''}`}
        />
      )}
    </div>
  );
};

export default FarmersDelightCookingEditor;
