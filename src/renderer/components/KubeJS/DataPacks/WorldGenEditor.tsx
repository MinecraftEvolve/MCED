import React, { useState } from "react";
import { Save, Globe } from "lucide-react";

interface WorldGenEditorProps {
  instancePath: string;
}

export const WorldGenEditor: React.FC<WorldGenEditorProps> = ({ instancePath }) => {
  const [oreConfig, setOreConfig] = useState({
    block: "",
    size: 8,
    count: 10,
    minHeight: -64,
    maxHeight: 64,
    biomes: [] as string[],
  });

  const saveWorldGen = async () => {
    const worldgen = {
      type: "ore",
      config: oreConfig,
    };

    try {
      await window.api.kubeJSSaveWorldgen(instancePath, worldgen);
      alert("World generation saved successfully!");
    } catch (error) {
      console.error("Failed to save worldgen:", error);
      alert("Failed to save world generation");
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Ore Generation
          </h3>
          <button
            onClick={saveWorldGen}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure custom ore generation for your modpack
        </p>
      </div>

      <div className="space-y-4 bg-secondary/20 border border-primary/20 rounded-lg p-6">
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">Block ID</label>
          <input
            type="text"
            value={oreConfig.block}
            onChange={(e) => setOreConfig({ ...oreConfig, block: e.target.value })}
            placeholder="minecraft:copper_ore"
            className="w-full px-3 py-2 bg-background border border-primary/20 rounded text-foreground"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Vein Size</label>
            <input
              type="number"
              value={oreConfig.size}
              onChange={(e) => setOreConfig({ ...oreConfig, size: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-background border border-primary/20 rounded text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Veins per Chunk
            </label>
            <input
              type="number"
              value={oreConfig.count}
              onChange={(e) => setOreConfig({ ...oreConfig, count: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-background border border-primary/20 rounded text-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Min Height</label>
            <input
              type="number"
              value={oreConfig.minHeight}
              onChange={(e) => setOreConfig({ ...oreConfig, minHeight: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-background border border-primary/20 rounded text-foreground"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Max Height</label>
            <input
              type="number"
              value={oreConfig.maxHeight}
              onChange={(e) => setOreConfig({ ...oreConfig, maxHeight: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-background border border-primary/20 rounded text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Biomes (optional)
          </label>
          <input
            type="text"
            placeholder="Leave empty for all biomes"
            className="w-full px-3 py-2 bg-background border border-primary/20 rounded text-foreground"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Leave empty to generate in all biomes
          </p>
        </div>
      </div>

      <div className="mt-6 p-4 bg-secondary/20 border border-primary/20 rounded-lg">
        <h4 className="text-sm font-semibold text-foreground mb-2">Preview</h4>
        <pre className="text-xs text-muted-foreground overflow-auto">
          {`WorldgenEvents.add(event => {
  event.addOre(ore => {
    ore.id = 'kubejs:custom_ore'
    ore.addTarget('minecraft:stone', '${oreConfig.block || "<block>"}')
    ore.count(${oreConfig.count}).squared()
    ore.size = ${oreConfig.size}
  })
})`}
        </pre>
      </div>
    </div>
  );
};
