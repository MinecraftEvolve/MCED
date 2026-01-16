import React, { useState } from 'react';
import { ItemSlot } from './ItemSlot';
import { ItemPicker } from '../ItemPicker/ItemPicker';

interface CreateSandpaperPolishingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

const CreateSandpaperPolishingEditor: React.FC<CreateSandpaperPolishingEditorProps> = ({ instancePath, onSave, initialRecipe }) => {
  const [input, setInput] = useState<string | null>(initialRecipe?.input || null);
  const [output, setOutput] = useState<string | null>(initialRecipe?.output || null);
  const [outputCount, setOutputCount] = useState(initialRecipe?.outputCount || 1);
  const [showItemPicker, setShowItemPicker] = useState(false);
  const [pickingSlot, setPickingSlot] = useState<'input' | 'output' | null>(null);

  const handleSave = () => {
    if (!input || !output) {
      alert('Please provide both input and output items');
      return;
    }

    const recipe = {
      type: 'create:sandpaper_polishing',
      ingredients: [{ item: input }],
      results: [{ item: output, count: outputCount }]
    };

    onSave(recipe);
  };

  const handleItemSelected = (item: string) => {
    if (pickingSlot === 'input') setInput(item);
    else if (pickingSlot === 'output') setOutput(item);
    setShowItemPicker(false);
    setPickingSlot(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-8">
        {/* Input */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Input Item</h3>
          <div className="inline-block bg-muted/50 border border-border rounded-lg p-4">
            <ItemSlot
              item={input}
              onClick={() => {
                setPickingSlot('input');
                setShowItemPicker(true);
              }}
              onClear={() => setInput(null)}
              size="lg"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">Item to polish with sandpaper</p>
        </div>

        {/* Output */}
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3">Output Item</h3>
          <div className="inline-block bg-muted/50 border border-border rounded-lg p-4">
            <ItemSlot
              item={output}
              count={outputCount}
              onClick={() => {
                setPickingSlot('output');
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
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
        <button
          onClick={() => {
            setInput(null);
            setOutput(null);
            setOutputCount(1);
          }}
          className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border rounded text-sm text-foreground transition-colors"
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

export default CreateSandpaperPolishingEditor;
