import React, { useState } from "react";
import { ArrowRight, Plus, X } from "lucide-react";
import { ItemPicker } from "../ItemPicker/ItemPicker";
import { ItemSlot } from "./ItemSlot";

interface Item {
  id: string;
  name: string;
  modId: string;
  texture?: string;
  count?: number;
  chance?: number;
}

interface CreateMillingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

export const CreateMillingEditor: React.FC<CreateMillingEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe,
}) => {
  const [input, setInput] = useState<Item | null>(null);
  const [outputs, setOutputs] = useState<(Item | null)[]>([null, null, null]);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<"input" | number | null>(null);

  // Load item data from registry
  const loadItemData = async (itemId: string, additionalData?: Partial<Item>): Promise<Item> => {
    try {
      const result = await window.api.itemRegistryGetItemById(instancePath, itemId);
      if (result.success && result.data) {
        return {
          id: result.data.id,
          name: result.data.name,
          modId: result.data.modId,
          texture: result.data.texture,
          count: additionalData?.count || 1,
          chance: additionalData?.chance || 1.0,
        };
      }
    } catch (error) {
      console.error("Failed to load item data:", error);
    }
    // Fallback
    return {
      id: itemId,
      name: itemId.split(":")[1] || itemId,
      modId: itemId.split(":")[0] || "minecraft",
      count: additionalData?.count || 1,
      chance: additionalData?.chance || 1.0,
    };
  };

  // Initialize from parsed recipe
  React.useEffect(() => {
    if (initialRecipe) {
      // Load input
      if (initialRecipe.ingredients?.[0]) {
        const ing = initialRecipe.ingredients[0];
        const itemId = ing.item || ing;
        loadItemData(itemId).then(setInput);
      }

      // Load outputs
      if (initialRecipe.results) {
        Promise.all(
          initialRecipe.results.slice(0, 3).map((res: any) => {
            const itemId = res.item || res;
            return loadItemData(itemId, { count: res.count, chance: res.chance });
          })
        ).then((loadedOutputs) => {
          const newOutputs: (Item | null)[] = [...loadedOutputs];
          while (newOutputs.length < 3) newOutputs.push(null);
          setOutputs(newOutputs);
        });
      }
    }
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
          chance: 1.0,
        };
      } else {
        item = {
          id: itemId,
          name: itemId.split(":")[1] || itemId,
          modId: itemId.split(":")[0] || "minecraft",
          count: 1,
          chance: 1.0,
        };
      }

      if (pickingSlot === "input") {
        setInput(item);
      } else if (typeof pickingSlot === "number") {
        const newOutputs = [...outputs];
        newOutputs[pickingSlot] = item;
        setOutputs(newOutputs);
      }

      setShowItemPicker(false);
      setPickingSlot(null);
    } catch (error) {
      console.error("Failed to fetch item data:", error);
    }
  };

  const updateOutput = (index: number, field: "count" | "chance", value: number) => {
    const newOutputs = [...outputs];
    if (newOutputs[index]) {
      newOutputs[index] = { ...newOutputs[index]!, [field]: value };
      setOutputs(newOutputs);
    }
  };

  const handleSave = () => {
    if (!input) {
      alert("Please provide input item");
      return;
    }

    const validOutputs = outputs.filter((o) => o !== null) as Item[];
    if (validOutputs.length === 0) {
      alert("Please add at least one output");
      return;
    }

    const recipe = {
      type: "create:Milling",
      ingredients: [{ item: input.id }],
      results: validOutputs.map((o) => ({
        item: o.id,
        count: o.count || 1,
        ...(o.chance && o.chance < 1 ? { chance: o.chance } : {}),
      })),
    };

    onSave(recipe);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[auto,auto,1fr] gap-8 items-start">
        {/* Input */}
        <div className="text-center pt-10">
          <p className="text-xs font-medium text-foreground mb-2">Input</p>
          <ItemSlot
            item={input}
            size="large"
            onClick={() => {
              setPickingSlot("input");
              setShowItemPicker(true);
            }}
            onClear={() => setInput(null)}
          />
        </div>

        <div className="pt-16">
          <ArrowRight className="w-8 h-8 text-primary" />
        </div>

        {/* Outputs */}
        <div>
          <p className="text-sm font-medium text-foreground mb-3">Outputs (with chances)</p>
          <div className="space-y-3">
            {outputs.map((output, index) => (
              <div key={index} className="flex items-center gap-3">
                <ItemSlot
                  item={output}
                  size="normal"
                  onClick={() => {
                    setPickingSlot(index);
                    setShowItemPicker(true);
                  }}
                  onClear={() => {
                    const newOutputs = [...outputs];
                    newOutputs[index] = null;
                    setOutputs(newOutputs);
                  }}
                  showCount={true}
                  showChance={true}
                />
                {output && (
                  <div className="flex gap-2">
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Count
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="64"
                        value={output.count || 1}
                        onChange={(e) =>
                          updateOutput(
                            index,
                            "count",
                            Math.max(1, Math.min(64, parseInt(e.target.value) || 1))
                          )
                        }
                        className="w-16 px-2 py-1 bg-secondary border border-primary/20 rounded text-sm text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-foreground mb-1">
                        Chance %
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={Math.round((output.chance || 1) * 100)}
                        onChange={(e) =>
                          updateOutput(
                            index,
                            "chance",
                            Math.max(0, Math.min(100, parseInt(e.target.value) || 100)) / 100
                          )
                        }
                        className="w-16 px-2 py-1 bg-secondary border border-primary/20 rounded text-sm text-foreground focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/20">
        <button
          onClick={() => {
            setInput(null);
            setOutputs([null, null, null]);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-primary/20 rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!input || outputs.every((o) => o === null)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Recipe
        </button>
      </div>

      {/* Code Preview */}
      {input && outputs.some((o) => o !== null) && (
        <div className="bg-muted/30 border border-primary/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{"</>"}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-primary/20 overflow-x-auto">
            {`event.recipes.create.milling([
${outputs
  .filter((o) => o !== null)
  .map(
    (output) =>
      `  ${output!.chance! < 1 ? `Item.of('${output!.id}')${(output!.count || 1) > 1 ? `.withCount(${output!.count})` : ""}.withChance(${output!.chance})` : `'${output!.id}'${(output!.count || 1) > 1 ? ` * ${output!.count}` : ""}`}`
  )
  .join(",\n")}
], '${input.id}')`}
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
            pickingSlot === "input"
              ? input?.id
              : typeof pickingSlot === "number"
                ? outputs[pickingSlot]?.id
                : undefined
          }
          title={pickingSlot === "input" ? "Select Input Item" : "Select Output Item"}
        />
      )}
    </div>
  );
};
