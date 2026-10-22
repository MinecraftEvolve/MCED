import { useState, useRef } from "react";
import { Search, X, FileText, Loader2, ChevronRight } from "lucide-react";

interface SearchHit {
  file: string;
  line: number;
  text: string;
}

interface Props {
  onClose: () => void;
  /** Called when user clicks a result so the parent can open the file */
  onOpenFile?: (path: string) => void;
}

const CONFIG_EXTS = new Set(["toml", "json", "yaml", "yml", "properties", "cfg", "conf", "ini", "txt"]);

function isConfigFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return CONFIG_EXTS.has(ext);
}

async function listAllFiles(path?: string): Promise<string[]> {
  const entries: any[] = await window.api.remoteListFiles(path, false);
  const results: string[] = [];
  for (const e of entries) {
    if (e.isDirectory) {
      const sub = await listAllFiles(e.path);
      results.push(...sub);
    } else if (isConfigFile(e.path)) {
      results.push(e.path);
    }
  }
  return results;
}

export function RemoteConfigSearch({ onClose, onOpenFile }: Props) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [running, setRunning] = useState(false);
  const abortRef = useRef(false);

  async function handleSearch() {
    if (!query.trim() || running) return;
    abortRef.current = false;
    setRunning(true);
    setHits([]);
    setStatus("Listing files…");

    try {
      const files = await listAllFiles();
      const allHits: SearchHit[] = [];
      const lower = query.toLowerCase();

      for (let i = 0; i < files.length; i++) {
        if (abortRef.current) break;
        setStatus(`Reading ${i + 1} / ${files.length}: ${files[i].split("/").pop()}`);
        try {
          const content: string = await window.api.remoteReadFile(files[i]);
          const lines = content.split("\n");
          for (let l = 0; l < lines.length; l++) {
            if (lines[l].toLowerCase().includes(lower)) {
              allHits.push({ file: files[i], line: l + 1, text: lines[l].trim() });
            }
          }
        } catch { /* skip unreadable files */ }
        setHits([...allHits]);
      }
      setStatus(allHits.length === 0 ? "No matches found." : `Found ${allHits.length} match${allHits.length !== 1 ? "es" : ""} in ${new Set(allHits.map(h => h.file)).size} file${new Set(allHits.map(h => h.file)).size !== 1 ? "s" : ""}.`);
    } catch (e: any) {
      setStatus(`Error: ${e?.message}`);
    } finally {
      setRunning(false);
    }
  }

  // Group hits by file
  const byFile = hits.reduce<Record<string, SearchHit[]>>((acc, h) => {
    (acc[h.file] ??= []).push(h);
    return acc;
  }, {});

  const highlight = (text: string) => {
    const idx = text.toLowerCase().indexOf(query.toLowerCase());
    if (idx < 0) return <span>{text}</span>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/30 text-primary rounded px-0.5">{text.slice(idx, idx + query.length)}</mark>
        {text.slice(idx + query.length)}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[80vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-primary/15">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            placeholder="Search across all remote config files…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") handleSearch(); if (e.key === "Escape") onClose(); }}
            autoFocus
          />
          {running ? (
            <button onClick={() => { abortRef.current = true; }} className="text-xs text-orange-400 hover:text-orange-300 shrink-0">Cancel</button>
          ) : (
            <button
              onClick={handleSearch}
              disabled={!query.trim()}
              className="text-xs px-3 py-1 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 font-medium shrink-0"
            >Search</button>
          )}
          <button onClick={onClose} className="p-1 rounded hover:bg-primary/10 text-muted-foreground shrink-0"><X className="w-4 h-4" /></button>
        </div>

        {/* Status */}
        {(running || status) && (
          <div className="px-4 py-2 text-xs text-muted-foreground border-b border-primary/10 flex items-center gap-2">
            {running && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
            <span className="truncate">{status}</span>
          </div>
        )}

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {Object.entries(byFile).map(([file, fileHits]) => (
            <div key={file} className="rounded-xl border border-primary/15 overflow-hidden">
              <button
                className="w-full flex items-center gap-2 px-3 py-2 bg-card/60 hover:bg-primary/10 text-left transition-colors"
                onClick={() => onOpenFile?.(file)}
              >
                <FileText className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="flex-1 text-xs font-mono truncate">{file}</span>
                <span className="text-[10px] text-muted-foreground shrink-0">{fileHits.length} match{fileHits.length !== 1 ? "es" : ""}</span>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              </button>
              <div className="divide-y divide-primary/10">
                {fileHits.slice(0, 10).map((h, i) => (
                  <div key={i} className="px-3 py-1.5 font-mono text-[11px] text-foreground/80 flex gap-2">
                    <span className="text-muted-foreground shrink-0 w-8 text-right">{h.line}</span>
                    <span className="truncate">{highlight(h.text)}</span>
                  </div>
                ))}
                {fileHits.length > 10 && (
                  <div className="px-3 py-1 text-[10px] text-muted-foreground opacity-60">…and {fileHits.length - 10} more</div>
                )}
              </div>
            </div>
          ))}
          {!running && hits.length === 0 && !status && (
            <div className="text-center py-12 text-muted-foreground text-sm opacity-60">
              Type a query and press Enter or Search
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
