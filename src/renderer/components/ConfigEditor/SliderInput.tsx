import React, { useState, useEffect } from "react";
import { ConfigSetting } from "@/types/config.types";

interface SliderInputProps {
  setting: ConfigSetting;
  onChange: (value: number) => void;
}

export function SliderInput({ setting, onChange }: SliderInputProps) {
  const value = setting.value as number;
  const [inputValue, setInputValue] = useState(String(value));

  // Sync input value when setting.value changes (e.g., on discard)
  useEffect(() => {
    setInputValue(String(value));
  }, [value]);

  const min = setting.min ?? 0;
  const max = setting.max ?? 100;
  const step = setting.type === "integer" ? 1 : 0.1;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = Number(e.target.value);
    setInputValue(String(newValue));
    onChange(newValue);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleInputBlur = () => {
    let newValue = Number(inputValue);
    if (isNaN(newValue)) {
      newValue = value;
    } else {
      newValue = Math.max(min, Math.min(max, newValue));
    }
    setInputValue(String(newValue));
    onChange(newValue);
  };

  return (
    <div className="py-3 border-b border-primary/20">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <label className="font-medium text-sm">{setting.key}</label>
          {setting.unit && (
            <span className="text-xs text-muted-foreground px-2 py-0.5 bg-secondary rounded">
              {setting.unit}
            </span>
          )}
        </div>
        <input
          type="number"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          className="w-20 px-2 py-1 text-sm bg-secondary border border-primary/20 rounded text-right"
          step={step}
          min={min}
          max={max}
        />
      </div>

      {setting.description && (
        <p className="text-xs text-muted-foreground mb-2">{setting.description}</p>
      )}

      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground font-mono">{min}</span>
        <input
          type="range"
          value={value}
          onChange={handleSliderChange}
          min={min}
          max={max}
          step={step}
          className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer slider-thumb"
        />
        <span className="text-xs text-muted-foreground font-mono">{max}</span>
      </div>

      <div className="flex items-center justify-between mt-2">
        {setting.defaultValue !== undefined && value !== setting.defaultValue && (
          <button
            onClick={() => {
              onChange(setting.defaultValue as number);
              setInputValue(String(setting.defaultValue));
            }}
            className="text-xs text-primary hover:underline"
          >
            Reset to default ({String(setting.defaultValue)})
          </button>
        )}
        {setting.range && (
          <span className="text-xs text-muted-foreground ml-auto">
            Range: {min} ~ {max}
          </span>
        )}
      </div>
    </div>
  );
}
