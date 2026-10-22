import { useState } from "react";
import { createPortal } from "react-dom";
import { Wand2, X, CheckCircle2, Copy, ExternalLink } from "lucide-react";

interface TemplateEntry {
  key: string;
  value: string | number | boolean;
  description: string;
}

interface Template {
  id: string;
  name: string;
  description: string;
  category: "performance" | "vanilla+" | "server" | "visual";
  modId: string;
  configFile: string;
  entries: TemplateEntry[];
  note?: string;
  modrinthSlug?: string;
}

const TEMPLATES: Template[] = [
  {
    id: "sodium-perf",
    name: "Sodium — Max Performance",
    description: "Disable features that trade quality for speed. Best for low-end hardware.",
    category: "performance",
    modId: "sodium",
    configFile: "config/sodium-options.json",
    modrinthSlug: "sodium",
    entries: [
      { key: "useEntityCulling", value: true, description: "Skip rendering entities behind opaque blocks" },
      { key: "useParticleCulling", value: true, description: "Skip rendering particles out of view" },
      { key: "useFogOcclusion", value: true, description: "Use fog to hide distant geometry" },
      { key: "useSectionFaceCulling", value: true, description: "Cull chunk section faces" },
      { key: "quality.cloudQuality", value: "OFF", description: "Disable clouds entirely" },
      { key: "quality.weatherQuality", value: "FAST", description: "Simple weather rendering" },
      { key: "quality.leavesQuality", value: "FAST", description: "Fast leaf rendering" },
    ],
  },
  {
    id: "lithium-full",
    name: "Lithium — All Optimizations On",
    description: "Enable every available optimization. Safe for most modpacks.",
    category: "performance",
    modId: "lithium",
    configFile: "config/lithium.properties",
    modrinthSlug: "lithium",
    entries: [
      { key: "mixin.ai.pathing", value: true, description: "Optimize entity pathfinding" },
      { key: "mixin.ai.nearby_entity_tracking", value: true, description: "Faster entity neighbor lookup" },
      { key: "mixin.block.moving_block_shapes", value: true, description: "Cache piston block shapes" },
      { key: "mixin.chunk.palette", value: true, description: "Compact chunk palette storage" },
      { key: "mixin.world.chunk_ticking", value: true, description: "Skip unnecessary chunk ticks" },
      { key: "mixin.world.explosions", value: true, description: "Faster explosion calculations" },
    ],
  },
  {
    id: "dynamic-fps",
    name: "Dynamic FPS — Battery Saver",
    description: "Drastically reduce GPU usage when the game window is not focused.",
    category: "performance",
    modId: "dynamic-fps",
    configFile: "config/dynamic_fps.json",
    modrinthSlug: "dynamic-fps",
    entries: [
      { key: "idle_fps_target", value: 1, description: "Target FPS when window is idle" },
      { key: "background_fps_target", value: 5, description: "Target FPS when window is unfocused" },
      { key: "show_toasts", value: true, description: "Show notification when throttling" },
    ],
  },
  {
    id: "immediatelyfast-perf",
    name: "ImmediatelyFast — Recommended",
    description: "Recommended settings from the ImmediatelyFast author for best performance.",
    category: "performance",
    modId: "immediatelyfast",
    configFile: "config/immediatelyfast.json",
    modrinthSlug: "immediatelyfast",
    entries: [
      { key: "font_renderer_quality", value: 1.0, description: "Font render quality multiplier" },
      { key: "optimize_world_renderer", value: true, description: "Batch world geometry" },
      { key: "optimize_entity_renderer", value: true, description: "Batch entity geometry" },
      { key: "optimize_gui", value: true, description: "Batch GUI rendering" },
    ],
  },
  {
    id: "iris-vanilla-plus",
    name: "Iris — Low-Impact Shaders Ready",
    description: "Configure Iris to load a lightweight shader profile without tanking FPS.",
    category: "visual",
    modId: "iris",
    configFile: "config/iris.properties",
    modrinthSlug: "iris",
    entries: [
      { key: "shaderPack", value: "Complementary Unbound", description: "Shader pack name (must be installed)" },
      { key: "enableShaders", value: true, description: "Enable shader rendering" },
      { key: "shadowDistance", value: 6, description: "Shadow render distance in chunks" },
    ],
    note: "You still need to install the shader pack separately.",
  },
  {
    id: "journeymap-server",
    name: "JourneyMap — Server-Friendly",
    description: "Disable features that can lag servers or reveal hidden structures.",
    category: "server",
    modId: "journeymap",
    configFile: "config/journeymap/journeymap.config",
    modrinthSlug: "journeymap",
    entries: [
      { key: "autoMapPollFrequency", value: 5000, description: "Reduce map update frequency (ms)" },
      { key: "renderCaveIgnoreGlass", value: false, description: "Do not render through glass in caves" },
      { key: "minimapEnabled", value: true, description: "Keep minimap enabled" },
      { key: "fullscreenEnabled", value: true, description: "Keep fullscreen map enabled" },
    ],
  },
  {
    id: "appleskin-vanilla",
    name: "AppleSkin — Minimal HUD",
    description: "Show only the essential food saturation info without cluttering the HUD.",
    category: "vanilla+",
    modId: "appleskin",
    configFile: "config/appleskin.json",
    modrinthSlug: "appleskin",
    entries: [
      { key: "show_hunger_restore_overlay", value: true, description: "Show hunger restore preview" },
      { key: "show_saturation_overlay", value: false, description: "Hide saturation overlay (less visual noise)" },
      { key: "show_exhaustion_overlay", value: false, description: "Hide exhaustion overlay" },
    ],
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  performance: "Performance",
  "vanilla+": "Vanilla+",
  server: "Server",
  visual: "Visual",
};

const CATEGORY_COLORS: Record<string, string> = {
  performance: "bg-green-500/15 text-green-400 border-green-500/25",
  "vanilla+": "bg-blue-500/15 text-blue-400 border-blue-500/25",
  server: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  visual: "bg-orange-500/15 text-orange-400 border-orange-500/25",
};

interface Props { onClose: () => void; }

export function ConfigTemplates({ onClose }: Props) {
  const [selected, setSelected] = useState<Template | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const visible = categoryFilter === "all" ? TEMPLATES : TEMPLATES.filter(t => t.category === categoryFilter);

  async function copySnippet(template: Template) {
    const lines = template.entries.map(e => `${e.key} = ${e.value}`).join("\n");
    const snippet = `# ${template.name}\n# ${template.configFile}\n\n${lines}`;
    await navigator.clipboard.writeText(snippet);
    setCopied(template.id);
    setTimeout(() => setCopied(null), 1500);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {/* Left: template list */}
        <div className="w-72 shrink-0 flex flex-col border-r border-primary/15">
          <div className="flex items-center justify-between px-4 py-3.5 border-b border-primary/15">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-primary" />
              <span className="font-semibold text-sm">Config Templates</span>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-1.5 px-3 py-2.5 border-b border-primary/10">
            {["all", "performance", "vanilla+", "visual", "server"].map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors font-medium ${
                  categoryFilter === cat
                    ? "bg-primary/20 border-primary/40 text-primary"
                    : "border-primary/15 text-muted-foreground hover:border-primary/30"
                }`}
              >
                {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto py-2">
            {visible.map(t => (
              <button
                key={t.id}
                className={`w-full text-left px-4 py-2.5 hover:bg-primary/10 transition-colors ${selected?.id === t.id ? "bg-primary/15" : ""}`}
                onClick={() => setSelected(t)}
              >
                <div className="flex items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{t.name}</p>
                    <p className="text-[10px] text-muted-foreground opacity-60 mt-0.5 line-clamp-2">{t.description}</p>
                  </div>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 font-semibold ${CATEGORY_COLORS[t.category]}`}>
                    {CATEGORY_LABELS[t.category]}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Right: template detail */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {selected ? (
            <>
              <div className="px-5 py-4 border-b border-primary/15">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <h2 className="font-semibold text-sm">{selected.name}</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">{selected.description}</p>
                    <p className="text-[10px] font-mono text-muted-foreground opacity-50 mt-1">{selected.configFile}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {selected.modrinthSlug && (
                      <a
                        href={`https://modrinth.com/mod/${selected.modrinthSlug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"
                        title="View on Modrinth"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => copySnippet(selected)}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/10 transition-colors font-medium"
                    >
                      {copied === selected.id ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied === selected.id ? "Copied!" : "Copy snippet"}
                    </button>
                  </div>
                </div>
                {selected.note && (
                  <div className="mt-2 text-[11px] px-2.5 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-300/80">
                    ⚠ {selected.note}
                  </div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-2">
                {selected.entries.map(e => (
                  <div key={e.key} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-primary/15 bg-card/60">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-mono font-medium">{e.key}</p>
                      <p className="text-[10px] text-muted-foreground opacity-60 mt-0.5">{e.description}</p>
                    </div>
                    <span className={`text-[11px] font-mono px-2 py-0.5 rounded-md shrink-0 ${
                      e.value === true ? "bg-green-500/15 text-green-400"
                      : e.value === false ? "bg-red-500/15 text-red-400"
                      : "bg-primary/10 text-primary"
                    }`}>
                      {String(e.value)}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center space-y-2">
                <Wand2 className="w-10 h-10 mx-auto opacity-20" />
                <p className="text-sm opacity-60">Select a template to see its settings</p>
                <p className="text-xs opacity-40">Copy the snippet and paste it into your config file</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
