import React, { useState } from "react";
import { Plus, Trash2, Info } from "lucide-react";

interface Condition {
  type: string;
  value: any;
}

interface RecipeConditionsBuilderProps {
  conditions: Condition[];
  onChange: (conditions: Condition[]) => void;
}

export const RecipeConditionsBuilder: React.FC<RecipeConditionsBuilderProps> = ({
  conditions,
  onChange,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  const conditionTypes = [
    { id: "kubejs:mod_loaded", name: "Mod Loaded", valueType: "string", placeholder: "mod_id" },
    { id: "kubejs:not", name: "NOT (Inverse)", valueType: "condition", placeholder: "" },
    { id: "kubejs:and", name: "AND (All)", valueType: "conditions", placeholder: "" },
    { id: "kubejs:or", name: "OR (Any)", valueType: "conditions", placeholder: "" },
    { id: "forge:true", name: "Always True", valueType: "none", placeholder: "" },
    { id: "forge:false", name: "Always False", valueType: "none", placeholder: "" },
  ];

  const addCondition = () => {
    onChange([...conditions, { type: "kubejs:mod_loaded", value: "" }]);
  };

  const removeCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const updateCondition = (index: number, field: "type" | "value", value: any) => {
    const updated = [...conditions];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  return (
    <div className="bg-card rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">Recipe Conditions</label>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Show help"
        >
          <Info size={16} />
        </button>
      </div>

      {showHelp && (
        <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 text-sm text-foreground">
          <p>
            <strong>Conditions</strong> determine when a recipe is available:
          </p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>
              <strong>Mod Loaded:</strong> Recipe only works if a mod is installed
            </li>
            <li>
              <strong>NOT:</strong> Inverts another condition
            </li>
            <li>
              <strong>AND:</strong> All conditions must be true
            </li>
            <li>
              <strong>OR:</strong> At least one condition must be true
            </li>
          </ul>
        </div>
      )}

      {conditions.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">
          No conditions (recipe always available)
        </p>
      ) : (
        <div className="space-y-2">
          {conditions.map((condition, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={condition.type}
                onChange={(e) => updateCondition(index, "type", e.target.value)}
                className="flex-1 px-3 py-2 bg-secondary border border-primary/20 rounded-lg text-foreground focus:outline-none focus:border-primary"
              >
                {conditionTypes.map((ct) => (
                  <option key={ct.id} value={ct.id}>
                    {ct.name}
                  </option>
                ))}
              </select>

              {conditionTypes.find((ct) => ct.id === condition.type)?.valueType !== "none" && (
                <input
                  type="text"
                  value={condition.value}
                  onChange={(e) => updateCondition(index, "value", e.target.value)}
                  placeholder={conditionTypes.find((ct) => ct.id === condition.type)?.placeholder}
                  className="flex-1 px-3 py-2 bg-secondary border border-primary/20 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              )}

              <button
                onClick={() => removeCondition(index)}
                className="px-3 py-2 bg-destructive/20 hover:bg-destructive/30 text-destructive rounded-lg transition-colors"
                title="Remove condition"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={addCondition}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary/20 hover:bg-primary/30 text-blue-400 rounded-lg transition-colors"
      >
        <Plus size={16} />
        Add Condition
      </button>
    </div>
  );
};
