import React, { useState } from 'react';
import { Save, Layers } from 'lucide-react';

interface DimensionEditorProps {
  instancePath: string;
}

export const DimensionEditor: React.FC<DimensionEditorProps> = ({ instancePath }) => {
  const [dimConfig, setDimConfig] = useState({
    id: '',
    generator: 'minecraft:noise',
    effects: 'minecraft:overworld',
    hasRain: true,
    hasSkylight: true,
    hasCeiling: false,
    ultraWarm: false,
    natural: true,
    ambientLight: 0,
  });

  const saveDimension = async () => {
    const code = `// Custom Dimension
StartupEvents.registry('dimension', event => {
  event.create('kubejs:${dimConfig.id}')
    .generator('${dimConfig.generator}')
    .effects('${dimConfig.effects}')
    .hasSkyLight(${dimConfig.hasSkylight})
    .hasRain(${dimConfig.hasRain})
    .hasCeiling(${dimConfig.hasCeiling})
    .ultraWarm(${dimConfig.ultraWarm})
    .natural(${dimConfig.natural})
    .ambientLight(${dimConfig.ambientLight})
})`;

    try {
      const scriptPath = `startup/dimension_${dimConfig.id}.js`;
      await window.api.kubeJSWriteScript(scriptPath, code);
      alert('Dimension saved successfully!');
    } catch (error) {
      console.error('Failed to save dimension:', error);
      alert('Failed to save dimension');
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Custom Dimension
          </h3>
          <button
            onClick={saveDimension}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Create a custom dimension for your modpack
        </p>
      </div>

      <div className="space-y-4 bg-secondary/20 border border-border rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Dimension ID</label>
          <input
            type="text"
            value={dimConfig.id}
            onChange={e => setDimConfig({ ...dimConfig, id: e.target.value })}
            placeholder="my_dimension"
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Generator Type</label>
          <select
            value={dimConfig.generator}
            onChange={e => setDimConfig({ ...dimConfig, generator: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
          >
            <option value="minecraft:noise">Noise (Normal World)</option>
            <option value="minecraft:flat">Flat</option>
            <option value="minecraft:debug">Debug</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Visual Effects</label>
          <select
            value={dimConfig.effects}
            onChange={e => setDimConfig({ ...dimConfig, effects: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
          >
            <option value="minecraft:overworld">Overworld</option>
            <option value="minecraft:the_nether">Nether</option>
            <option value="minecraft:the_end">End</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Ambient Light (0-1)</label>
          <input
            type="number"
            step="0.1"
            min="0"
            max="1"
            value={dimConfig.ambientLight}
            onChange={e => setDimConfig({ ...dimConfig, ambientLight: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 bg-background border border-border rounded text-foreground"
          />
        </div>

        <div className="space-y-3 pt-4 border-t border-border">
          <h4 className="text-sm font-semibold text-foreground">Features</h4>
          
          {[
            { key: 'hasSkylight', label: 'Has Skylight' },
            { key: 'hasRain', label: 'Has Rain/Snow' },
            { key: 'hasCeiling', label: 'Has Bedrock Ceiling' },
            { key: 'ultraWarm', label: 'Ultra Warm (like Nether)' },
            { key: 'natural', label: 'Natural (mob spawning, etc)' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={dimConfig[key as keyof typeof dimConfig] as boolean}
                onChange={e =>
                  setDimConfig({ ...dimConfig, [key]: e.target.checked })
                }
                className="rounded border-border"
              />
              <label className="text-sm text-foreground">{label}</label>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 p-4 bg-secondary/20 border border-border rounded-lg">
        <h4 className="text-sm font-semibold text-foreground mb-2">Preview</h4>
        <pre className="text-xs text-muted-foreground overflow-auto">
          {`StartupEvents.registry('dimension', event => {
  event.create('kubejs:${dimConfig.id || '<id>'}')
    .generator('${dimConfig.generator}')
    .effects('${dimConfig.effects}')
    .hasSkyLight(${dimConfig.hasSkylight})
})`}
        </pre>
      </div>
    </div>
  );
};
