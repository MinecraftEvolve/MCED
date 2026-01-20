import React, { useEffect, useState } from "react";
import {
  AlertCircle,
  Code,
  FileCode,
  RefreshCw,
  FileText,
  Zap,
  Link,
  CheckSquare,
  AlertTriangle,
} from "lucide-react";
import { RecipeEditorMain } from "./RecipeEditor/RecipeEditorMain";
import { ScriptOrganizer } from "./ScriptOrganizer";
import { EventHandlerBuilder } from "./EventHandlers/EventHandlerBuilder";
import { ConflictDetector } from "./RecipeEditor/ConflictDetector";
import HelpSystem from "./HelpSystem";

interface KubeJSInfo {
  isInstalled: boolean;
  version: string | null;
  addons: Array<{
    id: string;
    name: string;
    version: string;
    features: string[];
  }>;
  scriptsPath: string | null;
}

interface KubeJSEditorProps {
  instancePath: string;
}

export const KubeJSEditor: React.FC<KubeJSEditorProps> = ({ instancePath }) => {
  const [kubeJSInfo, setKubeJSInfo] = useState<KubeJSInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"recipes" | "scripts" | "events" | "conflicts">(
    "recipes"
  );
  const [scripts, setScripts] = useState<
    Array<{
      name: string;
      path: string;
      type: "server" | "client" | "startup";
      size: number;
      modified: Date;
    }>
  >([]);

  useEffect(() => {
    detectKubeJS();
  }, [instancePath]);

  useEffect(() => {
    if (activeTab === "scripts" && kubeJSInfo?.scriptsPath) {
      loadScripts();
    }
  }, [activeTab, kubeJSInfo]);

  const detectKubeJS = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await window.api.kubeJSDetect(instancePath);
      if (result.success && result.data) {
        setKubeJSInfo(result.data);
      } else {
        setError(result.error || "Failed to detect KubeJS");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  const loadScripts = async () => {
    try {
      const result = await window.api.kubeJSListScripts(instancePath);
      if (result.success && result.data) {
        setScripts(result.data);
      } else {
        setScripts([]);
      }
    } catch (err) {
      setScripts([]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading KubeJS...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-destructive mb-4">{error}</p>
          <button
            onClick={detectKubeJS}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-primary/20 text-foreground rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!kubeJSInfo?.isInstalled) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center max-w-md">
          <Code className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2 text-foreground">KubeJS Not Detected</h2>
          <p className="text-muted-foreground mb-4 text-sm">
            KubeJS is not installed in this instance. Install KubeJS to unlock powerful scripting
            capabilities.
          </p>
          <a
            href="https://www.curseforge.com/minecraft/mc-mods/kubejs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm rounded transition-colors"
          >
            Learn More About KubeJS
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-background overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-2 border-b border-primary/20 bg-muted/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2 text-foreground">
              <FileCode className="w-5 h-5 text-primary" />
              KubeJS Editor
            </h1>
            <p className="text-xs text-muted-foreground">
              Version <span className="text-primary font-medium">{kubeJSInfo.version}</span> •
              <span className="text-green-500 font-medium"> {kubeJSInfo.addons.length}</span>{" "}
              addon(s)
            </p>
          </div>
          <button
            onClick={detectKubeJS}
            className="px-3 py-1.5 bg-secondary hover:bg-secondary/80 border border-primary/20 rounded text-sm flex items-center gap-2 transition-colors text-foreground"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Addons List */}
      {kubeJSInfo.addons.length > 0 && (
        <div className="flex-shrink-0 px-6 py-2 border-b border-primary/20 bg-muted/30">
          <h3 className="text-xs font-semibold mb-2 text-foreground flex items-center gap-2">
            <Code className="w-3 h-3 text-purple-500" />
            Detected Addons
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 max-h-32 overflow-y-auto pr-2">
            {kubeJSInfo.addons.map((addon) => (
              <div
                key={addon.id}
                className="bg-secondary hover:bg-secondary/80 p-2 rounded border border-primary/20 hover:border-primary/20/80 transition-all"
              >
                <div className="flex items-center justify-between mb-1">
                  <h4 className="font-medium text-foreground text-xs truncate flex-1">
                    {addon.name}
                  </h4>
                  <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded ml-1">
                    {addon.version}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {addon.features.slice(0, 1).map((feature) => (
                    <span
                      key={feature}
                      className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded border border-primary/20"
                    >
                      {feature.replace(/_/g, " ")}
                    </span>
                  ))}
                  {addon.features.length > 1 && (
                    <span className="text-[10px] text-muted-foreground bg-background px-1.5 py-0.5 rounded">
                      +{addon.features.length - 1}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex-shrink-0 px-6 border-b border-primary/20 bg-background">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          <button
            onClick={() => setActiveTab("recipes")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "recipes"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCode className="w-4 h-4" />
            Recipes
          </button>
          <button
            onClick={() => setActiveTab("scripts")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "scripts"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileText className="w-4 h-4" />
            Scripts
          </button>
          <button
            onClick={() => setActiveTab("events")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "events"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Zap className="w-4 h-4" />
            Events
          </button>
          <button
            onClick={() => setActiveTab("conflicts")}
            className={`px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap flex items-center gap-2 ${
              activeTab === "conflicts"
                ? "text-primary border-b-2 border-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            Conflicts
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-background">
        {activeTab === "recipes" && (
          <RecipeEditorMain
            instancePath={instancePath}
            addons={kubeJSInfo.addons.map((a) => a.id)}
          />
        )}
        {activeTab === "scripts" && (
          <div className="h-full overflow-hidden">
            <ScriptOrganizer
              instancePath={instancePath}
              scripts={scripts}
              hasProbeJS={kubeJSInfo.addons.some((a) => a.id === "probe")}
              onRefresh={loadScripts}
            />
          </div>
        )}
        {activeTab === "events" && (
          <div className="h-full overflow-auto p-6">
            <div className="max-w-6xl mx-auto">
              <EventHandlerBuilder instancePath={instancePath} />
            </div>
          </div>
        )}
        {activeTab === "conflicts" && (
          <div className="h-full overflow-hidden">
            <ConflictDetector instancePath={instancePath} />
          </div>
        )}
      </div>

      {/* Floating Help Button */}
      <HelpSystem />
    </div>
  );
};
