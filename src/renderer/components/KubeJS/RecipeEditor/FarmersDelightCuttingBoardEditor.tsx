import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { ItemPicker } from "../ItemPicker/ItemPicker";

interface Item {
  id: string;
  name: string;
  modId: string;
  texture?: string;
  count?: number;
}

interface FarmersDelightCuttingBoardEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

export const FarmersDelightCuttingBoardEditor: React.FC<FarmersDelightCuttingBoardEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe,
}) => {
  const [ingredient, setIngredient] = useState<Item | null>(null);
  const [tool, setTool] = useState("");
  const [results, setResults] = useState<Item[]>([]);
  const [sound, setSound] = useState("minecraft:block.wood.break");
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingType, setPickingType] = useState<"ingredient" | "result" | null>(null);

  React.useEffect(() => {
    const parseAndLoadItems = async () => {
      if (!initialRecipe?.raw) return;

      const raw = initialRecipe.raw;
      console.log("Parsing raw recipe:", raw);

      // Extract parameters by finding the content between cutting( and matching )
      const cuttingStart = raw.indexOf("cutting(");
      if (cuttingStart === -1) return;

      const afterCutting = raw.substring(cuttingStart + 8); // 8 = 'cutting('.length

      // Find the matching closing parenthesis
      let depth = 1;
      let endIndex = -1;
      for (let i = 0; i < afterCutting.length; i++) {
        if (afterCutting[i] === "(") depth++;
        if (afterCutting[i] === ")") {
          depth--;
          if (depth === 0) {
            endIndex = i;
            break;
          }
        }
      }

      if (endIndex === -1) return;
      const paramsStr = afterCutting.substring(0, endIndex);

      // Split by commas, but not within quotes or parentheses
      const params: string[] = [];
      let current = "";
      let inQuotes = false;
      let quoteChar = "";
      let parenDepth = 0;

      for (let i = 0; i < paramsStr.length; i++) {
        const char = paramsStr[i];
        const prevChar = i > 0 ? paramsStr[i - 1] : "";

        if ((char === '"' || char === "'") && prevChar !== "\\") {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = char;
          } else if (char === quoteChar) {
            inQuotes = false;
          }
        }

        if (!inQuotes) {
          if (char === "(" || char === "[") parenDepth++;
          if (char === ")" || char === "]") parenDepth--;
        }

        if (char === "," && !inQuotes && parenDepth === 0) {
          params.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      if (current.trim()) params.push(current.trim());

      console.log("All parsed params:", params);
      console.log("Third param (results):", params[2]);

      if (params.length < 3) return;

      const ingredientId = params[0].replace(/['"]/g, "");
      const toolTag = params[1].replace(/['"]/g, "");
      const resultsStr = params[2];

      setTool(toolTag);

      // Load ingredient with texture
      let loadedIngredient: Item | null = null;
      try {
        console.log("Looking up ingredient:", ingredientId);
        const ingResult = await window.api.itemRegistryGetItemById(instancePath, ingredientId);
        console.log("Ingredient lookup result:", ingResult);
        if (ingResult.success && ingResult.data) {
          console.log("Setting ingredient with texture:", ingResult.data);
          loadedIngredient = {
            id: ingResult.data.id,
            name: ingResult.data.name,
            modId: ingResult.data.modId,
            texture: ingResult.data.texture,
            count: 1,
          };
          setIngredient(loadedIngredient);
        } else {
          console.log("Item not found in registry, using fallback for:", ingredientId);
          loadedIngredient = {
            id: ingredientId,
            name: ingredientId.split(":")[1] || ingredientId,
            modId: ingredientId.split(":")[0] || "minecraft",
            count: 1,
          };
          setIngredient(loadedIngredient);
        }
      } catch (error) {
        console.error("Failed to load ingredient:", error);
      }

      // Parse and load results
      const loadedResults: Item[] = [];

      // Try to match Item.of with count (handle multiline)
      const itemOfMatch = resultsStr.match(/Item\.of\(\s*['"]([^'"]+)['"]\s*,\s*(\d+)\s*\)/);

      console.log("Results string:", resultsStr);
      console.log("Item.of match:", itemOfMatch);

      const resultIds: Array<{ id: string; count: number }> = [];

      if (itemOfMatch) {
        const parsed = { id: itemOfMatch[1], count: parseInt(itemOfMatch[2]) };
        console.log("Parsed result with count:", parsed);
        resultIds.push(parsed);
      } else {
        // Try simple string match
        const simpleMatch = resultsStr.match(/['"]([^'"]+)['"]/);
        if (simpleMatch) {
          console.log("Simple match found:", simpleMatch[1]);
          resultIds.push({ id: simpleMatch[1], count: 1 });
        }
      }

      console.log("Final result IDs to load:", resultIds);

      for (const { id, count } of resultIds) {
        try {
          const result = await window.api.itemRegistryGetItemById(instancePath, id);
          if (result.success && result.data) {
            loadedResults.push({
              id: result.data.id,
              name: result.data.name,
              modId: result.data.modId,
              texture: result.data.texture,
              count,
            });
          } else {
            loadedResults.push({
              name: id.split(":")[1] || id,
              modId: id.split(":")[0] || "minecraft",
              count,
              id: "",
            });
          }
        } catch (error) {
          console.error("Failed to load result item:", error);
        }
      }

      setIngredient(loadedIngredient);
      setResults(loadedResults);
      // Tool and sound are already set above
      console.log("Loaded items with textures:", {
        loadedIngredient,
        loadedResults,
        tool: toolTag,
        sound: "minecraft:block.wood.break",
      });
    };

    parseAndLoadItems();
  }, [initialRecipe, instancePath]);

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
          name: itemId.split(":")[1] || itemId,
          modId: itemId.split(":")[0] || "minecraft",
          count: 1,
        };
      }

      if (pickingType === "ingredient") {
        setIngredient(item);
      } else if (pickingType === "result") {
        setResults([...results, item]);
      }
      setShowItemPicker(false);
      setPickingType(null);
    } catch (error) {
      console.error("Failed to fetch item data:", error);
    }
  };

  const removeResult = (index: number) => {
    setResults(results.filter((_, i) => i !== index));
  };

  const updateResultCount = (index: number, count: number) => {
    const newResults = [...results];
    newResults[index].count = count;
    setResults(newResults);
  };

  const handleSave = () => {
    onSave({
      type: "farmersdelight:cutting",
      ingredients: ingredient ? [ingredient.id] : [],
      tool: { tag: tool },
      result: results.map((r) => ({ item: r.id, count: r.count || 1 })),
      sound,
    });
  };

  const commonTools = ["forge:tools/knives", "forge:tools/axes", "forge:tools"];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] gap-6 items-center">
        {/* Ingredient */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Ingredient</h3>
          <div className="bg-muted/50 border border-primary/20 rounded-lg p-4">
            <div
              onClick={() => {
                setPickingType("ingredient");
                setShowItemPicker(true);
              }}
              className="relative w-20 h-20 bg-secondary border-2 border-primary/30 rounded cursor-pointer hover:border-primary transition-colors group mx-auto"
            >
              {ingredient ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    {ingredient.texture ? (
                      <img
                        src={`data:image/png;base64,${ingredient.texture}`}
                        alt={ingredient.name}
                        className="w-full h-full object-contain pixelated"
                      />
                    ) : (
                      <div className="text-xs text-center text-muted-foreground">
                        {ingredient.name}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIngredient(null);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  {/* Tooltip */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-primary/20">
                      <div className="font-medium">{ingredient.name}</div>
                      <div className="text-muted-foreground">{ingredient.id}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Plus className="w-8 h-8 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Item to cut</p>
        </div>

        {/* Plus */}
        <div className="text-3xl text-muted-foreground">+</div>

        {/* Tool Selection */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Tool Required</h3>
          <div className="bg-muted/50 border border-primary/20 rounded-lg p-4">
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              className="w-full px-3 py-2 bg-secondary border border-primary/20 rounded text-sm text-foreground focus:outline-none focus:border-primary"
            >
              <option value="">Select tool...</option>
              <option value="#forge:tools/knives">Knife</option>
              <option value="#forge:tools/axes">Axe</option>
              <option value="#forge:tools/pickaxes">Pickaxe</option>
              <option value="#forge:tools/shovels">Shovel</option>
              <option value="#forge:tools/hoes">Hoe</option>
              <option value="#forge:tools/shears">Shears</option>
            </select>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Tool to use</p>
        </div>

        {/* Arrow */}
        <div className="text-4xl text-primary">→</div>

        {/* Results */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Results (Max 4)</h3>
          <div className="bg-muted/50 border border-primary/20 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-2">
              {results.map((result, index) => (
                <div key={index} className="relative">
                  <div className="relative w-16 h-16 bg-secondary border-2 border-primary/30 rounded group mx-auto">
                    <div className="absolute inset-0 flex items-center justify-center p-2">
                      {result.texture ? (
                        <img
                          src={`data:image/png;base64,${result.texture}`}
                          alt={result.name}
                          className="w-full h-full object-contain pixelated"
                        />
                      ) : (
                        <div className="text-xs text-center text-muted-foreground">
                          {result.name}
                        </div>
                      )}
                    </div>
                    {result.count && result.count > 1 && (
                      <div className="absolute bottom-1 right-1 bg-background text-foreground text-xs font-bold px-1.5 py-0.5 rounded shadow-lg border border-primary/20">
                        {result.count}
                      </div>
                    )}
                    <button
                      onClick={() => removeResult(index)}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                      <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-primary/20">
                        <div className="font-medium">{result.name}</div>
                        <div className="text-muted-foreground">{result.id}</div>
                      </div>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={result.count || 1}
                    onChange={(e) => updateResultCount(index, parseInt(e.target.value) || 1)}
                    min="1"
                    className="w-16 mt-1 mx-auto block px-2 py-1 bg-secondary border border-primary/20 rounded text-xs text-center text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              ))}
              {results.length < 4 && (
                <div
                  onClick={() => {
                    setPickingType("result");
                    setShowItemPicker(true);
                  }}
                  className="relative w-16 h-16 bg-secondary border-2 border-dashed border-primary/20 rounded cursor-pointer hover:border-primary transition-colors group mx-auto"
                >
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Plus className="w-6 h-6 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                  </div>
                </div>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">Click + to add</p>
        </div>
      </div>

      {/* Sound Setting */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Sound Effect (Optional)
        </label>
        <input
          type="text"
          value={sound}
          onChange={(e) => setSound(e.target.value)}
          placeholder="minecraft:block.wood.break"
          className="w-full px-3 py-2 bg-secondary border border-primary/20 rounded text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
        />
        <p className="text-xs text-muted-foreground mt-1">Sound to play when cutting</p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/20">
        <button
          onClick={() => {
            setIngredient(null);
            setTool("");
            setResults([]);
            setSound("minecraft:block.wood.break");
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-primary/20 rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!ingredient || !tool || results.length === 0}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Recipe
        </button>
      </div>

      {/* Code Preview */}
      {ingredient && tool && results.length > 0 && (
        <div className="bg-muted/30 border border-primary/20 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{"</>"}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-primary/20 overflow-x-auto">
            {`event.recipes.farmersdelight.cutting('${ingredient.id}', [
${results.map((r) => `  '${r.id}'${(r.count ?? 1) > 1 ? ` * ${r.count}` : ""}`).join(",\n")}
], '${tool}')${sound !== "minecraft:block.wood.break" ? `.sound('${sound}')` : ""}`}
          </pre>
        </div>
      )}

      {showItemPicker && (
        <ItemPicker
          instancePath={instancePath}
          onSelect={handleItemSelected}
          onClose={() => {
            setShowItemPicker(false);
            setPickingType(null);
          }}
        />
      )}
    </div>
  );
};
