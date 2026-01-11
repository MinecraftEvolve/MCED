import React, { useState } from 'react';
import { ConfigSetting } from '@shared/types/config.types';

interface TextInputProps {
  setting: ConfigSetting;
  onChange: (value: string) => void;
}

export function TextInput({ setting, onChange }: TextInputProps) {
  const value = setting.value as string;
  const [inputValue, setInputValue] = useState(value);

  const handleBlur = () => {
    if (inputValue !== value) {
      onChange(inputValue);
    }
  };

  return (
    <div className="py-3 border-b border-border">
      <label className="block font-medium text-sm mb-2">{setting.key}</label>
      
      {setting.description && (
        <p className="text-xs text-muted-foreground mb-2">{setting.description}</p>
      )}
      
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onBlur={handleBlur}
        className="w-full px-3 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
      />
      
      {setting.defaultValue !== undefined && value !== setting.defaultValue && (
        <button
          onClick={() => {
            setInputValue(String(setting.defaultValue));
            onChange(String(setting.defaultValue));
          }}
          className="text-xs text-primary hover:underline mt-2"
        >
          Reset to default
        </button>
      )}
    </div>
  );
}
