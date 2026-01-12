import React from "react";
import { ConfigSetting } from "@/types/config.types";

interface SettingWrapperProps {
  setting: ConfigSetting;
  onChange: (value: unknown) => void;
}

export function SettingWrapper({ setting, onChange }: SettingWrapperProps) {
  const renderInput = () => {
    switch (setting.type) {
      case "boolean":
        return (
          <label className="flex items-center gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={Boolean(setting.value)}
              onChange={(e) => onChange(e.target.checked)}
              className="w-5 h-5 rounded border-2 border-border bg-background checked:bg-primary checked:border-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all cursor-pointer"
            />
            <div className="flex-1">
              <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                {setting.displayName || setting.key}
              </div>
              {setting.description && (
                <div className="text-sm text-muted-foreground mt-1">
                  {setting.description}
                </div>
              )}
            </div>
          </label>
        );

      case "number":
        return (
          <div className="space-y-2">
            <label className="block">
              <div className="font-medium text-foreground mb-1">
                {setting.displayName || setting.key}
              </div>
              {setting.description && (
                <div className="text-sm text-muted-foreground mb-2">
                  {setting.description}
                </div>
              )}
              <input
                type="number"
                value={Number(setting.value)}
                onChange={(e) => onChange(Number(e.target.value))}
                min={setting.min}
                max={setting.max}
                step={setting.step}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              {(setting.min !== undefined || setting.max !== undefined) && (
                <div className="text-xs text-muted-foreground mt-1">
                  {setting.min !== undefined && setting.max !== undefined
                    ? `Range: ${setting.min} - ${setting.max}`
                    : setting.min !== undefined
                    ? `Min: ${setting.min}`
                    : `Max: ${setting.max}`}
                </div>
              )}
            </label>
          </div>
        );

      case "string":
        if (setting.allowedValues && setting.allowedValues.length > 0) {
          return (
            <div className="space-y-2">
              <label className="block">
                <div className="font-medium text-foreground mb-1">
                  {setting.displayName || setting.key}
                </div>
                {setting.description && (
                  <div className="text-sm text-muted-foreground mb-2">
                    {setting.description}
                  </div>
                )}
                <select
                  value={String(setting.value)}
                  onChange={(e) => onChange(e.target.value)}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                >
                  {setting.allowedValues.map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          );
        }
        return (
          <div className="space-y-2">
            <label className="block">
              <div className="font-medium text-foreground mb-1">
                {setting.displayName || setting.key}
              </div>
              {setting.description && (
                <div className="text-sm text-muted-foreground mb-2">
                  {setting.description}
                </div>
              )}
              <input
                type="text"
                value={String(setting.value)}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </label>
          </div>
        );

      case "array":
        return (
          <div className="space-y-2">
            <label className="block">
              <div className="font-medium text-foreground mb-1">
                {setting.displayName || setting.key}
              </div>
              {setting.description && (
                <div className="text-sm text-muted-foreground mb-2">
                  {setting.description}
                </div>
              )}
              <textarea
                value={Array.isArray(setting.value) ? setting.value.join("\n") : String(setting.value)}
                onChange={(e) => onChange(e.target.value.split("\n"))}
                rows={5}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all font-mono text-sm"
                placeholder="One value per line"
              />
            </label>
          </div>
        );

      default:
        return (
          <div className="space-y-2">
            <label className="block">
              <div className="font-medium text-foreground mb-1">
                {setting.displayName || setting.key}
              </div>
              {setting.description && (
                <div className="text-sm text-muted-foreground mb-2">
                  {setting.description}
                </div>
              )}
              <input
                type="text"
                value={String(setting.value)}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
            </label>
          </div>
        );
    }
  };

  return (
    <div className="setting-item p-4 rounded-lg border border-border bg-card hover:border-primary/50 transition-all">
      {renderInput()}
    </div>
  );
}
