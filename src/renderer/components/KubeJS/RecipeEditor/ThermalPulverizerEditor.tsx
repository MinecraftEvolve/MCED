import React, { useState } from "react";
import { ItemSlot } from "./ItemSlot";
import { ItemSelector } from "./ItemSelector";

interface ThermalPulverizerEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

const ThermalPulverizerEditor: React.FC<ThermalPulverizerEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe,
}) => {
  const [input, setInput] = useState(initialRecipe?.input || "");
  const [primaryOutput, setPrimaryOutput] = useState(initialRecipe?.primaryOutput || "");
  const [primaryCount, setPrimaryCount] = useState(initialRecipe?.primaryCount || 1);
  const [secondaryOutput, setSecondaryOutput] = useState(initialRecipe?.secondaryOutput || "");
  const [secondaryCount, setSecondaryCount] = useState(initialRecipe?.secondaryCount || 1);
  const [secondaryChance, setSecondaryChance] = useState(initialRecipe?.secondaryChance || 0);
  const [energy, setEnergy] = useState(initialRecipe?.energy || 4000);

  const [showInputSelector, setShowInputSelector] = useState(false);
  const [showPrimarySelector, setShowPrimarySelector] = useState(false);
  const [showSecondarySelector, setShowSecondarySelector] = useState(false);

  const updateRecipe = (updates: any) => {
    const recipe = {
      type: "thermal:pulverizer",
      input,
      primaryOutput,
      primaryCount,
      secondaryOutput,
      secondaryCount,
      secondaryChance,
      energy,
      ...updates,
    };
    onSave(recipe);
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="text-lg font-semibold text-foreground mb-2">Thermal: Pulverizer</div>

      <div className="flex items-center gap-8">
        {/* Input */}
        <div className="flex flex-col gap-2">
          <div className="text-sm text-muted-foreground mb-2">Input</div>
          <ItemSlot
            item={input}
            onClick={() => setShowInputSelector(true)}
            onClear={() => {
              setInput("");
              updateRecipe({ input: "" });
            }}
            size="lg"
          />
        </div>

        {/* Arrow */}
        <div className="text-4xl text-muted-foreground">→</div>

        {/* Outputs */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">Primary Output</div>
            <ItemSlot
              item={primaryOutput}
              count={primaryCount}
              onClick={() => setShowPrimarySelector(true)}
              onClear={() => {
                setPrimaryOutput("");
                updateRecipe({ primaryOutput: "" });
              }}
              onCountChange={(count) => {
                setPrimaryCount(count);
                updateRecipe({ primaryCount: count });
              }}
              allowCount={true}
              size="lg"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="text-sm text-muted-foreground">Secondary Output</div>
            <ItemSlot
              item={secondaryOutput}
              count={secondaryCount}
              onClick={() => setShowSecondarySelector(true)}
              onClear={() => {
                setSecondaryOutput("");
                updateRecipe({ secondaryOutput: "" });
              }}
              onCountChange={(count) => {
                setSecondaryCount(count);
                updateRecipe({ secondaryCount: count });
              }}
              allowCount={true}
              size="lg"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Chance:</span>
              <input
                type="number"
                value={secondaryChance}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setSecondaryChance(val);
                  updateRecipe({ secondaryChance: val });
                }}
                min={0}
                max={1}
                step={0.01}
                className="w-16 px-2 py-1 bg-secondary border rounded text-xs text-foreground"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Energy Cost */}
      <div className="flex items-center gap-3 p-4 bg-card/50 rounded-lg border">
        <span className="text-sm text-foreground">Energy Cost:</span>
        <input
          type="number"
          value={energy}
          onChange={(e) => {
            const val = parseInt(e.target.value);
            setEnergy(val);
            updateRecipe({ energy: val });
          }}
          className="w-24 px-2 py-1 bg-secondary border rounded text-sm text-foreground"
        />
        <span className="text-xs text-muted-foreground">RF</span>
      </div>

      {/* Item Selectors */}
      {showInputSelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Select Input Item</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <ItemSelector
                instancePath={instancePath}
                onSelect={(item) => {
                  setInput(item.id);
                  updateRecipe({ input: item.id });
                  setShowInputSelector(false);
                }}
              />
            </div>
            <div className="p-4 border-t border-border">
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

      {showPrimarySelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Select Primary Output</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <ItemSelector
                instancePath={instancePath}
                onSelect={(item) => {
                  setPrimaryOutput(item.id);
                  updateRecipe({ primaryOutput: item.id });
                  setShowPrimarySelector(false);
                }}
              />
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={() => setShowPrimarySelector(false)}
                className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSecondarySelector && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-lg font-semibold text-foreground">Select Secondary Output</h3>
            </div>
            <div className="flex-1 overflow-hidden">
              <ItemSelector
                instancePath={instancePath}
                onSelect={(item) => {
                  setSecondaryOutput(item.id);
                  updateRecipe({ secondaryOutput: item.id });
                  setShowSecondarySelector(false);
                }}
              />
            </div>
            <div className="p-4 border-t border-border">
              <button
                onClick={() => setShowSecondarySelector(false)}
                className="w-full px-4 py-2 bg-secondary hover:bg-secondary/80 text-foreground rounded transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Code Preview */}
      {input && primaryOutput && (
        <div className="bg-muted/30 border border-border rounded-lg p-4 mt-6">
          <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-2">
            <span className="text-primary">{"</>"}</span>
            Generated Code
          </h3>
          <pre className="text-xs font-mono text-foreground bg-background/50 p-3 rounded border border-border overflow-x-auto">
            {`event.recipes.thermal.pulverizer([
  '${primaryOutput}'${primaryCount > 1 ? ` * ${primaryCount}` : ""}${secondaryOutput ? `,\n  Item.of('${secondaryOutput}')${secondaryCount > 1 ? `.withCount(${secondaryCount})` : ""}.withChance(${secondaryChance})` : ""}
], '${input}')${energy !== 4000 ? `.energy(${energy})` : ""}`}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ThermalPulverizerEditor;
