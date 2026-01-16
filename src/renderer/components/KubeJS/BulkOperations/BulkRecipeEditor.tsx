import React, { useState } from 'react';
import { ParsedRecipe } from '../../../types/kubejs';

interface BulkRecipeEditorProps {
  recipes: ParsedRecipe[];
  onApply: (updates: Array<{ id: string; changes: Partial<ParsedRecipe> }>) => void;
  onCancel: () => void;
}

export const BulkRecipeEditor: React.FC<BulkRecipeEditorProps> = ({
  recipes,
  onApply,
  onCancel,
}) => {
  const [operation, setOperation] = useState<'prefix' | 'suffix' | 'replace' | 'multiply'>('prefix');
  const [textValue, setTextValue] = useState('');
  const [multiplier, setMultiplier] = useState(1);

  const handleApply = () => {
    const updates = recipes.map((recipe) => {
      const changes: Partial<ParsedRecipe> = {};

      switch (operation) {
        case 'prefix':
          changes.id = textValue + recipe.id;
          break;
        case 'suffix':
          changes.id = recipe.id + textValue;
          break;
        case 'replace':
          changes.id = recipe.id.replace(new RegExp(textValue, 'g'), '');
          break;
        case 'multiply':
          // Multiply output counts
          if (recipe.output && typeof recipe.output === 'object' && 'count' in recipe.output) {
            changes.output = { ...recipe.output, count: (recipe.output.count || 1) * multiplier };
          }
          break;
      }

      return { id: recipe.id, changes };
    });

    onApply(updates);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-bold text-white mb-4">
          Bulk Edit {recipes.length} Recipes
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-200 mb-2">Operation</label>
            <select
              className="w-full px-3 py-2 bg-[#2a2a2a] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={operation}
              onChange={(e) => setOperation(e.target.value as any)}
            >
              <option value="prefix">Add Prefix to ID</option>
              <option value="suffix">Add Suffix to ID</option>
              <option value="replace">Remove Text from ID</option>
              <option value="multiply">Multiply Output Count</option>
            </select>
          </div>

          {(operation === 'prefix' || operation === 'suffix' || operation === 'replace') && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Text</label>
              <input
                type="text"
                className="w-full px-3 py-2 bg-[#2a2a2a] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                placeholder={operation === 'replace' ? 'Text to remove' : 'Text to add'}
              />
            </div>
          )}

          {operation === 'multiply' && (
            <div>
              <label className="block text-sm font-medium text-gray-200 mb-2">Multiplier</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 bg-[#2a2a2a] border rounded-md text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={multiplier}
                onChange={(e) => setMultiplier(parseFloat(e.target.value))}
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleApply}
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Apply to {recipes.length} Recipes
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-md transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
