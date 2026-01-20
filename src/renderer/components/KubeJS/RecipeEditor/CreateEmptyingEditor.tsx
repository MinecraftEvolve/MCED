import React, { useState } from "react";
import { Plus, ArrowRight } from "lucide-react";
import { ItemSlot } from "./ItemSlot";
import { FluidSlot } from "./FluidSlot";
import { ItemPicker } from "../ItemPicker/ItemPicker";
import { FluidSelector } from "../ItemPicker/FluidSelector";

interface Item {
  id: string;
  name: string;
  modId: string;
  texture?: string;
  count?: number;
}

interface Fluid {
  id: string;
  name: string;
  texture?: string;
  amount?: number;
}

interface CreateEmptyingEditorProps {
  recipe?: any;
  onSave: (recipe: any) => void;
  onCancel: () => void;
  instancePath: string;
}

export const CreateEmptyingEditor: React.FC<CreateEmptyingEditorProps> = ({
  recipe,
  onSave,
  onCancel,
  instancePath,
}) => {
  const [inputItem, setInputItem] = useState<Item | null>(null);
  const [containerItem, setContainerItem] = useState<Item | null>(null);
  const [fluid, setFluid] = useState<Fluid | null>(null);
  const [fluidAmount, setFluidAmount] = useState(recipe?.fluidResults?.[0]?.amount || 1000);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [showFluidSelector, setShowFluidSelector] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<"input" | "container" | null>(null);

  // Load item data from registry
  React.useEffect(() => {
    const loadData = async () => {
      if (recipe) {
        // Load input (filled container)
        if (recipe.ingredients?.[0]) {
          const ing = recipe.ingredients[0];
          const itemId = ing.item || ing;
          const item = await loadItemData(itemId);
          setInputItem(item);
        }

        // Load output container (optional)
        if (recipe.results?.[0]) {
          const res = recipe.results[0];
          const itemId = res.item || res;
          const item = await loadItemData(itemId);
          setContainerItem(item);
        }

        // Load fluid
        if (recipe.fluidResults?.[0]) {
          const fluidData = recipe.fluidResults[0];
          const fluidId = fluidData.fluid || fluidData.id || fluidData;

          // Try to load fluid from registry
          try {
            const result = await window.api.fluidRegistryGetFluidById(instancePath, fluidId);
            if (result.success && result.data) {
              setFluid({
                id: result.data.id,
                name: result.data.name,
                texture: result.data.texture,
                amount: fluidData.amount || 1000,
              });
            } else {
              // Fallback if not in registry
              setFluid({
                id: fluidId,
                name: fluidId.split(":")[1]?.replace(/_/g, " ") || fluidId,
                amount: fluidData.amount || 1000,
              });
            }
          } catch (error) {
            console.error("Failed to load fluid:", error);
            setFluid({
              id: fluidId,
              name: fluidId.split(":")[1]?.replace(/_/g, " ") || fluidId,
              amount: fluidData.amount || 1000,
            });
          }

          setFluidAmount(fluidData.amount || 1000);
        }
      }
    };

    loadData();
  }, [recipe, instancePath]);

  const loadItemData = async (itemId: string): Promise<Item> => {
    try {
      const result = await window.api.itemRegistryGetItemById(instancePath, itemId);
      if (result.success && result.data) {
        return {
          id: result.data.id,
          name: result.data.name,
          modId: result.data.modId,
          texture: result.data.texture,
        };
      }
    } catch (error) {
      console.error("Failed to load item:", error);
    }
    return {
      id: itemId,
      name: itemId.split(":")[1] || itemId,
      modId: itemId.split(":")[0] || "minecraft",
    };
  };

  const handleItemSelected = async (itemId: string) => {
    const item = await loadItemData(itemId);

    if (pickingSlot === "input") {
      setInputItem(item);
    } else if (pickingSlot === "container") {
      setContainerItem(item);
    }

    setShowItemPicker(false);
    setPickingSlot(null);
  };

  const handleSlotClick = (slot: "input" | "container") => {
    setPickingSlot(slot);
    setShowItemPicker(true);
  };

  const handleFluidSelect = (selectedFluid: { id: string; name: string; icon?: string }) => {
    setFluid({
      id: selectedFluid.id,
      name: selectedFluid.name,
      texture: selectedFluid.icon,
    });
    setShowFluidSelector(false);
  };

  const handleSave = () => {
    if (!inputItem || !fluid) {
      alert("Please fill in all required fields (input and fluid are required)");
      return;
    }

    const newRecipe = {
      type: "create:emptying",
      ingredients: [{ item: inputItem.id }],
      results: containerItem ? [{ item: containerItem.id }] : [],
      fluidResults: [{ fluid: fluid.id, amount: fluidAmount }],
    };

    onSave(newRecipe);
  };

  return (
    <div className="space-y-6">
      {/* Recipe Visualization */}
      <div className="flex items-center justify-center gap-8">
        {/* Filled Container */}
        <div className="text-center">
          <p className="text-xs font-medium text-foreground mb-2">Filled Container</p>
          <ItemSlot
            item={inputItem}
            size="normal"
            onClick={() => handleSlotClick("input")}
            onClear={() => setInputItem(null)}
          />
        </div>

        <ArrowRight className="w-6 h-6 text-primary mt-6" />

        {/* Empty Container (optional) */}
        <div className="text-center">
          <p className="text-xs font-medium text-foreground mb-2">Container (optional)</p>
          <ItemSlot
            item={containerItem}
            size="normal"
            onClick={() => handleSlotClick("container")}
            onClear={() => setContainerItem(null)}
          />
        </div>

        <Plus className="w-8 h-8 text-primary mt-6" />

        {/* Fluid Output */}
        <div className="text-center">
          <p className="text-xs font-medium text-foreground mb-2">Fluid</p>
          <FluidSlot
            fluid={fluid}
            size="normal"
            onClick={() => setShowFluidSelector(true)}
            onClear={() => setFluid(null)}
          />
          <div className="mt-2">
            <label className="block text-xs font-medium text-foreground mb-1">Amount (mB)</label>
            <input
              type="number"
              value={fluidAmount}
              onChange={(e) => setFluidAmount(parseInt(e.target.value) || 1000)}
              placeholder="1000"
              className="w-20 px-2 py-1 bg-secondary border border-primary/20 rounded text-sm text-foreground text-center focus:outline-none focus:border-primary"
              min={1}
            />
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
        <p className="text-sm text-foreground">
          💡 <strong>Emptying Recipe:</strong> Empties a filled container using a Spout, extracting
          the fluid.
        </p>
      </div>

      {/* Code Preview */}
      {inputItem && fluid && (
        <div className="bg-muted/30 border border-primary/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{"</>"}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-primary/20 overflow-x-auto">
            {`event.recipes.create.emptying([
  Fluid.of('${fluid.id}', ${fluidAmount}),${containerItem ? `\n  '${containerItem.id}'` : ""}
], '${inputItem.id}')`}
          </pre>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/20">
        <button
          onClick={() => {
            setInputItem(null);
            setContainerItem(null);
            setFluid(null);
            setFluidAmount(1000);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-primary/20 rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!inputItem || !fluid}
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
        />
      )}

      {showFluidSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background border border-primary/20 rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col">
            <FluidSelector
              onSelect={handleFluidSelect}
              onClose={() => setShowFluidSelector(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
};
