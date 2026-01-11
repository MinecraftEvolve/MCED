import React, { useEffect, useState } from 'react';
import { ConfigFile, ConfigSetting } from '@shared/types/config.types';
import { configService } from '@/services/ConfigService';
import { BooleanInput } from './BooleanInput';
import { SliderInput } from './SliderInput';
import { TextInput } from './TextInput';
import { DropdownInput } from './DropdownInput';
import { ListInput } from './ListInput';
import { useAppStore } from '@/store';

interface ConfigEditorProps {
  modId: string;
  instancePath: string;
}

export function ConfigEditor({ modId, instancePath }: ConfigEditorProps) {
  const [configs, setConfigs] = useState<ConfigFile[]>([]);
  const [selectedConfig, setSelectedConfig] = useState<ConfigFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
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
      loadConfigs();
    };

    window.addEventListener('save-all-configs', handleSaveAll);
    window.addEventListener('discard-all-changes', handleDiscard);
    return () => {
      window.removeEventListener('save-all-configs', handleSaveAll);
      window.removeEventListener('discard-all-changes', handleDiscard);
    };
  }, [selectedConfig]);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const loadedConfigs = await configService.loadModConfigs(instancePath, modId);
      setConfigs(loadedConfigs);
      if (loadedConfigs.length > 0) {
        setSelectedConfig(loadedConfigs[0]);
      }
    } catch (error) {
      console.error('Error loading configs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (settingKey: string, newValue: any) => {
    if (!selectedConfig) return;

    const updatedSettings = selectedConfig.settings.map(setting =>
      setting.key === settingKey
        ? { ...setting, value: newValue }
        : setting
    );

    const updatedConfig = {
      ...selectedConfig,
      settings: updatedSettings,
    };

    setSelectedConfig(updatedConfig);
    setConfigs(configs.map(c => c.path === updatedConfig.path ? updatedConfig : c));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!selectedConfig) return;

    setIsSaving(true);
    try {
      const success = await configService.saveConfig(selectedConfig);
      if (success) {
        setHasUnsavedChanges(false);
        // Show success message
        console.log('Config saved successfully');
      } else {
        console.error('Failed to save config');
      }
    } catch (error) {
      console.error('Error saving config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Loading configs...</p>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">No config files found for this mod</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Config file tabs */}
      {configs.length > 1 && (
        <div className="flex gap-2 border-b border-border">
          {configs.map(config => (
            <button
              key={config.path}
              onClick={() => setSelectedConfig(config)}
              className={`
                px-4 py-2 text-sm font-medium border-b-2 transition-colors
                ${selectedConfig?.path === config.path
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
                }
              `}
            >
              {config.name}
            </button>
          ))}
        </div>
      )}

      {/* Settings */}
      {selectedConfig && (
        <div className="space-y-1">
          {selectedConfig.settings.map(setting => (
            <div key={setting.key}>
              {renderSettingInput(setting, handleSettingChange)}
            </div>
          ))}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-end pt-4 border-t border-border">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 transition-colors"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function renderSettingInput(
  setting: ConfigSetting,
  onChange: (key: string, value: any) => void
) {
  const handleChange = (value: any) => onChange(setting.key, value);

  switch (setting.type) {
    case 'boolean':
      return <BooleanInput setting={setting} onChange={handleChange} />;
    
    case 'integer':
    case 'float':
      return <SliderInput setting={setting} onChange={handleChange} />;
    
    case 'enum':
      return <DropdownInput setting={setting} onChange={handleChange} />;
    
    case 'array':
      return <ListInput setting={setting} onChange={handleChange} />;
    
    case 'string':
    default:
      return <TextInput setting={setting} onChange={handleChange} />;
  }
}
