import React, { useState } from "react";
import { UnifiedSelector } from "../RecipeEditor/UnifiedSelector";

interface ItemModEditorProps {
  onSave: (modification: ItemModification) => void;
  onCancel: () => void;
  existingMod?: ItemModification;
}

export interface ItemModification {
  itemId: string;
  modifications: {
    tags?: string[];
    tooltip?: string[];
    rarity?: "common" | "uncommon" | "rare" | "epic";
    maxStackSize?: number;
    burnTime?: number;
  };
}

export const ItemModEditor: React.FC<ItemModEditorProps> = ({ onSave, onCancel, existingMod }) => {
  const [itemId, setItemId] = useState(existingMod?.itemId || "");
  const [tags, setTags] = useState<string[]>(existingMod?.modifications.tags || []);
  const [newTag, setNewTag] = useState("");
  const [tooltips, setTooltips] = useState<string[]>(existingMod?.modifications.tooltip || []);
  const [newTooltip, setNewTooltip] = useState("");
  const [rarity, setRarity] = useState<string>(existingMod?.modifications.rarity || "common");
  const [maxStackSize, setMaxStackSize] = useState<number | "">(
    existingMod?.modifications.maxStackSize || ""
  );
  const [burnTime, setBurnTime] = useState<number | "">(existingMod?.modifications.burnTime || "");

  const handleAddTag = () => {
    if (newTag.trim()) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleAddTooltip = () => {
    if (newTooltip.trim()) {
      setTooltips([...tooltips, newTooltip.trim()]);
      setNewTooltip("");
    }
  };

  const handleRemoveTooltip = (index: number) => {
    setTooltips(tooltips.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const modification: ItemModification = {
      itemId,
      modifications: {},
    };

    if (tags.length > 0) modification.modifications.tags = tags;
    if (tooltips.length > 0) modification.modifications.tooltip = tooltips;
    if (rarity !== "common") modification.modifications.rarity = rarity as any;
    if (maxStackSize !== "") modification.modifications.maxStackSize = Number(maxStackSize);
    if (burnTime !== "") modification.modifications.burnTime = Number(burnTime);

    onSave(modification);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card rounded-lg p-6 w-[800px] max-h-[90vh] overflow-y-auto border border-primary/20">
        <h2 className="text-xl font-semibold text-foreground mb-4">Item Modification</h2>

        {/* Item ID */}
        <div className="mb-4">
          <label className="block text-sm text-foreground mb-2">Item ID</label>
          <UnifiedSelector
            value={itemId}
            onChange={(value) => {
              const stringValue = typeof value === "string" ? value : value?.id || "";
              setItemId(stringValue);
            }}
            type="item"
            placeholder="Select item..."
          />
        </div>

        {/* Tags */}
        <div className="mb-4">
          <label className="block text-sm text-foreground mb-2">Tags</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
              placeholder="forge:ingots/iron"
              className="flex-1 bg-secondary text-foreground px-3 py-2 rounded-lg border border-primary/20 focus:border-primary focus:outline-none"
            />
            <button
              onClick={handleAddTag}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-foreground rounded-lg"
            >
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <div
                key={index}
                className="bg-secondary px-3 py-1 rounded-lg border border-primary/20 flex items-center gap-2"
              >
                <span className="text-sm text-foreground">{tag}</span>
                <button
                  onClick={() => handleRemoveTag(index)}
                  className="text-destructive hover:text-destructive/80"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Tooltips */}
        <div className="mb-4">
          <label className="block text-sm text-muted-foreground mb-2">Tooltips</label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newTooltip}
              onChange={(e) => setNewTooltip(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleAddTooltip()}
              placeholder="Custom tooltip text"
              className="flex-1 bg-background text-foreground px-3 py-2 rounded border border-primary/20 focus:border-primary focus:outline-none"
            />
            <button
              onClick={handleAddTooltip}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-foreground rounded"
            >
              Add
            </button>
          </div>
          <div className="space-y-2">
            {tooltips.map((tooltip, index) => (
              <div
                key={index}
                className="bg-background px-3 py-2 rounded border border-primary/20 flex items-center justify-between"
              >
                <span className="text-sm text-foreground">{tooltip}</span>
                <button
                  onClick={() => handleRemoveTooltip(index)}
                  className="text-destructive hover:text-destructive"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Rarity */}
        <div className="mb-4">
          <label className="block text-sm text-muted-foreground mb-2">Rarity</label>
          <select
            value={rarity}
            onChange={(e) => setRarity(e.target.value)}
            className="w-full bg-background text-foreground px-3 py-2 rounded border border-primary/20 focus:border-primary focus:outline-none"
          >
            <option value="common">Common (White)</option>
            <option value="uncommon">Uncommon (Yellow)</option>
            <option value="rare">Rare (Cyan)</option>
            <option value="epic">Epic (Magenta)</option>
          </select>
        </div>

        {/* Max Stack Size */}
        <div className="mb-4">
          <label className="block text-sm text-muted-foreground mb-2">Max Stack Size</label>
          <input
            type="number"
            value={maxStackSize}
            onChange={(e) => setMaxStackSize(e.target.value ? Number(e.target.value) : "")}
            min="1"
            max="64"
            placeholder="64"
            className="w-full bg-background text-foreground px-3 py-2 rounded border border-primary/20 focus:border-primary focus:outline-none"
          />
        </div>

        {/* Burn Time */}
        <div className="mb-6">
          <label className="block text-sm text-muted-foreground mb-2">Burn Time (ticks)</label>
          <input
            type="number"
            value={burnTime}
            onChange={(e) => setBurnTime(e.target.value ? Number(e.target.value) : "")}
            min="0"
            placeholder="200"
            className="w-full bg-background text-foreground px-3 py-2 rounded border border-primary/20 focus:border-primary focus:outline-none"
          />
          <p className="text-xs text-muted-foreground mt-1">1 item smelted = 200 ticks</p>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-accent hover:bg-accent/80 text-foreground rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!itemId}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-foreground rounded disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
