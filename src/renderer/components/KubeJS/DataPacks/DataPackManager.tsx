import React, { useState } from "react";
import { Plus, Tag, Globe, Layers } from "lucide-react";
import { TagEditor } from "./TagEditor";
import { WorldGenEditor } from "./WorldGenEditor";
import { DimensionEditor } from "./DimensionEditor";

interface DataPackManagerProps {
  instancePath: string;
}

type DataPackType = "tags" | "worldgen" | "dimensions";

export const DataPackManager: React.FC<DataPackManagerProps> = ({ instancePath }) => {
  const [activeTab, setActiveTab] = useState<DataPackType>("tags");

  const tabs = [
    { id: "tags" as DataPackType, label: "Tags", icon: Tag },
    { id: "worldgen" as DataPackType, label: "World Generation", icon: Globe },
    { id: "dimensions" as DataPackType, label: "Dimensions", icon: Layers },
  ];

  return (
    <div className="flex flex-col h-full bg-background">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/20 bg-secondary/30">
        <h3 className="text-lg font-semibold text-foreground">Data Pack Integration</h3>
      </div>

      <div className="flex border-b border-primary/20 bg-secondary/20">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === id
                ? "border-primary text-primary bg-secondary/40"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/30"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto">
        {activeTab === "tags" && <TagEditor instancePath={instancePath} />}
        {activeTab === "worldgen" && <WorldGenEditor instancePath={instancePath} />}
        {activeTab === "dimensions" && <DimensionEditor instancePath={instancePath} />}
      </div>
    </div>
  );
};
