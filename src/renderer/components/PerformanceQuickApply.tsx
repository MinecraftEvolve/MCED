import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { Zap, X, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useAppStore } from "@/store";

// Mirror the TEMPLATES from ConfigTemplates but without the full component import
interface TemplateEntry {
  key: string;
  value: string | number | boolean;
}

interface QuickTemplate {
  id: string;
  name: string;
  modId: string;
  configFile: string;
  entries: TemplateEntry[];
  format: "toml" | "json" | "properties";
}

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: "sodium-perf",
    name: "Sodium — Max Performance",
    modId: "sodium",
    configFile: "config/sodium-options.json",
    format: "json",
    entries: [
      { key: "useEntityCulling", value: true },
      { key: "useParticleCulling", value: true },
      { key: "useFogOcclusion", value: true },
      { key: "useSectionFaceCulling", value: true },
    ],
  },
  {
    id: "lithium-full",
    name: "Lithium — All Optimizations",
    modId: "lithium",
    configFile: "config/lithium.properties",
    format: "properties",
    entries: [
      { key: "mixin.ai.pathing", value: true },
      { key: "mixin.ai.nearby_entity_tracking", value: true },
      { key: "mixin.block.moving_block_shapes", value: true },
      { key: "mixin.chunk.palette", value: true },
      { key: "mixin.world.chunk_ticking", value: true },
      { key: "mixin.world.explosions", value: true },
    ],
  },
  {
    id: "dynamic-fps",
    name: "Dynamic FPS — Battery Saver",
    modId: "dynamic-fps",
    configFile: "config/dynamic_fps.json",
    format: "json",
    entries: [
      { key: "idle_fps_target", value: 1 },
      { key: "background_fps_target", value: 5 },
      { key: "show_toasts", value: true },
    ],
  },
  {
    id: "immediatelyfast-perf",
    name: "ImmediatelyFast — Recommended",
    modId: "immediatelyfast",
    configFile: "config/immediatelyfast.json",
    format: "json",
    entries: [
      { key: "font_renderer_quality", value: 1.0 },
      { key: "optimize_world_renderer", value: true },
      { key: "optimize_entity_renderer", value: true },
      { key: "optimize_gui", value: true },
    ],
  },
];

function buildContent(template: QuickTemplate, existing: string | null): string {
  if (template.format === "json") {
    let obj: Record<string, any> = {};
    if (existing) {
      try { obj = JSON.parse(existing); } catch { obj = {}; }
    }
    for (const e of template.entries) {
      obj[e.key] = e.value;
    }
    return JSON.stringify(obj, null, 2);
  }
  if (template.format === "properties") {
    const lines: string[] = existing ? existing.split("\n") : [];
    for (const e of template.entries) {
      const idx = lines.findIndex(l => l.startsWith(e.key + "=") || l.startsWith(e.key + " ="));
      const line = `${e.key}=${e.value}`;
      if (idx >= 0) lines[idx] = line;
      else lines.push(line);
    }
    return lines.join("\n");
  }
  return existing ?? "";
}

interface Props { onClose: () => void; }

export function PerformanceQuickApply({ onClose }: Props) {
  const { mods, currentInstance } = useAppStore();
  const installedModIds = useMemo(() => new Set(mods.map(m => m.modId.toLowerCase().replace(/[_-]/g, ""))), [mods]);

  const applicable = useMemo(() =>
    QUICK_TEMPLATES.filter(t => installedModIds.has(t.modId.toLowerCase().replace(/[_-]/g, ""))),
    [installedModIds]
  );

  const [selected, setSelected] = useState<Set<string>>(new Set(applicable.map(t => t.id)));
  const [phase, setPhase] = useState<"idle" | "applying" | "done">("idle");
  const [results, setResults] = useState<{ id: string; ok: boolean }[]>([]);

  async function handleApply() {
    if (!currentInstance) return;
    setPhase("applying");
    const base = currentInstance.path.replace(/[\\/]$/, "");
    const out: { id: string; ok: boolean }[] = [];

    for (const template of applicable) {
      if (!selected.has(template.id)) continue;
      const configPath = base + "/" + template.configFile;
      const existing = await window.api.readFile(configPath);
      const newContent = buildContent(template, existing.content ?? null);
      const wr = await window.api.writeFile(configPath, newContent);
      out.push({ id: template.id, ok: wr.success });
    }
    setResults(out);
    setPhase("done");
  }

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/15 shrink-0">
          <div className="p-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Zap className="w-4 h-4 text-yellow-400" />
          </div>
          <span className="font-semibold text-sm">Performance Quick-Apply</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {applicable.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground text-sm opacity-60">
              <Zap className="w-8 h-8 opacity-20" />
              <p>No performance mods detected.</p>
              <p className="text-xs">Install Sodium, Lithium, Dynamic FPS, or ImmediatelyFast to use this feature.</p>
            </div>
          )}
          {phase === "done" && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-sm">
              <Check className="w-6 h-6 text-green-400" />
              <p className="text-green-400">Applied {results.filter(r => r.ok).length} template{results.filter(r => r.ok).length !== 1 ? "s" : ""}</p>
              {results.some(r => !r.ok) && <p className="text-orange-400 text-xs">{results.filter(r => !r.ok).length} failed to write</p>}
            </div>
          )}
          {phase === "applying" && <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Applying…</div>}
          {phase === "idle" && applicable.length > 0 && (
            <div className="divide-y divide-primary/10">
              {applicable.map(t => (
                <div key={t.id} className="flex items-start gap-3 px-5 py-3 hover:bg-primary/5 cursor-pointer" onClick={() => toggle(t.id)}>
                  <input type="checkbox" checked={selected.has(t.id)} onChange={() => toggle(t.id)} className="rounded mt-0.5 shrink-0" onClick={e => e.stopPropagation()} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium">{t.name}</p>
                    <p className="text-[10px] font-mono text-muted-foreground opacity-50 mt-0.5">{t.configFile}</p>
                    <p className="text-[10px] text-muted-foreground opacity-60 mt-0.5">{t.entries.length} settings will be applied</p>
                  </div>
                </div>
              ))}
              {QUICK_TEMPLATES.filter(t => !applicable.find(a => a.id === t.id)).length > 0 && (
                <div className="px-5 py-3 text-[11px] text-muted-foreground opacity-40">
                  {QUICK_TEMPLATES.filter(t => !applicable.find(a => a.id === t.id)).length} template{QUICK_TEMPLATES.filter(t => !applicable.find(a => a.id === t.id)).length !== 1 ? "s" : ""} not applicable (mod not installed)
                </div>
              )}
            </div>
          )}
        </div>

        {phase === "idle" && applicable.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-primary/15 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-orange-400/80">
              <AlertTriangle className="w-3.5 h-3.5" />Merges into existing config files
            </div>
            <button onClick={handleApply} disabled={selected.size === 0 || !currentInstance} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 disabled:opacity-40 font-semibold hover:bg-yellow-500/30">
              <Zap className="w-3.5 h-3.5" />Apply {selected.size}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
