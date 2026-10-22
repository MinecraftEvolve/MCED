import { useState } from "react";
import { createPortal } from "react-dom";
import { Cpu, X, Check, Copy, Info } from "lucide-react";
import { useAppStore } from "@/store";
import { useSettingsStore } from "@/store/settingsStore";

interface Suggestion {
  flag: string;
  reason: string;
  category: "memory" | "gc" | "perf" | "debug";
}

interface Props { onClose: () => void; }

function buildSuggestions(modCount: number, maxRamMb: number): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const xmx = `${maxRamMb}M`;
  const xms = `${Math.round(maxRamMb * 0.5)}M`;

  suggestions.push({ flag: `-Xmx${xmx}`, reason: `Max heap = ${maxRamMb} MB`, category: "memory" });
  suggestions.push({ flag: `-Xms${xms}`, reason: `Initial heap = ${Math.round(maxRamMb * 0.5)} MB (avoids GC spikes on startup)`, category: "memory" });

  if (maxRamMb >= 6144) {
    suggestions.push({ flag: "-XX:+UseG1GC", reason: "G1GC is recommended for heaps ≥ 6 GB", category: "gc" });
    suggestions.push({ flag: "-XX:MaxGCPauseMillis=200", reason: "Target GC pause ≤ 200ms", category: "gc" });
    suggestions.push({ flag: "-XX:G1HeapRegionSize=32M", reason: "Larger G1 regions for large heap", category: "gc" });
    suggestions.push({ flag: "-XX:G1NewSizePercent=20", reason: "Reserve 20% for young gen allocation", category: "gc" });
    suggestions.push({ flag: "-XX:G1MaxNewSizePercent=40", reason: "Cap young gen at 40%", category: "gc" });
    suggestions.push({ flag: "-XX:G1ReservePercent=20", reason: "Reserve 20% as emergency overflow", category: "gc" });
    suggestions.push({ flag: "-XX:+G1UseAdaptiveIHOP", reason: "Adaptive IHOP improves marking timing", category: "gc" });
  } else {
    suggestions.push({ flag: "-XX:+UseZGC", reason: "ZGC has very low pause times for heaps < 6 GB", category: "gc" });
    suggestions.push({ flag: "-XX:SoftMaxHeapSize=" + Math.round(maxRamMb * 0.9) + "M", reason: "Let ZGC stay ~10% below max", category: "gc" });
  }

  suggestions.push({ flag: "-XX:+UnlockExperimentalVMOptions", reason: "Required for some experimental flags", category: "perf" });
  suggestions.push({ flag: "-XX:+AlwaysPreTouch", reason: "Pre-fault memory pages — reduces stutters during gameplay", category: "perf" });
  suggestions.push({ flag: "-XX:+DisableExplicitGC", reason: "Prevent mods from triggering System.gc()", category: "perf" });
  suggestions.push({ flag: "-XX:+UseStringDeduplication", reason: "Deduplicate identical strings — saves memory with many mods", category: "perf" });
  suggestions.push({ flag: "-XX:+ParallelRefProcEnabled", reason: "Process references in parallel", category: "perf" });

  if (modCount > 100) {
    suggestions.push({ flag: "-XX:InitiatingHeapOccupancyPercent=15", reason: `${modCount} mods detected — start GC earlier to avoid full-heap collections`, category: "gc" });
    suggestions.push({ flag: "-Dfml.ignorePatchDiscrepancies=true", reason: "Suppress Forge patch mismatch warnings with large modpacks", category: "debug" });
  }

  return suggestions;
}

const CATEGORY_COLORS: Record<string, string> = {
  memory: "bg-blue-500/15 text-blue-400 border-blue-500/25",
  gc: "bg-green-500/15 text-green-400 border-green-500/25",
  perf: "bg-purple-500/15 text-purple-400 border-purple-500/25",
  debug: "bg-orange-500/15 text-orange-400 border-orange-500/25",
};

export function JvmOptimizer({ onClose }: Props) {
  const { mods } = useAppStore();
  const { settings, updateSettings } = useSettingsStore();
  const [copied, setCopied] = useState(false);
  const [applied, setApplied] = useState(false);
  const [maxRam, setMaxRam] = useState(settings.jvmMaxMemory ?? 4096);
  const [catFilter, setCatFilter] = useState("all");

  const suggestions = buildSuggestions(mods.length, maxRam);
  const visible = catFilter === "all" ? suggestions : suggestions.filter(s => s.category === catFilter);
  const flagString = suggestions.map(s => s.flag).join(" ");

  function handleCopy() {
    navigator.clipboard.writeText(flagString);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function handleApply() {
    updateSettings({ jvmMaxMemory: maxRam, jvmMinMemory: Math.round(maxRam * 0.5) });
    setApplied(true);
    setTimeout(() => setApplied(false), 2000);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/15 shrink-0">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Cpu className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">JVM Arguments Optimizer</span>
          <span className="text-xs text-muted-foreground opacity-60 ml-1">{mods.length} mods loaded</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* RAM slider */}
        <div className="px-5 py-3 border-b border-primary/10 shrink-0">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium">Max RAM (Xmx)</span>
            <span className="text-xs font-mono text-primary">{maxRam >= 1024 ? (maxRam / 1024).toFixed(1) + " GB" : maxRam + " MB"}</span>
          </div>
          <input
            type="range"
            min={1024}
            max={16384}
            step={512}
            value={maxRam}
            onChange={e => setMaxRam(Number(e.target.value))}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>1 GB</span><span>8 GB</span><span>16 GB</span>
          </div>
          <div className="flex items-start gap-1.5 mt-2 text-[11px] text-muted-foreground">
            <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            {mods.length > 100
              ? `With ${mods.length} mods, ≥ 6 GB RAM is strongly recommended.`
              : mods.length > 50
              ? `With ${mods.length} mods, 4–6 GB is a good range.`
              : `With ${mods.length} mods, 2–4 GB is typically enough.`}
          </div>
        </div>

        {/* Category filter */}
        <div className="flex gap-1.5 px-5 py-2.5 border-b border-primary/10 shrink-0">
          {["all", "memory", "gc", "perf", "debug"].map(cat => (
            <button
              key={cat}
              onClick={() => setCatFilter(cat)}
              className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors font-medium ${
                catFilter === cat ? "bg-primary/20 border-primary/40 text-primary" : "border-primary/15 text-muted-foreground hover:border-primary/30"
              }`}
            >
              {cat === "all" ? "All" : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>

        {/* Flags */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {visible.map(s => (
            <div key={s.flag} className="flex items-start gap-3 px-3 py-2.5 rounded-xl border border-primary/15 bg-card/60">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-mono font-medium">{s.flag}</p>
                <p className="text-[10px] text-muted-foreground opacity-60 mt-0.5">{s.reason}</p>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full border shrink-0 font-semibold ${CATEGORY_COLORS[s.category]}`}>
                {s.category}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-3 border-t border-primary/15 shrink-0">
          <button onClick={handleApply} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium ${applied ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-primary/30 hover:bg-primary/10"}`}>
            {applied ? <><Check className="w-3.5 h-3.5" />Applied!</> : "Apply RAM to Settings"}
          </button>
          <button onClick={handleCopy} className="ml-auto flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium">
            {copied ? <><Check className="w-3.5 h-3.5" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy All Flags</>}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
