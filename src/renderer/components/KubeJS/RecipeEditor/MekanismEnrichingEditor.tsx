import React, { useState } from "react";
import { ItemSlot } from "./ItemSlot";
import { ItemSelector } from "./ItemSelector";

interface MekanismEnrichingRecipe {
  output: string;
  input: string;
}

interface Props {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: MekanismEnrichingRecipe;
}

const MekanismEnrichingEditor: React.FC<Props> = ({ instancePath, onSave, initialRecipe }) => {
  const [recipe, setRecipe] = useState<MekanismEnrichingRecipe>(
    initialRecipe || { input: "", output: "" }
  );
  const [showInputSelector, setShowInputSelector] = useState(false);
  const [showOutputSelector, setShowOutputSelector] = useState(false);

  const handleChange = (updatedRecipe: MekanismEnrichingRecipe) => {
    setRecipe(updatedRecipe);
    onSave({ ...updatedRecipe, type: "mekanism:enriching" });
  };

  return (
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg">
        <div className="flex items-center justify-center gap-8">
          {/* Input */}
          <div className="text-center">
            <label className="block text-sm font-medium text-muted-foreground mb-3">Input</label>
            <ItemSlot
              item={recipe.input}
              onClick={() => setShowInputSelector(true)}
              onClear={() => handleChange({ ...recipe, input: "" })}
              size="lg"
            />
          </div>

          {/* Arrow */}
          <div className="text-4xl text-muted-foreground">→</div>

          {/* Output */}
          <div className="text-center">
            <label className="block text-sm font-medium text-muted-foreground mb-3">Output</label>
            <ItemSlot
              item={recipe.output}
              onClick={() => setShowOutputSelector(true)}
              onClear={() => handleChange({ ...recipe, output: "" })}
              size="lg"
            />
          </div>
        </div>
      </div>

      {/* Input Selector Modal */}
      {showInputSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-primary/20">
              <h3 className="text-lg font-semibold text-foreground">Select Input Item</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <ItemSelector
                instancePath={instancePath}
                onSelect={(item) => {
                  handleChange({ ...recipe, input: item.id });
                  setShowInputSelector(false);
                }}
              />
            </div>
            <div className="p-4 border-t border-primary/20">
              <button
                onClick={() => setShowInputSelector(false)}
                className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Output Selector Modal */}
      {showOutputSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-primary/20">
              <h3 className="text-lg font-semibold text-foreground">Select Output Item</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <ItemSelector
                instancePath={instancePath}
                onSelect={(item) => {
                  handleChange({ ...recipe, output: item.id });
                  setShowOutputSelector(false);
                }}
              />
            </div>
            <div className="p-4 border-t border-primary/20">
              <button
                onClick={() => setShowOutputSelector(false)}
                className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Preview */}
      {recipe.input && recipe.output && (
        <div className="bg-muted/30 border border-primary/20 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{"</>"}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-primary/20 overflow-x-auto">
            {`event.recipes.mekanism.enriching('${recipe.output}', '${recipe.input}')`}
          </pre>
        </div>
      )}
    </div>
  );
};

export default MekanismEnrichingEditor;
