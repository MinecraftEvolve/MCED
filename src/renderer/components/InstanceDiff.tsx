import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, FolderOpen, GitCompare, Loader2, RefreshCw, X } from "lucide-react";
import { useAppStore } from "@/store";

export function InstanceDiff() {
  const { currentInstance, setCurrentInstance } = useAppStore();
  const [pathB, setPathB] = useState("");
  const [nameA, setNameA] = useState("");
  const [nameB, setNameB] = useState("");
  const [loading, setLoading] = useState(false);
  const [diff, setDiff] = useState<{ added: string[]; removed: string[]; shared: string[] } | null>(null);
  const [otherRecent, setOtherRecent] = useState<Array<{ path: string; name: string }>>([]);

  useEffect(() => {
    const loadRecent = async () => {
      if (!currentInstance) return;
      const recents = await window.api.getRecentInstances?.();
      if (Array.isArray(recents)) {
        setOtherRecent(
          recents
            .filter((r) => r.path !== currentInstance.path)
            .map((r) => ({ path: r.path, name: r.name || r.path.split(/[\\/]/).pop() || "Instance" }))
        );
      }
      setNameA(currentInstance.name || currentInstance.path.split(/[\\/]/).pop() || "Current Instance");
    };
    loadRecent();
  }, [currentInstance]);

  async function pickDirectory() {
    try {
      const res = await window.api.pickDirectory?.();
      if (res?.path) {
        setPathB(res.path);
        setNameB(res.path.split(/[\\/]/).pop() || "Selected Instance");
      }
    } catch {}
  }

  const summary = useMemo(() => {
    if (!diff) return null;
    return {
      added: diff.added.length,
      removed: diff.removed.length,
      shared: diff.shared.length,
    };
  }, [diff]);

  async function runDiff() {
    if (!currentInstance || !pathB) return;
    setLoading(true);
    try {
      const result = await window.api.compareInstances?.(currentInstance.path, pathB);
      if (result?.success) {
        setDiff(result.data || { added: [], removed: [], shared: [] });
      }
    } catch (error) {
      console.error("Instance diff failed:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setCurrentInstance(null)}>
      <div
        className="mx-4 flex max-h-[85vh] w-full max-w-2xl flex-col rounded-2xl border border-primary/30 bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-primary/15 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-1.5">
              <GitCompare className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Instance Diff</p>
              <p className="text-[11px] text-muted-foreground opacity-60">Compare mod lists between two instances</p>
            </div>
          </div>
          <button onClick={() => setCurrentInstance(null)} className="rounded-lg p-1.5 text-muted-foreground transition-colors duration-200 hover:bg-primary/10 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-3 border-b border-primary/10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 truncate rounded-xl border border-primary/20 bg-background/60 px-3 py-2 text-sm text-muted-foreground opacity-70">
              {nameA || currentInstance?.path || "No instance open"}
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            <div className="relative flex-1">
              {otherRecent.length > 0 && !pathB ? (
                <select
                  className="w-full cursor-pointer appearance-none rounded-xl border border-primary/20 bg-background/60 px-3 py-2 text-sm text-foreground outline-none transition-colors duration-200 focus:border-primary"
                  value={pathB}
                  onChange={(e) => {
                    const r = otherRecent.find((x) => x.path === e.target.value);
                    setPathB(e.target.value);
                    setNameB(r?.name ?? e.target.value.split(/[\\/]/).pop() ?? "");
                  }}
                >
                  <option value="">Select recent instance…</option>
                  {otherRecent.map((r) => (
                    <option key={r.path} value={r.path}>
                      {r.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="truncate rounded-xl border border-primary/20 bg-background/60 px-3 py-2 text-sm text-muted-foreground">
                  {nameB || "No instance selected"}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={pickDirectory}
              className="flex items-center gap-1.5 rounded-lg border border-primary/30 px-3 py-1.5 text-xs text-foreground transition-colors duration-200 hover:bg-primary/10"
            >
              <FolderOpen className="h-3.5 w-3.5" />
              Browse…
            </button>
            <button
              onClick={runDiff}
              disabled={!currentInstance || !pathB || loading}
              className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground transition-colors duration-200 disabled:opacity-40"
            >
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {loading ? "Comparing..." : "Compare"}
            </button>
          </div>
        </div>

        {diff && (
          <div className="space-y-4 p-5">
            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-emerald-400">
                <div className="text-[10px] uppercase tracking-wide text-emerald-300/80">Added</div>
                <div className="mt-1 text-lg font-bold">{summary?.added ?? 0}</div>
              </div>
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-red-400">
                <div className="text-[10px] uppercase tracking-wide text-red-300/80">Removed</div>
                <div className="mt-1 text-lg font-bold">{summary?.removed ?? 0}</div>
              </div>
              <div className="rounded-xl border border-primary/20 bg-primary/10 p-3 text-primary">
                <div className="text-[10px] uppercase tracking-wide text-primary/80">Shared</div>
                <div className="mt-1 text-lg font-bold">{summary?.shared ?? 0}</div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              {diff.added.length > 0 && (
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-emerald-400">Added</p>
                  <ul className="space-y-1 text-xs text-foreground">
                    {diff.added.map((item) => (
                      <li key={item} className="truncate">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {diff.removed.length > 0 && (
                <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-red-400">Removed</p>
                  <ul className="space-y-1 text-xs text-foreground">
                    {diff.removed.map((item) => (
                      <li key={item} className="truncate">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {diff.shared.length > 0 && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Shared</p>
                  <ul className="space-y-1 text-xs text-foreground">
                    {diff.shared.map((item) => (
                      <li key={item} className="truncate">• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
