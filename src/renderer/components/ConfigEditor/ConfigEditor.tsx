import React, { useEffect, useState } from "react";
import { Settings } from "lucide-react";
import { ConfigFile, ConfigSetting } from "@/types/config.types";
import { configService } from "@/services/ConfigService";
import { BooleanInput } from "./BooleanInput";
import { SliderInput } from "./SliderInput";
import { TextInput } from "./TextInput";
import { DropdownInput } from "./DropdownInput";
import { ListInput } from "./ListInput";
import { RawEditor } from "./RawEditor";
import { useAppStore } from "@/store";
import { FileText, Code, FileCode } from "lucide-react";
import "./ConfigEditor.css";

interface ConfigEditorProps {
  modId: string;
  instancePath: string;
}

export function ConfigEditor({ modId, instancePath }: ConfigEditorProps) {
  const [configs, setConfigs] = useState<ConfigFile[]>([]);
  const [originalConfigs, setOriginalConfigs] = useState<ConfigFile[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ConfigFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRawMode, setIsRawMode] = useState(false);
  const { setHasUnsavedChanges } = useAppStore();

  useEffect(() => {
    loadConfigs();
  }, [modId, instancePath]);

  useEffect(() => {
    // Listen for save-all event from StatusBar
    const handleSaveAll = () => {
      handleSave();
    };

    // Listen for discard event from StatusBar
    const handleDiscard = () => {
      // Restore from original configs
      if (originalConfigs.length > 0) {
        setConfigs(JSON.parse(JSON.stringify(originalConfigs)));
        if (selectedConfig) {
          const restoredConfig = originalConfigs.find(
            (c) => c.path === selectedConfig.path,
          );
          if (restoredConfig) {
            setSelectedConfig(JSON.parse(JSON.stringify(restoredConfig)));
          }
        }
      }
      setHasUnsavedChanges(false);
    };

    window.addEventListener("save-all-configs", handleSaveAll);
    window.addEventListener("discard-all-changes", handleDiscard);
    return () => {
      window.removeEventListener("save-all-configs", handleSaveAll);
      window.removeEventListener("discard-all-changes", handleDiscard);
    };
  }, [originalConfigs, selectedConfig]);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const loadedConfigs = await configService.loadModConfigs(
        instancePath,
        modId,
      );
      setConfigs(loadedConfigs);
      setOriginalConfigs(JSON.parse(JSON.stringify(loadedConfigs))); // Store deep clone
      if (loadedConfigs.length > 0) {
        setSelectedConfig(loadedConfigs[0]);
      }
    } catch (error) {
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (settingKey: string, newValue: unknown) => {
    if (!selectedConfig) return;

    const updatedSettings = selectedConfig.settings.map((setting) =>
      setting.key === settingKey ? { ...setting, value: newValue } : setting,
    );

    const updatedConfig = {
      ...selectedConfig,
      settings: updatedSettings,
    };

    setSelectedConfig(updatedConfig);
    setConfigs(
      configs.map((c) => (c.path === updatedConfig.path ? updatedConfig : c)),
    );
    setHasUnsavedChanges(true);

    // Auto-save if enabled
    const autoSave = useAppStore.getState().settings.autoSave;
    if (autoSave) {
      setTimeout(() => handleSave(), 500); // Debounce auto-save
    }
  };

  const handleSave = async () => {
    if (!selectedConfig) return;

    setIsSaving(true);
    try {
      const success = await configService.saveConfig(selectedConfig);
      if (success) {
        // Update original configs to match saved state
        setOriginalConfigs(JSON.parse(JSON.stringify(configs)));
        setHasUnsavedChanges(false);
        // Show success message
      } else {
      }
    } catch (error) {
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="config-loading">
        <div className="config-spinner"></div>
        <p className="text-muted-foreground">Loading configs...</p>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="config-empty">
        <div className="flex flex-col items-center gap-4">
          <FileText className="text-muted-foreground/50" size={64} />
          <p className="text-muted-foreground">
            No config files found for this mod
          </p>
        </div>
      </div>
    );
  }

  // Group settings by category
  const groupSettingsByCategory = (settings: ConfigSetting[]) => {
    const grouped: Record<string, ConfigSetting[]> = {};
    settings.forEach((setting) => {
      const category = setting.category || "General";
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(setting);
    });
    return grouped;
  };

  const groupedSettings = selectedConfig
    ? groupSettingsByCategory(selectedConfig.settings)
    : {};

  return (
    <div className="config-editor">
      {/* Config file tabs */}
      {configs.length > 1 && (
        <div className="config-tabs">
          {configs.map((config) => (
            <button
              key={config.path}
              onClick={() => setSelectedConfig(config)}
              className={`config-tab ${selectedConfig?.path === config.path ? "active" : ""}`}
            >
              {config.name}
            </button>
          ))}
        </div>
      )}

      {/* Config content */}
      {selectedConfig && isRawMode ? (
        <RawEditor
          filePath={selectedConfig.path}
          content={selectedConfig.rawContent || ""}
          onSave={async (content) => {
            // Update the raw content and save
            const updatedConfig = { ...selectedConfig, rawContent: content };
            setSelectedConfig(updatedConfig);
            setConfigs(
              configs.map((c) =>
                c.path === updatedConfig.path ? updatedConfig : c,
              ),
            );

            // Save to disk
            setIsSaving(true);
            try {
              const success = await configService.saveConfig(updatedConfig);
              if (success) {
                setOriginalConfigs(JSON.parse(JSON.stringify(configs)));
                setHasUnsavedChanges(false);
              }
            } catch (error) {
            } finally {
              setIsSaving(false);
            }
          }}
          onCancel={() => setIsRawMode(false)}
        />
      ) : (
        selectedConfig && (
          <div className="config-content">
            {Object.entries(groupedSettings).map(([category, settings]) => (
              <div key={category} className="config-section">
                <div className="config-section-header">
                  <Settings className="config-section-icon" size={16} />
                  {category}
                </div>
                {settings.map((setting, index) => (
                  <div
                    key={`${setting.key}-${index}`}
                    className="config-setting"
                  >
                    {renderSettingInput(setting, handleSettingChange)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      )}

      {/* Actions */}
      <div className="config-actions">
        <button
          onClick={() => setIsRawMode(!isRawMode)}
          className="config-action-btn secondary"
          title={isRawMode ? "Switch to Form View" : "Switch to Raw Edit Mode"}
        >
          {isRawMode ? (
            <>
              <FileText className="icon" size={16} />
              Form View
            </>
          ) : (
            <>
              <Code className="icon" size={16} />
              Raw Edit
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function renderSettingInput(
  setting: ConfigSetting,
  onChange: (key: string, value: unknown) => void,
) {
  const handleChange = (value: unknown) => onChange(setting.key, value);

  switch (setting.type) {
    case "boolean":
      return <BooleanInput setting={setting} onChange={handleChange} />;

    case "integer":
    case "float":
      return <SliderInput setting={setting} onChange={handleChange} />;

    case "enum":
      return <DropdownInput setting={setting} onChange={handleChange} />;

    case "array":
      return <ListInput setting={setting} onChange={handleChange} />;

    case "string":
    default:
      return <TextInput setting={setting} onChange={handleChange} />;
  }
}
