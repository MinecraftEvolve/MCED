import React, { useState } from "react";
import { Package, Plus, X } from "lucide-react";
import { ItemPicker } from "../ItemPicker/ItemPicker";

interface Item {
  id: string;
  name: string;
  modId: string;
  texture?: string;
  count?: number;
}

interface StonecuttingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

export const StonecuttingEditor: React.FC<StonecuttingEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe,
}) => {
  const [input, setInput] = useState<Item | null>(null);
  const [output, setOutput] = useState<Item | null>(null);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingType, setPickingType] = useState<"input" | "output" | null>(null);

  const handleInputSlotClick = () => {
    setPickingType("input");
    setShowItemPicker(true);
  };

  const handleOutputSlotClick = () => {
    setPickingType("output");
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
          name: itemId.split(":")[1] || itemId,
          modId: itemId.split(":")[0] || "minecraft",
          count: 1,
        };
      }

      if (pickingType === "output") {
        setOutput(item);
      } else if (pickingType === "input") {
        setInput(item);
      }
      setShowItemPicker(false);
      setPickingType(null);
    } catch (error) {
      console.error("Failed to fetch item data:", error);
    }
  };

  const handleSave = () => {
    if (!input || !output) {
      alert("Please provide input item, and output item");
      return;
    }

    const recipe = {
      type: "minecraft:stonecutting",
      ingredient: { item: input.id },
      result: output.id,
      count: output.count || 1,
    };

    onSave(recipe);
  };

  return (
    <div className="space-y-6">
      {/* Recipe Type Header */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Stonecutter Recipe</h3>
            <p className="text-sm text-muted-foreground">Cut stone blocks into different shapes</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Input */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Input</h3>
          <div className="inline-block bg-muted/50 border border-border rounded-lg p-4">
            <div
              onClick={handleInputSlotClick}
              className="relative w-20 h-20 bg-secondary border-2 border-border rounded cursor-pointer hover:border-primary transition-colors group"
            >
              {input ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    {input.texture ? (
                      <img
                        src={
                          input.texture.startsWith("data:")
                            ? input.texture
                            : `data:image/png;base64,${input.texture}`
                        }
                        alt={input.name}
                        className="w-full h-full object-contain pixelated"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInput(null);
                    }}
                    className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <X className="w-3 h-3" />
                  </button>
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                    <div className="bg-popover text-popover-foreground text-xs rounded px-2 py-1 whitespace-nowrap shadow-lg border border-border">
                      <div className="font-medium">{input.name}</div>
                      <div className="text-muted-foreground">{input.id}</div>
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
        </div>

        {/* Process Visual */}
        <div className="flex items-center justify-center">
          <div className="text-4xl">→</div>
        </div>

        {/* Output */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Output</h3>
          <div className="inline-block bg-muted/50 border border-border rounded-lg p-4">
            <div
              onClick={handleOutputSlotClick}
              className="relative w-20 h-20 bg-secondary border-2 border-border rounded cursor-pointer hover:border-primary transition-colors group"
            >
              {output ? (
                <>
                  <div className="absolute inset-0 flex items-center justify-center p-2">
                    {output.texture ? (
                      <img
                        src={
                          output.texture.startsWith("data:")
                            ? output.texture
                            : `data:image/png;base64,${output.texture}`
                        }
                        alt={output.name}
                        className="w-full h-full object-contain pixelated"
                      />
                    ) : (
                      <Package className="w-10 h-10 text-muted-foreground" />
                    )}
                  </div>
                  {output.count && output.count > 1 && (
                    <div className="absolute bottom-1 right-1 bg-background/90 text-white text-xs px-1 rounded">
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
                  max="64"
                  value={output.count || 1}
                  onChange={(e) => setOutput({ ...output, count: parseInt(e.target.value) || 1 })}
                  className="w-full px-2 py-1 bg-secondary border border-border rounded text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={() => {
            setInput(null);
            setOutput(null);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!input || !output}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Recipe
        </button>
      </div>

      {/* Code Preview */}
      {input && output && (
        <div className="bg-muted/30 border border-border rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{"</>"}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-border overflow-x-auto">
            {`event.stonecutting('${output.id}'${output.count && output.count > 1 ? ` * ${output.count}` : ""}, '${input.id}')`}
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
            setPickingType(null);
          }}
          title={pickingType === "output" ? "Select Output Item" : "Select Input Item"}
        />
      )}
    </div>
  );
};
