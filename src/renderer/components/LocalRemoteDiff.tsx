import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import { FileDiff, X, Loader2, ArrowLeftRight, Upload, Download } from "lucide-react";
import { useAppStore } from "@/store";
import { useRemoteConnectionStore } from "@/store/remoteConnectionStore";

interface DiffLine {
  type: "add" | "remove" | "same" | "header";
  text: string;
  lineA?: number;
  lineB?: number;
}

function computeDiff(a: string, b: string): DiffLine[] {
  const linesA = a.split("\n");
  const linesB = b.split("\n");
  const result: DiffLine[] = [];

  // Simple LCS-based diff
  const m = linesA.length, n = linesB.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      if (linesA[i] === linesB[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  let i = 0, j = 0;
  let lineA = 1, lineB = 1;
  while (i < m || j < n) {
    if (i < m && j < n && linesA[i] === linesB[j]) {
      result.push({ type: "same", text: linesA[i], lineA, lineB });
      i++; j++; lineA++; lineB++;
    } else if (j < n && (i >= m || dp[i][j + 1] >= dp[i + 1][j])) {
      result.push({ type: "add", text: linesB[j], lineB });
      j++; lineB++;
    } else {
      result.push({ type: "remove", text: linesA[i], lineA });
      i++; lineA++;
    }
  }
  return result;
}

interface Props { onClose: () => void; }

const CONFIG_EXTS = ["toml", "json", "yaml", "yml", "properties", "cfg", "conf", "ini"];

export function LocalRemoteDiff({ onClose }: Props) {
  const { currentInstance } = useAppStore();
  const { connectionStatus } = useRemoteConnectionStore();
  const [localFiles, setLocalFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [localContent, setLocalContent] = useState<string | null>(null);
  const [remoteContent, setRemoteContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pushed, setPushed] = useState(false);
  const [pulled, setPulled] = useState(false);

  const diff = useMemo(() => {
    if (localContent == null || remoteContent == null) return null;
    return computeDiff(localContent, remoteContent);
  }, [localContent, remoteContent]);

  const addCount = diff?.filter(l => l.type === "add").length ?? 0;
  const removeCount = diff?.filter(l => l.type === "remove").length ?? 0;

  async function loadFileList() {
    if (!currentInstance) return;
    setLoadingFiles(true);
    const base = currentInstance.path.replace(/[\\/]$/, "") + "/config";
    const scan = await window.api.readdirRecursive(base, { extensions: CONFIG_EXTS });
    if (scan.success && scan.files) {
      setLocalFiles(scan.files.map(f => f.relativePath));
    }
    setLoadingFiles(false);
  }

  async function loadDiff(relativePath: string) {
    if (!currentInstance) return;
    setSelectedFile(relativePath);
    setLoading(true);
    setError(null);
    setPushed(false); setPulled(false);

    const localPath = currentInstance.path.replace(/[\\/]$/, "") + "/config/" + relativePath;
    const remotePath = "config/" + relativePath;

    const [localRes, remoteRes] = await Promise.allSettled([
      window.api.readFile(localPath),
      window.api.remoteReadFile(remotePath),
    ]);

    setLocalContent(localRes.status === "fulfilled" && localRes.value.success ? (localRes.value.content ?? "") : null);
    setRemoteContent(remoteRes.status === "fulfilled" ? (remoteRes.value as string) : null);

    if (localRes.status === "rejected" && remoteRes.status === "rejected") {
      setError("Could not read either file");
    }
    setLoading(false);
  }

  async function handlePush() {
    if (!selectedFile || localContent == null) return;
    await window.api.remoteWriteFile("config/" + selectedFile, localContent);
    setRemoteContent(localContent);
    setPushed(true);
  }

  async function handlePull() {
    if (!selectedFile || remoteContent == null || !currentInstance) return;
    const localPath = currentInstance.path.replace(/[\\/]$/, "") + "/config/" + selectedFile;
    await window.api.writeFile(localPath, remoteContent);
    setLocalContent(remoteContent);
    setPulled(true);
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-5xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex h-[85vh] max-h-[90vh]" onClick={e => e.stopPropagation()}>
        {/* File list */}
        <div className="w-60 shrink-0 flex flex-col border-r border-primary/15">
          <div className="flex items-center gap-2 px-3 py-3.5 border-b border-primary/15">
            <FileDiff className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-sm flex-1">Local ↔ Remote Diff</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>

          {connectionStatus !== "connected" ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs px-3 text-center opacity-60">Connect to a remote server first</div>
          ) : (
            <>
              <div className="px-3 py-2 border-b border-primary/10 shrink-0">
                <button onClick={loadFileList} disabled={loadingFiles || !currentInstance} className="w-full flex items-center justify-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary font-medium disabled:opacity-40">
                  {loadingFiles ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowLeftRight className="w-3 h-3" />}
                  {loadingFiles ? "Loading…" : "Load file list"}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {localFiles.map(f => (
                  <button key={f} onClick={() => loadDiff(f)} className={`w-full text-left px-3 py-2 hover:bg-primary/10 text-[11px] font-mono truncate transition-colors ${selectedFile === f ? "bg-primary/15 text-primary" : "text-muted-foreground"}`}>
                    {f}
                  </button>
                ))}
                {localFiles.length === 0 && !loadingFiles && (
                  <div className="px-3 py-4 text-xs text-muted-foreground opacity-50 text-center">Click "Load file list"</div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Diff view */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-primary/15 shrink-0">
            {selectedFile ? (
              <>
                <span className="text-xs font-mono text-primary truncate flex-1">{selectedFile}</span>
                {diff && (
                  <>
                    <span className="text-[10px] text-green-400">+{addCount}</span>
                    <span className="text-[10px] text-red-400">-{removeCount}</span>
                  </>
                )}
                <button onClick={handlePush} disabled={!localContent || pushed} className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded border ${pushed ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-primary/20 hover:bg-primary/10"}`}>
                  <Upload className="w-3 h-3" />{pushed ? "Pushed" : "Push local→remote"}
                </button>
                <button onClick={handlePull} disabled={!remoteContent || pulled} className={`flex items-center gap-1 text-[11px] px-2 py-1 rounded border ${pulled ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-primary/20 hover:bg-primary/10"}`}>
                  <Download className="w-3 h-3" />{pulled ? "Pulled" : "Pull remote→local"}
                </button>
              </>
            ) : (
              <span className="text-xs text-muted-foreground opacity-60">Select a file to compare</span>
            )}
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {loading && <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Loading…</div>}
            {error && <div className="px-4 py-3 text-xs text-red-400">{error}</div>}
            {diff && !loading && (
              <>
                <div className="flex text-[10px] text-muted-foreground font-mono border-b border-primary/10 shrink-0">
                  <div className="w-1/2 px-3 py-1.5 border-r border-primary/10">Local</div>
                  <div className="w-1/2 px-3 py-1.5">Remote (server)</div>
                </div>
                <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-5">
                  {diff.map((line, i) => {
                    if (line.type === "same") return (
                      <div key={i} className="flex">
                        <div className="w-1/2 px-3 border-r border-primary/5 text-muted-foreground opacity-40 truncate">{line.text}</div>
                        <div className="w-1/2 px-3 text-muted-foreground opacity-40 truncate">{line.text}</div>
                      </div>
                    );
                    if (line.type === "remove") return (
                      <div key={i} className="flex bg-red-500/8">
                        <div className="w-1/2 px-3 border-r border-primary/5 text-red-300 truncate">
                          <span className="text-red-500/60 mr-1">-</span>{line.text}
                        </div>
                        <div className="w-1/2 px-3" />
                      </div>
                    );
                    if (line.type === "add") return (
                      <div key={i} className="flex bg-green-500/8">
                        <div className="w-1/2 border-r border-primary/5" />
                        <div className="w-1/2 px-3 text-green-300 truncate">
                          <span className="text-green-500/60 mr-1">+</span>{line.text}
                        </div>
                      </div>
                    );
                    return null;
                  })}
                </div>
              </>
            )}
            {!selectedFile && !loading && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm opacity-60">
                Select a file from the list to view diff
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
