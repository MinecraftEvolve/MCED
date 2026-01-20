import React, { useState } from "react";
import { Plus, Trash2, Copy } from "lucide-react";
import { ItemSlot } from "./ItemSlot";
import { ItemPicker } from "../ItemPicker/ItemPicker";

interface SequenceStep {
  type: "deploying" | "pressing" | "cutting" | "filling";
  input?: string;
  tool?: string;
}

interface ChancedOutput {
  item: string;
  chance: number;
}

interface SequencedAssemblyRecipe {
  outputs: ChancedOutput[];
  input: string;
  sequence: SequenceStep[];
  transitionalItem: string;
  loops: number;
}

interface Props {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: SequencedAssemblyRecipe;
}

const CreateSequencedAssemblyEditor: React.FC<Props> = ({
  instancePath,
  onSave,
  initialRecipe,
}) => {
  const [recipe, setRecipe] = useState<SequencedAssemblyRecipe>(
    initialRecipe || {
      outputs: [],
      input: "",
      sequence: [],
      transitionalItem: "",
      loops: 1,
    }
  );

  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingFor, setPickingFor] = useState<
    | "input"
    | "transitional"
    | { type: "output"; index: number }
    | { type: "step"; index: number; field: "tool" }
    | null
  >(null);

  const updateRecipe = (updates: Partial<SequencedAssemblyRecipe>) => {
    setRecipe((prev) => ({ ...prev, ...updates }));
  };

  const handleItemSelected = (item: string) => {
    if (pickingFor === "input") {
      updateRecipe({ input: item });
    } else if (pickingFor === "transitional") {
      updateRecipe({ transitionalItem: item });
    } else if (pickingFor && typeof pickingFor === "object") {
      if (pickingFor.type === "output") {
        const newOutputs = [...recipe.outputs];
        newOutputs[pickingFor.index].item = item;
        updateRecipe({ outputs: newOutputs });
      } else if (pickingFor.type === "step") {
        const newSequence = [...recipe.sequence];
        newSequence[pickingFor.index].tool = item;
        updateRecipe({ sequence: newSequence });
      }
    }
    setShowItemPicker(false);
    setPickingFor(null);
  };

  const addOutput = () => {
    updateRecipe({
      outputs: [...recipe.outputs, { item: "", chance: 100 }],
    });
  };

  const updateOutput = (index: number, field: "item" | "chance", value: string | number) => {
    const newOutputs = [...recipe.outputs];
    if (field === "chance") {
      newOutputs[index] = { ...newOutputs[index], chance: Number(value) };
    } else {
      newOutputs[index] = { ...newOutputs[index], item: value as string };
    }
    updateRecipe({ outputs: newOutputs });
  };

  const removeOutput = (index: number) => {
    updateRecipe({
      outputs: recipe.outputs.filter((_, i) => i !== index),
    });
  };

  const addStep = () => {
    updateRecipe({
      sequence: [...recipe.sequence, { type: "deploying", input: "", tool: "" }],
    });
  };

  const updateStep = (index: number, field: keyof SequenceStep, value: string) => {
    const newSequence = [...recipe.sequence];
    newSequence[index] = { ...newSequence[index], [field]: value };
    updateRecipe({ sequence: newSequence });
  };

  const removeStep = (index: number) => {
    updateRecipe({
      sequence: recipe.sequence.filter((_, i) => i !== index),
    });
  };

  const duplicateStep = (index: number) => {
    const newSequence = [...recipe.sequence];
    newSequence.splice(index + 1, 0, { ...recipe.sequence[index] });
    updateRecipe({ sequence: newSequence });
  };

  const moveStep = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === recipe.sequence.length - 1)
    ) {
      return;
    }

    const newSequence = [...recipe.sequence];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSequence[index], newSequence[targetIndex]] = [newSequence[targetIndex], newSequence[index]];
    updateRecipe({ sequence: newSequence });
  };

  const handleSave = () => {
    if (
      !recipe.input ||
      !recipe.transitionalItem ||
      recipe.outputs.length === 0 ||
      recipe.sequence.length === 0
    ) {
      alert(
        "Please provide input, transitional item, at least one output, and at least one sequence step"
      );
      return;
    }

    const recipeData = {
      type: "create:sequenced_assembly",
      ...recipe,
    };

    onSave(recipeData);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Left: Input & Transitional Items */}
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Starting Item</h3>
            <div className="inline-block bg-muted/50 border border-primary/20 rounded-lg p-4">
              <ItemSlot
                item={recipe.input}
                onClick={() => {
                  setPickingFor("input");
                  setShowItemPicker(true);
                }}
                onClear={() => updateRecipe({ input: "" })}
                size="lg"
              />
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Transitional Item</h3>
            <div className="inline-block bg-muted/50 border border-primary/20 rounded-lg p-4">
              <ItemSlot
                item={recipe.transitionalItem}
                onClick={() => {
                  setPickingFor("transitional");
                  setShowItemPicker(true);
                }}
                onClear={() => updateRecipe({ transitionalItem: "" })}
                size="lg"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Intermediate item during assembly</p>
          </div>

          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Number of Loops</h3>
            <input
              type="number"
              min="1"
              max="100"
              value={recipe.loops}
              onChange={(e) => updateRecipe({ loops: parseInt(e.target.value) || 1 })}
              className="w-24 bg-secondary border border-primary/20 text-foreground px-3 py-2 rounded focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* Right: Outputs */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-foreground">Output Items</h3>
            <button
              onClick={addOutput}
              className="px-2 py-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs rounded transition-colors"
            >
              <Plus size={14} />
            </button>
          </div>
          <div className="inline-block bg-muted/50 border border-primary/20 rounded-lg p-4 space-y-3">
            {recipe.outputs.map((output, index) => (
              <div key={index} className="flex items-center gap-2">
                <ItemSlot
                  item={output.item}
                  onClick={() => {
                    setPickingFor({ type: "output", index });
                    setShowItemPicker(true);
                  }}
                  size="md"
                />
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={output.chance}
                  onChange={(e) => updateOutput(index, "chance", e.target.value)}
                  className="w-16 bg-secondary border border-primary/20 text-foreground px-2 py-1 rounded text-sm"
                  placeholder="%"
                />
                <span className="text-xs text-muted-foreground">%</span>
                <button
                  onClick={() => removeOutput(index)}
                  className="p-1 text-destructive hover:bg-destructive/10 rounded transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {recipe.outputs.length === 0 && (
              <p className="text-xs text-muted-foreground">No outputs yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Sequence Steps */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-foreground">Assembly Sequence</label>
          <button
            onClick={addStep}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded transition-colors"
          >
            <Plus size={16} />
            Add Step
          </button>
        </div>

        <div className="space-y-3">
          {recipe.sequence.map((step, index) => (
            <div key={index} className="bg-muted/50 p-4 rounded-lg border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => moveStep(index, "up")}
                    disabled={index === 0}
                    className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                  >
                    ↑
                  </button>
                  <span className="text-muted-foreground text-sm px-2">#{index + 1}</span>
                  <button
                    onClick={() => moveStep(index, "down")}
                    disabled={index === recipe.sequence.length - 1}
                    className="p-1 hover:bg-muted rounded disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
                  >
                    ↓
                  </button>
                </div>

                <div className="flex-1 space-y-3">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Step Type</label>
                    <select
                      value={step.type}
                      onChange={(e) => updateStep(index, "type", e.target.value)}
                      className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-primary/20 focus:outline-none focus:border-primary"
                    >
                      <option value="deploying">Deploying</option>
                      <option value="pressing">Pressing</option>
                      <option value="cutting">Cutting</option>
                      <option value="filling">Filling</option>
                    </select>
                  </div>

                  {step.type === "deploying" && (
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Tool/Item</label>
                      <ItemSlot
                        item={step.tool || ""}
                        onClick={() => {
                          setPickingFor({ type: "step", index, field: "tool" });
                          setShowItemPicker(true);
                        }}
                        size="md"
                      />
                    </div>
                  )}

                  {step.type === "filling" && (
                    <div>
                      <label className="block text-xs text-muted-foreground mb-1">Fluid</label>
                      <input
                        type="text"
                        value={step.input || ""}
                        onChange={(e) => updateStep(index, "input", e.target.value)}
                        placeholder="e.g., minecraft:water"
                        className="w-full bg-secondary text-foreground px-3 py-2 rounded border border-primary/20 focus:outline-none focus:border-primary"
                      />
                    </div>
                  )}
                </div>

                <div className="flex gap-1">
                  <button
                    onClick={() => duplicateStep(index)}
                    className="p-2 hover:bg-muted rounded text-primary hover:text-primary/80 transition-colors"
                    title="Duplicate step"
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    onClick={() => removeStep(index)}
                    className="p-2 hover:bg-muted rounded text-destructive hover:text-red-300 transition-colors"
                    title="Remove step"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {recipe.sequence.length === 0 && (
            <div className="text-center py-8 text-muted-foreground border-2 border-dashed border-primary/20 rounded-lg">
              No steps added. Click "Add Step" to begin.
            </div>
          )}
        </div>
      </div>

      {/* Output Items */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="text-sm font-medium text-foreground">Output Items (with chances)</label>
          <button
            onClick={addOutput}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded transition-colors"
          >
            <Plus size={16} />
            Add Output
          </button>
        </div>

        <div className="space-y-2">
          {recipe.outputs.map((output, index) => (
            <div
              key={index}
              className="flex items-center gap-3 bg-muted/50 p-3 rounded-lg border border-primary/20"
            >
              <ItemSlot
                item={output.item}
                onClick={() => {
                  setPickingFor({ type: "output", index });
                  setShowItemPicker(true);
                }}
                size="md"
              />
              <div className="flex-1">
                <label className="block text-xs text-muted-foreground mb-1">Chance (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={output.chance}
                  onChange={(e) => updateOutput(index, "chance", e.target.value)}
                  className="w-24 bg-secondary text-foreground px-3 py-1.5 rounded border border-primary/20 focus:outline-none focus:border-primary"
                />
              </div>
              <button
                onClick={() => removeOutput(index)}
                className="p-2 hover:bg-muted rounded text-destructive hover:text-red-300 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-primary/20">
        <button
          onClick={() => {
            setRecipe({
              outputs: [],
              input: "",
              sequence: [],
              transitionalItem: "",
              loops: 1,
            });
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-primary/20 rounded text-sm text-foreground transition-colors"
        >
          Clear
        </button>
        <button
          onClick={handleSave}
          disabled={
            !recipe.input ||
            !recipe.transitionalItem ||
            recipe.outputs.length === 0 ||
            recipe.sequence.length === 0
          }
          className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Create Recipe
        </button>
      </div>

      {/* Code Preview */}
      {recipe.input &&
        recipe.transitionalItem &&
        recipe.outputs.some((o) => o.item) &&
        recipe.sequence.length > 0 && (
          <div className="bg-muted/30 border border-primary/20 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
              <span className="text-primary">{"</>"}</span>
              Generated Code
            </h3>
            <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-primary/20 overflow-x-auto">
              {`event.recipes.create.sequenced_assembly([
${recipe.outputs
  .filter((o) => o.item)
  .map((o) => `  Item.of('${o.item}').withChance(${o.chance / 100})`)
  .join(",\n")}
], '${recipe.input}', [
${recipe.sequence
  .map((step) => {
    if (step.type === "deploying" && step.tool) {
      return `  event.recipes.create.deploying('${recipe.transitionalItem}', ['${recipe.transitionalItem}', '${step.tool}'])`;
    } else if (step.type === "pressing") {
      return `  event.recipes.create.pressing('${recipe.transitionalItem}', '${recipe.transitionalItem}')`;
    } else if (step.type === "cutting") {
      return `  event.recipes.create.cutting('${recipe.transitionalItem}', '${recipe.transitionalItem}')`;
    } else if (step.type === "filling" && step.input) {
      return `  event.recipes.create.filling('${recipe.transitionalItem}', ['${recipe.transitionalItem}', Fluid.of('${step.input}', 250)])`;
    }
    return "";
  })
  .filter((s) => s)
  .join(",\n")}
]).transitionalItem('${recipe.transitionalItem}').loops(${recipe.loops})`}
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
            setPickingFor(null);
          }}
          title={
            pickingFor === "input"
              ? "Select Starting Item"
              : pickingFor === "transitional"
                ? "Select Transitional Item"
                : pickingFor && typeof pickingFor === "object" && pickingFor.type === "output"
                  ? "Select Output Item"
                  : "Select Tool/Item"
          }
        />
      )}
    </div>
  );
};

export default CreateSequencedAssemblyEditor;
