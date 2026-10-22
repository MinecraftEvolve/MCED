import { useState } from "react";
import { GitCompare, FolderOpen, X, Loader2, Plus, Minus, RefreshCw, ArrowRight } from "lucide-react";
import { useAppStore } from "@/store";
import { ModInfo } from "@shared/types/mod.types";

interface DiffEntry {
  modId: string;
  name: string;
  type: "added" | "removed" | "changed";
  versionA?: string;
  versionB?: string;
}

interface Props {
  onClose: () => void;
}

async function scanInstance(instancePath: string): Promise<ModInfo[]> {
  try {
    const modsFolder = instancePath.replace(/[\\/]$/, "") + "/mods";
    const result = await window.api.scanMods(modsFolder);
    if (result.success) return (result.mods ?? []) as ModInfo[];
    return [];
  } catch { return []; }
}

function computeDiff(modsA: ModInfo[], modsB: ModInfo[]): DiffEntry[] {
  const mapA = new Map(modsA.map(m => [m.modId, m]));
  const mapB = new Map(modsB.map(m => [m.modId, m]));
  const entries: DiffEntry[] = [];

  for (const [id, mod] of mapA) {
    const b = mapB.get(id);
    if (!b) {
      entries.push({ modId: id, name: mod.name, type: "removed", versionA: mod.version });
    } else if (mod.version !== b.version) {
      entries.push({ modId: id, name: mod.name, type: "changed", versionA: mod.version, versionB: b.version });
    }
  }
  for (const [id, mod] of mapB) {
    if (!mapA.has(id)) {
      entries.push({ modId: id, name: mod.name, type: "added", versionB: mod.version });
    }
  }

  return entries.sort((a, b) => {
    const order = { removed: 0, changed: 1, added: 2 };
    return order[a.type] - order[b.type] || a.name.localeCompare(b.name);
  });
}

export function InstanceDiff({ onClose }: Props) {
  const { currentInstance, recentInstances } = useAppStore();
  const [pathB, setPathB] = useState("");
  const [diff, setDiff] = useState<DiffEntry[] | null>(null);
  const nameA = currentInstance?.name ?? "Current";
  const [nameB, setNameB] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherRecent = recentInstances.filter(r => r.path !== currentInstance?.path);

  async function pickDirectory() {
    try {
      const result: string | null = await window.electron.openDirectory();
      if (result) { setPathB(result); setNameB(result.split(/[\\/]/).pop() ?? result); }
    } catch {}
  }

  async function runDiff() {
    if (!currentInstance || !pathB) return;
    setLoading(true);
    setError(null);
    try {
      const [modsA, modsB] = await Promise.all([
        scanInstance(currentInstance.path),
        scanInstance(pathB),
      ]);
      if (modsB.length === 0 && modsA.length === 0) {
        setError("Could not scan mods from either instance.");
        return;
      }
      setDiff(computeDiff(modsA, modsB));
    } catch (e: any) {
      setError(e?.message ?? "Scan failed");
    } finally {
      setLoading(false);
    }
  }

  const added = diff?.filter(d => d.type === "added").length ?? 0;
  const removed = diff?.filter(d => d.type === "removed").length ?? 0;
  const changed = diff?.filter(d => d.type === "changed").length ?? 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary/15">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <GitCompare className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Instance Diff</p>
              <p className="text-[11px] text-muted-foreground opacity-60">Compare mod lists between two instances</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* Instance selector */}
        <div className="px-5 py-4 border-b border-primary/10 space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 px-3 py-2 rounded-xl bg-background/60 border border-primary/20 text-sm truncate opacity-70">
              {nameA || currentInstance?.path || "No instance open"}
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="flex-1 relative">
              {otherRecent.length > 0 && !pathB ? (
                <select
                  className="w-full px-3 py-2 rounded-xl bg-background/60 border border-primary/20 text-sm outline-none appearance-none cursor-pointer"
                  value={pathB}
                  onChange={e => {
                    const r = otherRecent.find(x => x.path === e.target.value);
                    setPathB(e.target.value);
                    setNameB(r?.name ?? e.target.value.split(/[\\/]/).pop() ?? "");
                  }}
                >
                  <option value="">Select recent instance…</option>
                  {otherRecent.map(r => <option key={r.path} value={r.path}>{r.name}</option>)}
                </select>
              ) : (
                <div className="px-3 py-2 rounded-xl bg-background/60 border border-primary/20 text-sm truncate">
                  {nameB || "No instance selected"}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={pickDirectory} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-primary/30 hover:bg-primary/10 transition-colors">
              <FolderOpen className="w-3.5 h-3.5" />Browse…
            </button>
            <button
              onClick={runDiff}
              disabled={!currentInstance || !pathB || loading}
              className="flex items-center gap-1.5 text-xs px-4 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 font-medium transition-colors"
            >
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Compare
            </button>
          </div>
        </div>

        {/* Summary badges */}
        {diff && (
          <div className="flex gap-3 px-5 py-3 border-b border-primary/10">
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-green-500/15 text-green-400 border border-green-500/20">
              <Plus className="w-3 h-3" />{added} added
            </span>
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-red-500/15 text-red-400 border border-red-500/20">
              <Minus className="w-3 h-3" />{removed} removed
            </span>
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-orange-500/15 text-orange-400 border border-orange-500/20">
              <RefreshCw className="w-3 h-3" />{changed} changed
            </span>
            {diff.length === 0 && <span className="text-xs text-muted-foreground opacity-60">Instances are identical</span>}
          </div>
        )}

        {error && <div className="px-5 py-2 text-xs text-red-400 bg-red-500/10 border-b border-red-500/20">{error}</div>}

        {/* Diff list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-1.5">
          {diff?.map(d => (
            <div key={d.modId} className={`flex items-center gap-3 px-3 py-2 rounded-xl border text-sm ${
              d.type === "added" ? "bg-green-500/8 border-green-500/20"
              : d.type === "removed" ? "bg-red-500/8 border-red-500/20"
              : "bg-orange-500/8 border-orange-500/20"
            }`}>
              {d.type === "added" && <Plus className="w-3.5 h-3.5 text-green-400 shrink-0" />}
              {d.type === "removed" && <Minus className="w-3.5 h-3.5 text-red-400 shrink-0" />}
              {d.type === "changed" && <RefreshCw className="w-3.5 h-3.5 text-orange-400 shrink-0" />}
              <span className="flex-1 font-medium">{d.name}</span>
              <span className="text-xs text-muted-foreground font-mono">
                {d.type === "changed" ? `${d.versionA} → ${d.versionB}` : d.versionA ?? d.versionB}
              </span>
            </div>
          ))}
          {!diff && !loading && (
            <div className="text-center py-12 text-muted-foreground text-sm opacity-60">
              Select a second instance and click Compare
            </div>
          )}
          {loading && (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
