import React, { useState } from "react";
import { ItemSlot } from "./ItemSlot";
import { ItemSelector } from "./ItemSelector";

interface ResultItem {
  item: string;
  count: number;
}

interface ThermalSmelterEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

export const ThermalSmelterEditor: React.FC<ThermalSmelterEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe,
}) => {
  const [ingredients, setIngredients] = useState<string[]>(initialRecipe?.ingredients || ["", ""]);
  const [result, setResult] = useState<ResultItem[]>(
    initialRecipe?.result || [{ item: "", count: 1 }]
  );
  const [energy, setEnergy] = useState(initialRecipe?.energy || 4000);

  const [showIngredientSelector, setShowIngredientSelector] = useState<number | null>(null);
  const [showResultSelector, setShowResultSelector] = useState<number | null>(null);

  const handleSave = () => {
    onSave({
      type: "thermal:smelter",
      ingredients: ingredients.filter((i: string) => i),
      result: result.filter((r: ResultItem) => r.item),
      energy,
    });
  };

  return (
    <div className="space-y-4">
      <div className="bg-secondary rounded-lg p-4 border border-border">
        <h3 className="text-lg font-medium text-foreground mb-4">Ingredients (Max 2)</h3>
        <div className="flex gap-4">
          {ingredients.map((ingredient, index) => (
            <ItemSlot
              key={index}
              item={ingredient}
              onClick={() => setShowIngredientSelector(index)}
              onClear={() => {
                const newIngredients = [...ingredients];
                newIngredients[index] = "";
                setIngredients(newIngredients);
              }}
              size="lg"
            />
          ))}
        </div>
      </div>

      <div className="bg-secondary rounded-lg p-4 border border-border">
        <h3 className="text-lg font-medium text-foreground mb-4">Results</h3>
        <div className="space-y-2">
          {result.map((r, index) => (
            <div key={index} className="flex gap-4 items-center">
              <ItemSlot
                item={r.item}
                count={r.count}
                onClick={() => setShowResultSelector(index)}
                onClear={() => {
                  const newResult = [...result];
                  newResult[index].item = "";
                  setResult(newResult);
                }}
                onCountChange={(count) => {
                  const newResult = [...result];
                  newResult[index].count = count;
                  setResult(newResult);
                }}
                allowCount={true}
                size="lg"
              />
              {result.length > 1 && (
                <button
                  onClick={() => setResult(result.filter((_, i) => i !== index))}
                  className="px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-destructive rounded"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          {result.length < 4 && (
            <button
              onClick={() => setResult([...result, { item: "", count: 1 }])}
              className="w-full bg-accent hover:bg-accent/80 text-muted-foreground py-2 px-4 rounded"
            >
              Add Result
            </button>
          )}
        </div>
      </div>

      <div className="bg-secondary rounded-lg p-4 border border-border">
        <label className="block text-sm font-medium text-muted-foreground mb-2">Energy (RF)</label>
        <input
          type="number"
          value={energy}
          onChange={(e) => setEnergy(Number(e.target.value))}
          min="0"
          className="w-full bg-background border border-border rounded px-3 py-2 text-foreground"
        />
      </div>

      {/* Code Preview */}
      {ingredients.some((i) => i) && result.some((r) => r.item) && (
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{"</>"}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-border overflow-x-auto">
            {`event.recipes.thermal.smelter([
${result
  .filter((r: ResultItem) => r.item)
  .map((r: ResultItem) => `  '${r.item}'${r.count > 1 ? ` * ${r.count}` : ""}`)
  .join(",\n")}
], [
${ingredients
  .filter((i: string) => i)
  .map((ing: string) => `  '${ing}'`)
  .join(",\n")}
])${energy !== 4000 ? `.energy(${energy})` : ""}`}
          </pre>
        </div>
      )}

      <button
        onClick={handleSave}
        className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2 px-4 rounded"
      >
        Save Recipe
      </button>

      {/* Ingredient Selector Modals */}
      {showIngredientSelector !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Select Ingredient {showIngredientSelector + 1}
              </h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <ItemSelector
                instancePath={instancePath}
                onSelect={(item) => {
                  const newIngredients = [...ingredients];
                  newIngredients[showIngredientSelector] = item.id;
                  setIngredients(newIngredients);
                  setShowIngredientSelector(null);
                }}
              />
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={() => setShowIngredientSelector(null)}
                className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Selector Modals */}
      {showResultSelector !== null && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">
                Select Result {showResultSelector + 1}
              </h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <ItemSelector
                instancePath={instancePath}
                onSelect={(item) => {
                  const newResult = [...result];
                  newResult[showResultSelector].item = item.id;
                  setResult(newResult);
                  setShowResultSelector(null);
                }}
              />
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={() => setShowResultSelector(null)}
                className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
