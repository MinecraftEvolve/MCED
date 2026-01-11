import React, { useState } from 'react';
import { ConfigSetting } from '@shared/types/config.types';

interface ListInputProps {
  setting: ConfigSetting;
  onChange: (value: any[]) => void;
}

export function ListInput({ setting, onChange }: ListInputProps) {
  const value = (setting.value as any[]) || [];
  const [newItem, setNewItem] = useState('');

  const handleAdd = () => {
    if (newItem.trim()) {
      onChange([...value, newItem.trim()]);
      setNewItem('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="py-3 border-b border-border">
      <label className="block font-medium text-sm mb-2">{setting.key}</label>
      
      {setting.description && (
        <p className="text-xs text-muted-foreground mb-2">{setting.description}</p>
      )}
      
      <div className="space-y-2">
        {value.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="flex-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm">
              {String(item)}
            </span>
            <button
              onClick={() => handleRemove(index)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Add new item..."
            className="flex-1 px-3 py-2 bg-secondary border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={handleAdd}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 text-sm"
          >
            Add
          </button>
        </div>
      </div>
    </div>
  );
}
