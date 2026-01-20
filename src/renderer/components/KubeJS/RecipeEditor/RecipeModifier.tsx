import React, { useState } from "react";
import { X } from "lucide-react";

interface RecipeModifierProps {
  recipe: any;
  onSave: (modifiedRecipe: any) => void;
  onCancel: () => void;
}

export const RecipeModifier: React.FC<RecipeModifierProps> = ({ recipe, onSave, onCancel }) => {
  const [modifications, setModifications] = useState<{
    removeInput?: string;
    replaceInput?: { old: string; new: string };
    changeOutput?: string;
    multiplyOutput?: number;
    replaceId?: string;
  }>({});

  const [operation, setOperation] = useState<
    "remove_input" | "replace_input" | "change_output" | "multiply_output" | "change_id"
  >("change_id");

  const handleApply = () => {
    const modified = { ...recipe };

    switch (operation) {
      case "remove_input":
        if (modifications.removeInput && modified.ingredients) {
          modified.ingredients = modified.ingredients.filter(
            (ing: any) =>
              ing.item !== modifications.removeInput && ing.tag !== modifications.removeInput
          );
        }
        break;

      case "replace_input":
        if (modifications.replaceInput && modified.ingredients) {
          modified.ingredients = modified.ingredients.map((ing: any) => {
            if (
              ing.item === modifications.replaceInput?.old ||
              ing.tag === modifications.replaceInput?.old
            ) {
              return { ...ing, item: modifications.replaceInput!.new, tag: undefined };
            }
            return ing;
          });
        }
        break;

      case "change_output":
        if (modifications.changeOutput) {
          if (modified.results) {
            modified.results[0] = { ...modified.results[0], item: modifications.changeOutput };
          } else if (modified.output) {
            if (typeof modified.output === "string") {
              modified.output = modifications.changeOutput;
            } else {
              modified.output = { ...modified.output, item: modifications.changeOutput };
            }
          }
        }
        break;

      case "multiply_output":
        if (modifications.multiplyOutput) {
          if (modified.results?.[0]?.count) {
            modified.results[0].count = Math.floor(
              modified.results[0].count * modifications.multiplyOutput
            );
          } else if (
            modified.output &&
            typeof modified.output === "object" &&
            "count" in modified.output
          ) {
            modified.output.count = Math.floor(
              (modified.output.count || 1) * modifications.multiplyOutput
            );
          }
        }
        break;

      case "change_id":
        if (modifications.replaceId) {
          modified.id = modifications.replaceId;
        }
        break;
    }

    onSave(modified);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-primary/20 rounded-lg p-6 w-full max-w-2xl shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-foreground">Modify Recipe: {recipe.id}</h2>
          <button onClick={onCancel} className="p-1 hover:bg-secondary rounded transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Operation</label>
            <select
              className="w-full px-3 py-2 bg-secondary border border-primary/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              value={operation}
              onChange={(e) => setOperation(e.target.value as any)}
            >
              <option value="change_id">Change Recipe ID</option>
              <option value="remove_input">Remove Input</option>
              <option value="replace_input">Replace Input</option>
              <option value="change_output">Change Output</option>
              <option value="multiply_output">Multiply Output Count</option>
            </select>
          </div>

          {operation === "change_id" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                New Recipe ID
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-secondary border border-primary/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={modifications.replaceId || recipe.id}
                onChange={(e) => setModifications({ ...modifications, replaceId: e.target.value })}
                placeholder="new_recipe_id"
              />
            </div>
          )}

          {operation === "remove_input" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Input to Remove
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-secondary border border-primary/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={modifications.removeInput || ""}
                onChange={(e) =>
                  setModifications({ ...modifications, removeInput: e.target.value })
                }
                placeholder="minecraft:iron_ingot"
              />
            </div>
          )}

          {operation === "replace_input" && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Old Input</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-secondary border border-primary/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={modifications.replaceInput?.old || ""}
                  onChange={(e) =>
                    setModifications({
                      ...modifications,
                      replaceInput: {
                        old: e.target.value,
                        new: modifications.replaceInput?.new || "",
                      },
                    })
                  }
                  placeholder="minecraft:iron_ingot"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">New Input</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-secondary border border-primary/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  value={modifications.replaceInput?.new || ""}
                  onChange={(e) =>
                    setModifications({
                      ...modifications,
                      replaceInput: {
                        old: modifications.replaceInput?.old || "",
                        new: e.target.value,
                      },
                    })
                  }
                  placeholder="minecraft:gold_ingot"
                />
              </div>
            </div>
          )}

          {operation === "change_output" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">New Output</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-secondary border border-primary/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={modifications.changeOutput || ""}
                onChange={(e) =>
                  setModifications({ ...modifications, changeOutput: e.target.value })
                }
                placeholder="minecraft:diamond"
              />
            </div>
          )}

          {operation === "multiply_output" && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Output Multiplier
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 bg-secondary border border-primary/20 rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                value={modifications.multiplyOutput || 1}
                onChange={(e) =>
                  setModifications({ ...modifications, multiplyOutput: parseFloat(e.target.value) })
                }
              />
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors font-medium"
            >
              Apply Modification
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-primary/20 text-foreground rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
