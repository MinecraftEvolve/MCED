import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { RotateCcw, X, Check, Loader2, AlertTriangle } from "lucide-react";
import { useAppStore } from "@/store";

interface ResetEntry {
  configPath: string;
  defaultPath: string;
  fileName: string;
}

interface Props { onClose: () => void; }

export function ConfigReset({ onClose }: Props) {
  const { currentInstance } = useAppStore();
  const [entries, setEntries] = useState<ResetEntry[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"loading" | "idle" | "applying" | "done">("loading");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => { load(); }, []);

  async function load() {
    if (!currentInstance) return;
    const base = currentInstance.path.replace(/[\\/]$/, "");
    const defaultsDir = base + "/defaultconfigs";
    const configDir = base + "/config";

    const scan = await window.api.readdirRecursive(defaultsDir, {});
    if (!scan.success || !scan.files) {
      setMessage("No defaultconfigs/ folder found for this instance.");
      setPhase("idle");
      return;
    }

    const found: ResetEntry[] = [];
    for (const f of scan.files) {
      const configPath = configDir + "/" + f.relativePath;
      const exists = await window.api.fileExists(configPath);
      if (exists) {
        found.push({ configPath, defaultPath: f.path, fileName: f.relativePath });
      }
    }

    setEntries(found);
    setSelected(new Set(found.map(e => e.configPath)));
    setPhase("idle");
  }

  async function handleReset() {
    setPhase("applying");
    for (const entry of entries) {
      if (!selected.has(entry.configPath)) continue;
      const src = await window.api.readFile(entry.defaultPath);
      if (src.success && src.content != null) {
        await window.api.writeFile(entry.configPath, src.content);
      }
    }
    setPhase("done");
  }

  const toggleAll = () => {
    if (selected.size === entries.length) setSelected(new Set());
    else setSelected(new Set(entries.map(e => e.configPath)));
  };

  const toggle = (path: string) => {
    const next = new Set(selected);
    if (next.has(path)) next.delete(path); else next.add(path);
    setSelected(next);
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/15 shrink-0">
          <div className="p-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <RotateCcw className="w-4 h-4 text-orange-400" />
          </div>
          <span className="font-semibold text-sm">Reset Configs to Defaults</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {phase === "loading" && <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>}
          {phase === "done" && <div className="flex items-center justify-center py-16 gap-2 text-green-400 text-sm"><Check className="w-5 h-5" />Reset complete</div>}
          {phase === "applying" && <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Resetting…</div>}
          {phase === "idle" && (message || entries.length === 0) && (
            <div className="px-5 py-8 text-sm text-muted-foreground text-center opacity-60">
              {message ?? "No config files with matching defaults found."}
              <br /><span className="text-xs">Files must exist in both <code>defaultconfigs/</code> and <code>config/</code>.</span>
            </div>
          )}
          {phase === "idle" && entries.length > 0 && (
            <>
              <div className="flex items-center gap-3 px-5 py-2.5 border-b border-primary/10 text-xs text-muted-foreground sticky top-0 bg-card/90">
                <input type="checkbox" checked={selected.size === entries.length} onChange={toggleAll} className="rounded" />
                <span>{entries.length} file{entries.length !== 1 ? "s" : ""} with defaults</span>
              </div>
              <div className="divide-y divide-primary/10">
                {entries.map(e => (
                  <div key={e.configPath} className="flex items-center gap-3 px-5 py-2.5 hover:bg-primary/5 cursor-pointer" onClick={() => toggle(e.configPath)}>
                    <input type="checkbox" checked={selected.has(e.configPath)} onChange={() => toggle(e.configPath)} className="rounded shrink-0" onClick={ev => ev.stopPropagation()} />
                    <span className="text-xs font-mono">{e.fileName}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {phase === "idle" && entries.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-primary/15 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-orange-400/80">
              <AlertTriangle className="w-3.5 h-3.5" />This overwrites your current configs
            </div>
            <button onClick={handleReset} disabled={selected.size === 0} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-orange-500/20 text-orange-400 border border-orange-500/30 disabled:opacity-40 font-semibold hover:bg-orange-500/30">
              <RotateCcw className="w-3.5 h-3.5" />Reset {selected.size}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
