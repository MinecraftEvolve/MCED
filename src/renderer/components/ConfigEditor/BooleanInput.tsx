import React from "react";
import { ConfigSetting } from "@/types/config.types";

interface BooleanInputProps {
  setting: ConfigSetting;
  onChange: (value: boolean) => void;
}

export function BooleanInput({ setting, onChange }: BooleanInputProps) {
  const value = setting.value as boolean;

  return (
    <div className="flex items-center justify-between py-3 border-b border-border">
      <div className="flex-1">
        <label className="font-medium text-sm">{setting.key}</label>
        {setting.description && (
          <p className="text-xs text-muted-foreground mt-1">
            {setting.description}
          </p>
        )}
      </div>

      <button
        onClick={() => onChange(!value)}
        className={`
          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
          ${value ? "bg-[#9333ea]" : "bg-secondary"}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
            ${value ? "translate-x-6" : "translate-x-1"}
          `}
        />
      </button>
    </div>
  );
}
