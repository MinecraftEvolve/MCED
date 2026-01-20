import React, { useState } from "react";
import { ItemSlot } from "./ItemSlot";
import { ItemPicker } from "../ItemPicker/ItemPicker";

interface CreateCompactingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

const CreateCompactingEditor: React.FC<CreateCompactingEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe,
}) => {
  const [inputs, setInputs] = useState<(string | null)[]>(
    initialRecipe?.inputs || [null, null, null, null]
  );
  const [output, setOutput] = useState<string | null>(initialRecipe?.output || null);
  const [outputCount, setOutputCount] = useState(initialRecipe?.outputCount || 1);
  const [heated, setHeated] = useState(initialRecipe?.heated || false);
  const [superheated, setSuperheated] = useState(initialRecipe?.superheated || false);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<number | "output" | null>(null);

  const handleInputChange = (index: number, value: string | null) => {
    const newInputs = [...inputs];
    newInputs[index] = value;
    setInputs(newInputs);
  };

  const handleOutputChange = (value: string) => {
    setOutput(value);
  };

  const handleOutputCountChange = (value: number) => {
    setOutputCount(value);
  };

  const handleHeatedChange = (value: boolean) => {
    setHeated(value);
    if (value) setSuperheated(false);
  };

  const handleSuperheatedChange = (value: boolean) => {
    setSuperheated(value);
    if (value) setHeated(false);
  };

  const handleSave = () => {
    const validInputs = inputs.filter((i) => i);
    if (validInputs.length === 0 || !output) {
      alert("Please provide at least one input and an output");
      return;
    }

    const recipe = {
      type: "create:compacting",
      ingredients: validInputs.map((i) => ({ item: i })),
      results: [{ item: output, count: outputCount }],
      ...(heated && { heat: "heated" }),
      ...(superheated && { heat: "superheated" }),
    };

    onSave(recipe);
  };

  const handleItemSelected = (item: string) => {
    if (pickingSlot === "output") {
      setOutput(item);
    } else if (typeof pickingSlot === "number") {
      handleInputChange(pickingSlot, item);
    }
    setShowItemPicker(false);
    setPickingSlot(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Inputs */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Input Items (Max 4)</h3>
          <div className="inline-block bg-muted/50 border border-primary/20 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3">
              {inputs.map((input, index) => (
                <ItemSlot
                  key={index}
                  item={input}
                  onClick={() => {
                    setPickingSlot(index);
                    setShowItemPicker(true);
                  }}
                  onClear={() => handleInputChange(index, null)}
                  size="md"
                />
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Add up to 4 input items</p>
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
              onCountChange={handleOutputCountChange}
              allowCount={true}
              size="lg"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Click to set output item and count</p>
        </div>
      </div>

      {/* Heat Settings */}
      <div className="bg-muted/30 border border-primary/20 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-foreground mb-3">Heat Requirement (Optional)</h3>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={!heated && !superheated}
              onChange={() => {
                setHeated(false);
                setSuperheated(false);
              }}
              className="w-4 h-4"
            />
            <span className="text-foreground">None</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={heated}
              onChange={() => handleHeatedChange(true)}
              className="w-4 h-4"
            />
            <span className="text-foreground">▲ Heated</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              checked={superheated}
              onChange={() => handleSuperheatedChange(true)}
              className="w-4 h-4"
            />
            <span className="text-foreground">▲▲ Superheated</span>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/20">
        <button
          onClick={() => {
            setInputs([null, null, null, null]);
            setOutput(null);
            setOutputCount(1);
            setHeated(false);
            setSuperheated(false);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-primary/20 rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={!output || inputs.every((i) => !i)}
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Recipe
        </button>
      </div>

      {/* Code Preview */}
      {output && inputs.some((i) => i) && (
        <div className="bg-muted/30 border border-primary/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{"</>"}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-primary/20 overflow-x-auto">
            {`event.recipes.create.compacting('${output}'${outputCount > 1 ? ` * ${outputCount}` : ""}, [
${inputs
  .filter((i) => i)
  .map((input) => `  '${input}'`)
  .join(",\n")}
])${heated ? `.heated()` : ""}${superheated ? `.superheated()` : ""}`}
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
          title={pickingSlot === "output" ? "Select Output Item" : "Select Input Item"}
        />
      )}
    </div>
  );
};

export default CreateCompactingEditor;
