import React, { useState } from "react";

interface NBTEditorProps {
  nbt?: Record<string, any>;
  onChange: (nbt: Record<string, any> | undefined) => void;
}

export const NBTEditor: React.FC<NBTEditorProps> = ({ nbt, onChange }) => {
  const [jsonInput, setJsonInput] = useState(nbt ? JSON.stringify(nbt, null, 2) : "");
  const [error, setError] = useState<string>("");

  const handleChange = (value: string) => {
    setJsonInput(value);
    setError("");

    if (!value.trim()) {
      onChange(undefined);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      onChange(parsed);
    } catch (e) {
      setError("Invalid JSON");
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-foreground">NBT Data (JSON)</label>
      <textarea
        className="w-full h-32 px-3 py-2 bg-secondary border border-primary/20 rounded-lg text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        value={jsonInput}
        onChange={(e) => handleChange(e.target.value)}
        placeholder='{"Enchantments":[{"id":"minecraft:sharpness","lvl":5}]}'
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <p className="text-xs text-muted-foreground">Enter NBT data as JSON. Leave empty for no NBT data.</p>
    </div>
  );
};
