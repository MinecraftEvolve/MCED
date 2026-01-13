import React, { useEffect, useState } from "react";
import { Settings, FileText } from "lucide-react";
import Editor from '@monaco-editor/react';
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
  viewMode?: 'visual' | 'raw';
  onViewModeChange?: (mode: 'visual' | 'raw') => void;
}

export function ConfigEditor({ modId, instancePath, viewMode, onViewModeChange }: ConfigEditorProps) {
  const [configs, setConfigs] = useState<ConfigFile[]>([]);
  const [originalConfigs, setOriginalConfigs] = useState<ConfigFile[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ConfigFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [internalViewMode, setInternalViewMode] = useState<'visual' | 'raw'>('visual');
  const [rawContent, setRawContent] = useState<string>('');

  const currentViewMode = viewMode ?? internalViewMode;
  
  const handleViewModeToggle = (mode: 'visual' | 'raw') => {
    if (onViewModeChange) {
      onViewModeChange(mode);
    } else {
      setInternalViewMode(mode);
    }
    if (mode === 'raw' && selectedConfig) {
      loadRawContent(selectedConfig.path);
    }
  };

  const { setHasUnsavedChanges, mods, selectedMod } = useAppStore();
  const { recordEdit } = useStatsStore();
  const { logChange } = useChangelogStore();
  const { trackChange } = useChangeTrackingStore();
  const { settings } = useSettingsStore();

  // Handler to update Discord RPC when config changes
  const handleConfigSelect = async (config: ConfigFile) => {
    setSelectedConfig(config);
    
    // Load raw content when switching configs in raw mode
    if (currentViewMode === 'raw') {
      await loadRawContent(config.path);
    }
    
    // Update Discord RPC with config file name
    if (settings.discordRpcEnabled && selectedMod) {
      window.api.discordSetMod(selectedMod.name, mods.length, config.name);
    }
  };

  const loadRawContent = async (configPath: string) => {
    try {
      const result = await window.api.readFile(configPath);
      if (result.success && result.content) {
        setRawContent(result.content);
      }
    } catch (error) {
      console.error('Failed to load raw content:', error);
    }
  };

  const handleRawContentChange = (value: string | undefined) => {
    if (value !== undefined) {
      setRawContent(value);
      setHasUnsavedChanges(true);
    }
  };

  const saveRawContent = async () => {
    if (!selectedConfig) return;

    setIsSaving(true);
    try {
      const result = await window.api.writeFile(selectedConfig.path, rawContent);
      if (result.success) {
        // Reload configs to update the visual editor
        await loadConfigs();
        setHasUnsavedChanges(false);
      }
    } catch (error) {
      console.error('Failed to save raw content:', error);
    } finally {
      setIsSaving(false);
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
      {/* Config Tabs with View Mode Toggle */}
      <div className="flex items-center border-b border-border bg-muted/30">
        {configs.length > 1 && (
          <div className="flex flex-1">
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
        
        {/* View Mode Toggle - Right Side */}
        {selectedConfig && (
          <div className="flex items-center gap-1 px-4 py-1.5">
            <button
              onClick={() => handleViewModeToggle('visual')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                currentViewMode === 'visual'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Visual Editor"
            >
              <Settings size={14} className="inline mr-1" />
              Visual
            </button>
            <button
              onClick={() => handleViewModeToggle('raw')}
              className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                currentViewMode === 'raw'
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title="Raw Editor (Monaco)"
            >
              <FileText size={14} className="inline mr-1" />
              Raw
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      {selectedConfig && currentViewMode === 'visual' && (
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

      {/* Raw Editor View */}
      {selectedConfig && currentViewMode === 'raw' && (
        <div className="flex-1 flex flex-col p-4">
          <div className="h-[calc(100vh-200px)] border border-border rounded-lg overflow-hidden">
            <Editor
              height="100%"
              defaultLanguage="properties"
              value={rawContent}
              onChange={handleRawContentChange}
              theme="vs-dark"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
              }}
              onMount={(editor) => {
                // Auto-save on Ctrl+S
                editor.addCommand(2097, () => {
                  saveRawContent();
                });
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
