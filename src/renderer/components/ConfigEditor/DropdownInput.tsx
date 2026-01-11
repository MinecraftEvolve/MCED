import React from 'react';
import { ConfigSetting } from '@shared/types/config.types';

interface DropdownInputProps {
  setting: ConfigSetting;
  onChange: (value: string) => void;
}

export function DropdownInput({ setting, onChange }: DropdownInputProps) {
  const value = setting.value as string;
  const options = setting.enumValues || [];

  return (
    <div className="py-3 border-b border-border">
      <label className="block font-medium text-sm mb-2">{setting.key}</label>
      
      {setting.description && (
        <p className="text-xs text-muted-foreground mb-2">{setting.description}</p>
      )}
      
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-secondary border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      
      {setting.defaultValue !== undefined && value !== setting.defaultValue && (
        <button
          onClick={() => onChange(String(setting.defaultValue))}
          className="text-xs text-primary hover:underline mt-2"
        >
          Reset to default ({setting.defaultValue})
        </button>
      )}
    </div>
  );
}
