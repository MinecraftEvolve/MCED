import React, { useEffect, useState } from 'react';
import { ConfigFile, ConfigSetting } from '@shared/types/config.types';
import { configService } from '@/services/ConfigService';
import { BooleanInput } from './BooleanInput';
import { SliderInput } from './SliderInput';
import { TextInput } from './TextInput';
import { DropdownInput } from './DropdownInput';
import { ListInput } from './ListInput';
import { RawEditor } from './RawEditor';
import { useAppStore } from '@/store';

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
          const restoredConfig = originalConfigs.find(c => c.path === selectedConfig.path);
          if (restoredConfig) {
            setSelectedConfig(JSON.parse(JSON.stringify(restoredConfig)));
          }
        }
      }
      setHasUnsavedChanges(false);
    };

    window.addEventListener('save-all-configs', handleSaveAll);
    window.addEventListener('discard-all-changes', handleDiscard);
    return () => {
      window.removeEventListener('save-all-configs', handleSaveAll);
      window.removeEventListener('discard-all-changes', handleDiscard);
    };
  }, [originalConfigs, selectedConfig]);

  const loadConfigs = async () => {
    setIsLoading(true);
    try {
      const loadedConfigs = await configService.loadModConfigs(instancePath, modId);
      setConfigs(loadedConfigs);
      setOriginalConfigs(JSON.parse(JSON.stringify(loadedConfigs))); // Store deep clone
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
        // Update original configs to match saved state
        setOriginalConfigs(JSON.parse(JSON.stringify(configs)));
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
      {/* Config file tabs and controls */}
      <div className="flex items-center justify-between border-b border-border">
        {configs.length > 1 && (
          <div className="flex gap-2">
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
        <button
          onClick={() => setIsRawMode(!isRawMode)}
          className="px-3 py-1 text-sm bg-[#2a2a2a] hover:bg-[#333] rounded-md transition-colors"
          title={isRawMode ? 'Switch to Form View' : 'Switch to Raw Edit Mode'}
        >
          {isRawMode ? '📋 Form View' : '📝 Raw Edit'}
        </button>
      </div>
      )}

      {/* Raw Editor or Settings */}
      {selectedConfig && isRawMode ? (
        <RawEditor
          filePath={selectedConfig.path}
          content={selectedConfig.rawContent || ''}
          onSave={(content) => {
            // Save raw content
            setSelectedConfig({ ...selectedConfig, rawContent: content });
            handleSave();
          }}
          onCancel={() => setIsRawMode(false)}
        />
      ) : (
        selectedConfig && (
          <div className="space-y-1">
            {selectedConfig.settings.map((setting, index) => (
              <div key={`${setting.key}-${index}`}>
                {renderSettingInput(setting, handleSettingChange)}
              </div>
            ))}
          </div>
        )
      )}
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
