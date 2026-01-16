import React, { useState } from 'react';

interface NBTEditorProps {
  nbt?: Record<string, any>;
  onChange: (nbt: Record<string, any> | undefined) => void;
}

export const NBTEditor: React.FC<NBTEditorProps> = ({ nbt, onChange }) => {
  const [jsonInput, setJsonInput] = useState(nbt ? JSON.stringify(nbt, null, 2) : '');
  const [error, setError] = useState<string>('');

  const handleChange = (value: string) => {
    setJsonInput(value);
    setError('');

    if (!value.trim()) {
      onChange(undefined);
      return;
    }

    try {
      const parsed = JSON.parse(value);
      onChange(parsed);
    } catch (e) {
      setError('Invalid JSON');
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-200">NBT Data (JSON)</label>
      <textarea
        className="w-full h-32 px-3 py-2 bg-[#2a2a2a] border rounded-md text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        value={jsonInput}
        onChange={(e) => handleChange(e.target.value)}
        placeholder='{"Enchantments":[{"id":"minecraft:sharpness","lvl":5}]}'
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <p className="text-xs text-gray-400">
        Enter NBT data as JSON. Leave empty for no NBT data.
      </p>
    </div>
  );
};
