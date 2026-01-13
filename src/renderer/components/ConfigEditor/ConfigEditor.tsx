import React, { useEffect, useState } from "react";
import { Settings, FileText, Code } from "lucide-react";
import { ConfigFile, ConfigSetting } from "@/types/config.types";
import { configService } from "@/services/ConfigService";
import { useAppStore } from "@/store";
import { useStatsStore } from "@/store/statsStore";
import { useChangelogStore } from "@/store/changelogStore";
import { useChangeTrackingStore } from "@/store/changeTrackingStore";
import { useSettingsStore } from "@/store/settingsStore";
import { SettingWrapper } from "./SettingWrapper";
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

  const { setHasUnsavedChanges, mods, selectedMod } = useAppStore();
  const { recordEdit } = useStatsStore();
  const { logChange } = useChangelogStore();
  const { trackChange } = useChangeTrackingStore();
  const { settings } = useSettingsStore();

  // Handler to update Discord RPC when config changes
  const handleConfigSelect = (config: ConfigFile) => {
    setSelectedConfig(config);
    
    // Update Discord RPC with config file name
    if (settings.discordRpcEnabled && selectedMod) {
      window.api.discordSetMod(selectedMod.name, mods.length, config.name);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, [modId, instancePath]);

  useEffect(() => {
    const handleSaveAll = () => {
      handleSave();
    };

    const handleDiscard = () => {
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
      setOriginalConfigs(JSON.parse(JSON.stringify(loadedConfigs)));
      if (loadedConfigs.length > 0) {
        const firstConfig = loadedConfigs[0];
        setSelectedConfig(firstConfig);
        
        // Update Discord RPC with first config file
        if (settings.discordRpcEnabled && selectedMod) {
          window.api.discordSetMod(selectedMod.name, mods.length, firstConfig.name);
        }
      }
    } catch (error) {
      console.error("Failed to load configs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (settingKey: string, newValue: unknown) => {
    if (!selectedConfig || !selectedMod) return;

    const setting = selectedConfig.settings.find((s) => s.key === settingKey);
    const oldValue = setting?.value;

    // Track the change
    if (oldValue !== undefined) {
      const modName = selectedMod.name;
      const configFile = selectedConfig.name;
      const valueType = typeof newValue;

      // Record in all tracking systems
      trackChange(modId, settingKey, oldValue, newValue);
      recordEdit(modId, modName, settingKey);
      logChange(modId, modName, settingKey, configFile, oldValue, newValue, valueType);
    }

    const updatedSettings = selectedConfig.settings.map((s) =>
      s.key === settingKey ? { ...s, value: newValue } : s,
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

    const autoSave = useAppStore.getState().settings.autoSave;
    if (autoSave) {
      setTimeout(() => handleSave(), 500);
    }
  };

  const handleAddComment = (settingKey: string, text: string) => {
    if (!selectedConfig) return;

    const updatedSettings = selectedConfig.settings.map((setting) => {
      if (setting.key === settingKey) {
        const newComment = {
          id: Date.now().toString(),
          text,
          timestamp: new Date().toISOString(),
        };
        return {
          ...setting,
          userComments: [...(setting.userComments || []), newComment],
        };
      }
      return setting;
    });

    const updatedConfig = { ...selectedConfig, settings: updatedSettings };
    setSelectedConfig(updatedConfig);
    setConfigs(
      configs.map((c) => (c.path === updatedConfig.path ? updatedConfig : c)),
    );
    setHasUnsavedChanges(true);
  };

  const handleDeleteComment = (settingKey: string, commentId: string) => {
    if (!selectedConfig) return;

    const updatedSettings = selectedConfig.settings.map((setting) => {
      if (setting.key === settingKey) {
        return {
          ...setting,
          userComments: (setting.userComments || []).filter(
            (c) => c.id !== commentId,
          ),
        };
      }
      return setting;
    });

    const updatedConfig = { ...selectedConfig, settings: updatedSettings };
    setSelectedConfig(updatedConfig);
    setConfigs(
      configs.map((c) => (c.path === updatedConfig.path ? updatedConfig : c)),
    );
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!selectedConfig) return;

    setIsSaving(true);
    try {
      const success = await configService.saveConfig(selectedConfig);
      if (success) {
        setOriginalConfigs(JSON.parse(JSON.stringify(configs)));
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error("Failed to save config:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading configs...</p>
        </div>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="text-muted-foreground/50 mx-auto mb-4" size={64} />
          <p className="text-muted-foreground">
            No config files found for this mod
          </p>
        </div>
      </div>
    );
  }

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
    <div className="flex flex-col h-full bg-background">
      {configs.length > 1 && (
        <div className="flex border-b border-border bg-muted/30">
          {configs.map((config) => (
            <button
              key={config.path}
              onClick={() => handleConfigSelect(config)}
              className={`px-4 py-2 text-sm font-medium transition-colors ${
                selectedConfig?.path === config.path
                  ? "bg-background text-foreground border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              {config.name}
            </button>
          ))}
        </div>
      )}

      {selectedConfig && (
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {Object.entries(groupedSettings).map(([category, settings]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground border-b border-border pb-2">
                <Settings size={16} />
                {category}
              </div>
              {settings.map((setting, index) => (
                <div key={`${setting.key}-${index}`} className="space-y-2">
                  <SettingWrapper
                    setting={setting}
                    onChange={(value) => handleSettingChange(setting.key, value)}
                    onAddComment={handleAddComment}
                    onDeleteComment={handleDeleteComment}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
