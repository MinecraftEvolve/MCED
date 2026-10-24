import { useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeftRight, X, Upload, Download, Loader2, Check, AlertTriangle, RefreshCw } from "lucide-react";
import { useAppStore } from "@/store";
import { useRemoteConnectionStore } from "@/store/remoteConnectionStore";

interface SyncEntry {
  relativePath: string;
  localPath: string;
  remotePath: string;
  status: "same" | "local-newer" | "remote-newer" | "local-only" | "remote-only" | "unknown";
  localContent: string | null;
  remoteContent: string | null;
}

interface Props { onClose: () => void; }

const CONFIG_EXTS = ["toml", "json", "yaml", "yml", "properties", "cfg", "conf", "ini"];

export function ConfigSync({ onClose }: Props) {
  const { currentInstance } = useAppStore();
  const { connectionStatus } = useRemoteConnectionStore();
  const [entries, setEntries] = useState<SyncEntry[]>([]);
  const [phase, setPhase] = useState<"idle" | "scanning" | "ready" | "syncing" | "done">("idle");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [syncDir, setSyncDir] = useState<"push" | "pull">("pull");
  const [syncedCount, setSyncedCount] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function handleScan() {
    if (!currentInstance) return;
    setPhase("scanning");
    setError(null);

    const base = currentInstance.path.replace(/[\\/]$/, "") + "/config";

    // Scan local
    const localScan = await window.api.readdirRecursive(base, { extensions: CONFIG_EXTS });
    const localFiles = new Map<string, string>();
    if (localScan.success && localScan.files) {
      for (const f of localScan.files) {
        const res = await window.api.readFile(f.path);
        if (res.success && res.content != null) localFiles.set(f.relativePath, res.content);
      }
    }

    // Scan remote
    let remoteFiles = new Map<string, string>();
    try {
      const remoteList = await window.api.remoteListFiles("config", true);
      for (const rf of remoteList) {
        if (!rf.isDirectory && CONFIG_EXTS.some(e => rf.name.endsWith("." + e))) {
          try {
            const content = await window.api.remoteReadFile(rf.path);
            const rel = rf.path.replace(/^config[\\/]/, "");
            // Reject paths that could escape the config directory
            const parts = rel.split(/[\\/]/);
            if (
              rel.startsWith("/") ||
              /^[a-zA-Z]:/.test(rel) ||
              parts.includes("..") ||
              parts.includes("") ||
              parts.some((p: string) => p.startsWith("."))
            ) continue;
            remoteFiles.set(rel, content);
          } catch { /* skip */ }
        }
      }
    } catch (e: any) {
      setError("Failed to list remote files: " + (e?.message ?? "unknown error"));
      setPhase("idle");
      return;
    }

    const allKeys = new Set([...localFiles.keys(), ...remoteFiles.keys()]);
    const result: SyncEntry[] = [];

    for (const rel of allKeys) {
      const lc = localFiles.get(rel) ?? null;
      const rc = remoteFiles.get(rel) ?? null;
      let status: SyncEntry["status"] = "unknown";
      if (lc != null && rc != null) status = lc === rc ? "same" : "unknown";
      else if (lc != null) status = "local-only";
      else status = "remote-only";

      result.push({
        relativePath: rel,
        localPath: base + "/" + rel,
        remotePath: "config/" + rel,
        status,
        localContent: lc,
        remoteContent: rc,
      });
    }

    result.sort((a, b) => {
      const order = { "local-newer": 0, "remote-newer": 1, "local-only": 2, "remote-only": 3, "same": 4, "unknown": 5 };
      return order[a.status] - order[b.status];
    });

    setEntries(result);
    setSelected(new Set(result.filter(e => e.status !== "same").map(e => e.relativePath)));
    setPhase("ready");
  }

  async function handleSync() {
    setPhase("syncing");
    let count = 0;
    for (const entry of entries) {
      if (!selected.has(entry.relativePath)) continue;
      try {
        if (syncDir === "push" && entry.localContent != null) {
          await window.api.remoteWriteFile(entry.remotePath, entry.localContent);
          count++;
        } else if (syncDir === "pull" && entry.remoteContent != null) {
          await window.api.writeFile(entry.localPath, entry.remoteContent);
          count++;
        }
      } catch { /* skip errors */ }
    }
    setSyncedCount(count);
    setPhase("done");
  }

  const toggleAll = () => {
    if (selected.size === entries.filter(e => e.status !== "same").length)
      setSelected(new Set());
    else
      setSelected(new Set(entries.filter(e => e.status !== "same").map(e => e.relativePath)));
  };

  const toggle = (rel: string) => {
    const next = new Set(selected);
    if (next.has(rel)) next.delete(rel); else next.add(rel);
    setSelected(next);
  };

  const STATUS_COLORS: Record<SyncEntry["status"], string> = {
    "same": "text-muted-foreground opacity-40",
    "local-newer": "text-blue-400",
    "remote-newer": "text-green-400",
    "local-only": "text-purple-400",
    "remote-only": "text-orange-400",
    "unknown": "text-muted-foreground",
  };

  const STATUS_LABELS: Record<SyncEntry["status"], string> = {
    "same": "Same",
    "local-newer": "Local newer",
    "remote-newer": "Remote newer",
    "local-only": "Local only",
    "remote-only": "Remote only",
    "unknown": "Differs",
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/15 shrink-0">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <ArrowLeftRight className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Server Config Sync</span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${connectionStatus === "connected" ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-red-500/30 text-red-400 bg-red-500/10"}`}>
            {connectionStatus === "connected" ? "Connected" : "Disconnected"}
          </span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {connectionStatus !== "connected" ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm py-12 opacity-60 flex-col gap-2">
            <AlertTriangle className="w-8 h-8 opacity-40" />
            Connect to a remote server first (Server button in toolbar)
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto">
              {phase === "idle" && (
                <div className="flex items-center justify-center py-16 flex-col gap-4">
                  <p className="text-sm text-muted-foreground opacity-60">Compare local and remote config folders</p>
                  <button onClick={handleScan} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium">
                    <RefreshCw className="w-3.5 h-3.5" />Scan Files
                  </button>
                </div>
              )}
              {phase === "scanning" && <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Scanning…</div>}
              {phase === "syncing" && <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Syncing…</div>}
              {phase === "done" && (
                <div className="flex items-center justify-center py-16 flex-col gap-3 text-green-400 text-sm">
                  <Check className="w-6 h-6" />
                  <p>Synced {syncedCount} file{syncedCount !== 1 ? "s" : ""}</p>
                  <button onClick={() => { setPhase("idle"); setEntries([]); }} className="text-xs text-muted-foreground hover:text-foreground mt-1">Scan again</button>
                </div>
              )}
              {(phase === "ready") && (
                <>
                  {error && <div className="px-5 py-2 text-xs text-red-400">{error}</div>}
                  <div className="flex items-center gap-3 px-5 py-2.5 border-b border-primary/10 text-xs text-muted-foreground sticky top-0 bg-card/90 backdrop-blur-sm">
                    <input type="checkbox" checked={selected.size > 0} onChange={toggleAll} className="rounded" />
                    <span>{entries.length} files — {entries.filter(e => e.status !== "same").length} differ</span>
                  </div>
                  <div className="divide-y divide-primary/10">
                    {entries.map(e => (
                      <div key={e.relativePath} className={`flex items-center gap-3 px-5 py-2.5 hover:bg-primary/5 cursor-pointer ${e.status === "same" ? "opacity-40" : ""}`} onClick={() => e.status !== "same" && toggle(e.relativePath)}>
                        <input type="checkbox" checked={selected.has(e.relativePath)} disabled={e.status === "same"} onChange={() => toggle(e.relativePath)} className="rounded shrink-0" onClick={ev => ev.stopPropagation()} />
                        <span className="text-xs font-mono flex-1 truncate">{e.relativePath}</span>
                        <span className={`text-[10px] shrink-0 ${STATUS_COLORS[e.status]}`}>{STATUS_LABELS[e.status]}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            {phase === "ready" && (
              <div className="flex items-center gap-2 px-5 py-3 border-t border-primary/15 shrink-0">
                <button onClick={() => setSyncDir("pull")} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${syncDir === "pull" ? "bg-primary/20 border-primary/40 text-primary" : "border-primary/20 text-muted-foreground"}`}>
                  <Download className="w-3.5 h-3.5" />Pull from remote
                </button>
                <button onClick={() => setSyncDir("push")} className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border transition-colors ${syncDir === "push" ? "bg-primary/20 border-primary/40 text-primary" : "border-primary/20 text-muted-foreground"}`}>
                  <Upload className="w-3.5 h-3.5" />Push to remote
                </button>
                <button onClick={handleSync} disabled={selected.size === 0} className="ml-auto flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 font-semibold">
                  <ArrowLeftRight className="w-3.5 h-3.5" />Sync {selected.size} file{selected.size !== 1 ? "s" : ""}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
