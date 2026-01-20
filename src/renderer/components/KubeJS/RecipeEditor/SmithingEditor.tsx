import React, { useState } from "react";
import { Hammer, Plus } from "lucide-react";
import { ItemPicker } from "../ItemPicker/ItemPicker";
import { ItemSlot } from "./ItemSlot";

interface Item {
  id: string;
  name: string;
  modId: string;
  texture?: string;
}

interface SmithingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

export const SmithingEditor: React.FC<SmithingEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe,
}) => {
  const [base, setBase] = useState<Item | null>(null);
  const [addition, setAddition] = useState<Item | null>(null);
  const [template, setTemplate] = useState<Item | null>(null);
  const [result, setResult] = useState<Item | null>(null);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<
    "base" | "addition" | "template" | "result" | null
  >(null);

  const handleSlotClick = (slot: "base" | "addition" | "template" | "result") => {
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
          name: itemId.split(":")[1] || itemId,
          modId: itemId.split(":")[0] || "minecraft",
        };
      }

      switch (pickingSlot) {
        case "base":
          setBase(item);
          break;
        case "addition":
          setAddition(item);
          break;
        case "template":
          setTemplate(item);
          break;
        case "result":
          setResult(item);
          break;
      }

      setShowItemPicker(false);
      setPickingSlot(null);
    } catch (error) {
      console.error("Failed to fetch item data:", error);
    }
  };

  const handleSave = () => {
    if (!base || !addition || !result) {
      alert("Please select base, addition, and result items");
      return;
    }

    // Smithing recipes in 1.20+ require a template
    if (!template) {
      alert(
        "Smithing recipes in Minecraft 1.20+ require a template (e.g., netherite_upgrade_smithing_template)"
      );
      return;
    }

    const recipe = {
      type: "smithing",
      base: base.id,
      addition: addition.id,
      template: template.id,
      result: result.id,
      code: `ServerEvents.recipes(event => {
  event.smithing(
    '${result.id}',      // Result
    '${base.id}',        // Base item
    '${addition.id}',    // Addition (upgrade material)
    '${template.id}'     // Smithing template (1.20+)
  );
});`,
    };

    onSave(recipe);
  };

  return (
    <div className="space-y-6">
      {/* Recipe Visual */}
      <div className="bg-background border border-border rounded-lg p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Template Slot (Top) */}
          <div className="flex flex-col items-center">
            <label className="text-xs text-muted-foreground mb-2">Template</label>
            <ItemSlot
              item={
                template
                  ? {
                      type: "item",
                      id: template.id,
                      name: template.name,
                      modId: template.modId,
                      texture: template.texture,
                      amount: 1,
                    }
                  : null
              }
              onClick={() => handleSlotClick("template")}
              onRemove={() => setTemplate(null)}
              size="lg"
            />
            <span className="text-xs text-muted-foreground mt-1">
              {template ? template.name : "Select template"}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4">
          {/* Base Item */}
          <div className="flex flex-col items-center">
            <label className="text-xs text-muted-foreground mb-2">Base Item</label>
            <ItemSlot
              item={
                base
                  ? {
                      type: "item",
                      id: base.id,
                      name: base.name,
                      modId: base.modId,
                      texture: base.texture,
                      amount: 1,
                    }
                  : null
              }
              onClick={() => handleSlotClick("base")}
              onRemove={() => setBase(null)}
              size="lg"
            />
            <span className="text-xs text-muted-foreground mt-1">
              {base ? base.name : "Select base"}
            </span>
          </div>

          <Plus className="text-muted-foreground" size={24} />

          {/* Addition Item */}
          <div className="flex flex-col items-center">
            <label className="text-xs text-muted-foreground mb-2">Addition</label>
            <ItemSlot
              item={
                addition
                  ? {
                      type: "item",
                      id: addition.id,
                      name: addition.name,
                      modId: addition.modId,
                      texture: addition.texture,
                      amount: 1,
                    }
                  : null
              }
              onClick={() => handleSlotClick("addition")}
              onRemove={() => setAddition(null)}
              size="lg"
            />
            <span className="text-xs text-muted-foreground mt-1">
              {addition ? addition.name : "Select addition"}
            </span>
          </div>

          <Hammer className="text-purple-500" size={32} />

          {/* Result */}
          <div className="flex flex-col items-center">
            <label className="text-xs text-muted-foreground mb-2">Result</label>
            <ItemSlot
              item={
                result
                  ? {
                      type: "item",
                      id: result.id,
                      name: result.name,
                      modId: result.modId,
                      texture: result.texture,
                      amount: 1,
                    }
                  : null
              }
              onClick={() => handleSlotClick("result")}
              onRemove={() => setResult(null)}
              size="lg"
            />
            <span className="text-xs text-muted-foreground mt-1">
              {result ? result.name : "Select result"}
            </span>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="text-blue-400 flex-shrink-0">ℹ️</div>
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Smithing Recipe Notes (Minecraft 1.20+):</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>Requires a smithing template (e.g., netherite_upgrade_smithing_template)</li>
              <li>Base item: The item being upgraded (e.g., diamond_sword)</li>
              <li>Addition: The upgrade material (e.g., netherite_ingot)</li>
              <li>Result: The upgraded item (e.g., netherite_sword)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Common Templates */}
      <div className="bg-background border border-border rounded-lg p-4">
        <h4 className="text-sm font-semibold mb-3">Common Templates:</h4>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={() => handleItemSelected("minecraft:netherite_upgrade_smithing_template")}
            className="px-3 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded text-left"
          >
            Netherite Upgrade
          </button>
          <button
            onClick={() => handleItemSelected("minecraft:diamond_upgrade_smithing_template")}
            className="px-3 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded text-left"
          >
            Diamond Upgrade
          </button>
          <button
            onClick={() => handleItemSelected("minecraft:armor_trim_smithing_template")}
            className="px-3 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded text-left"
          >
            Armor Trim
          </button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 px-6 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg font-semibold transition-colors"
        >
          Save Recipe
        </button>
      </div>

      {/* Item Picker Modal */}
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
    </div>
  );
};
