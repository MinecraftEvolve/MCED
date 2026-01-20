import React, { useState } from "react";
import { ItemSlot } from "./ItemSlot";
import { ItemPicker } from "../ItemPicker/ItemPicker";

interface CreateItemApplicationEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

const CreateItemApplicationEditor: React.FC<CreateItemApplicationEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe,
}) => {
  const [base, setBase] = useState<string | null>(initialRecipe?.base || null);
  const [applied, setApplied] = useState<string | null>(initialRecipe?.applied || null);
  const [output, setOutput] = useState<string | null>(initialRecipe?.output || null);
  const [outputCount, setOutputCount] = useState(initialRecipe?.outputCount || 1);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<"base" | "applied" | "output" | null>(null);

  const handleSave = () => {
    if (!base || !applied || !output) {
      alert("Please provide base block, applied item, and output");
      return;
    }

    const recipe = {
      type: "create:item_application",
      ingredients: [{ item: base }, { item: applied }],
      results: [{ item: output, count: outputCount }],
    };

    onSave(recipe);
  };

  const handleItemSelected = (item: string) => {
    if (pickingSlot === "base") setBase(item);
    else if (pickingSlot === "applied") setApplied(item);
    else if (pickingSlot === "output") setOutput(item);
    setShowItemPicker(false);
    setPickingSlot(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Inputs */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Input Items</h3>
          <div className="inline-block bg-muted/50 border border-primary/20 rounded-lg p-4 space-y-3">
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Base Block</label>
              <ItemSlot
                item={base}
                onClick={() => {
                  setPickingSlot("base");
                  setShowItemPicker(true);
                }}
                onClear={() => setBase(null)}
                size="md"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground mb-1">Applied Item</label>
              <ItemSlot
                item={applied}
                onClick={() => {
                  setPickingSlot("applied");
                  setShowItemPicker(true);
                }}
                onClear={() => setApplied(null)}
                size="md"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Right-click base with applied item</p>
        </div>

        {/* Output */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Output Item</h3>
          <div className="inline-block bg-muted/50 border border-primary/20 rounded-lg p-4">
            <ItemSlot
              item={output}
              count={outputCount}
              onClick={() => {
                setPickingSlot("output");
                setShowItemPicker(true);
              }}
              onCountChange={(val) => setOutputCount(val)}
              allowCount={true}
              size="lg"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Click to set output item and count</p>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/20">
        <button
          onClick={() => {
            setBase(null);
            setApplied(null);
            setOutput(null);
            setOutputCount(1);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-primary/20 rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors"
        >
          Create Recipe
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
    </div>
  );
};

export default CreateItemApplicationEditor;
