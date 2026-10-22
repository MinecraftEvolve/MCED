import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Replace, X, Search, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useAppStore } from "@/store";

interface Match {
  filePath: string;
  fileName: string;
  lineNumber: number;
  lineText: string;
}

interface Props { onClose: () => void; }

const CONFIG_EXTS = ["toml", "json", "yaml", "yml", "properties", "cfg", "conf", "ini"];

export function BulkConfigReplace({ onClose }: Props) {
  const { currentInstance } = useAppStore();
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [phase, setPhase] = useState<"idle" | "searching" | "found" | "applying" | "done">("idle");
  const [appliedCount, setAppliedCount] = useState(0);
  const abortRef = useRef(false);

  async function handleSearch() {
    if (!currentInstance || !findText) return;
    abortRef.current = false;
    setPhase("searching");
    setMatches([]);

    const configDir = currentInstance.path.replace(/[\\/]$/, "") + "/config";
    const scan = await window.api.readdirRecursive(configDir, { extensions: CONFIG_EXTS });
    if (!scan.success || !scan.files) { setPhase("found"); return; }

    const found: Match[] = [];
    for (const f of scan.files) {
      if (abortRef.current) break;
      const res = await window.api.readFile(f.path);
      if (!res.success || !res.content) continue;
      const lines = res.content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        const hay = caseSensitive ? lines[i] : lines[i].toLowerCase();
        const needle = caseSensitive ? findText : findText.toLowerCase();
        if (hay.includes(needle)) {
          found.push({
            filePath: f.path,
            fileName: f.relativePath,
            lineNumber: i + 1,
            lineText: lines[i],
          });
        }
      }
    }

    setMatches(found);
    setSelected(new Set(found.map((_, i) => String(i))));
    setPhase("found");
  }

  async function handleApply() {
    setPhase("applying");
    const byFile = new Map<string, true>();
    matches.forEach((m, i) => { if (selected.has(String(i))) byFile.set(m.filePath, true); });
    let count = 0;
    const flags = caseSensitive ? "g" : "gi";
    const escaped = findText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    for (const filePath of byFile.keys()) {
      const res = await window.api.readFile(filePath);
      if (!res.success || !res.content) continue;
      const updated = res.content.replace(new RegExp(escaped, flags), replaceText);
      await window.api.writeFile(filePath, updated);
      count += matches.filter((m, i) => m.filePath === filePath && selected.has(String(i))).length;
    }
    setAppliedCount(count);
    setPhase("done");
  }

  const toggleAll = () => {
    if (selected.size === matches.length) setSelected(new Set());
    else setSelected(new Set(matches.map((_, i) => String(i))));
  };

  const toggleOne = (i: number) => {
    const next = new Set(selected);
    if (next.has(String(i))) next.delete(String(i)); else next.add(String(i));
    setSelected(next);
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/15 shrink-0">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Replace className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Bulk Find & Replace</span>
          <span className="text-xs text-muted-foreground ml-1 opacity-60">across all config files</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-3 border-b border-primary/10 space-y-2 shrink-0">
          <div className="flex gap-2">
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 bg-background/50">
              <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" placeholder="Find text…" value={findText} onChange={e => setFindText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()} />
            </div>
            <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 bg-background/50">
              <Replace className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground" placeholder="Replace with…" value={replaceText} onChange={e => setReplaceText(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
              <input type="checkbox" checked={caseSensitive} onChange={e => setCaseSensitive(e.target.checked)} className="rounded" />
              Case-sensitive
            </label>
            <button onClick={handleSearch} disabled={!findText || phase === "searching" || phase === "applying"} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 font-medium">
              {phase === "searching" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
              {phase === "searching" ? "Searching…" : "Search"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {phase === "idle" && <div className="flex items-center justify-center py-16 text-muted-foreground text-sm opacity-60">Enter a search term and click Search</div>}
          {phase === "searching" && <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Scanning config files…</div>}
          {phase === "done" && <div className="flex items-center justify-center py-16 gap-2 text-green-400 text-sm"><Check className="w-5 h-5" />Replaced {appliedCount} match{appliedCount !== 1 ? "es" : ""}</div>}
          {(phase === "found" || phase === "applying") && (
            matches.length === 0
              ? <div className="flex items-center justify-center py-16 text-muted-foreground text-sm opacity-60">No matches found</div>
              : <>
                  <div className="flex items-center gap-3 px-5 py-2.5 border-b border-primary/10 text-xs text-muted-foreground sticky top-0 bg-card/90 backdrop-blur-sm">
                    <input type="checkbox" checked={selected.size === matches.length} onChange={toggleAll} className="rounded" />
                    <span>{matches.length} match{matches.length !== 1 ? "es" : ""} in {new Set(matches.map(m => m.filePath)).size} file{new Set(matches.map(m => m.filePath)).size !== 1 ? "s" : ""}</span>
                    <span className="ml-auto">{selected.size} selected</span>
                  </div>
                  <div className="divide-y divide-primary/10">
                    {matches.map((m, i) => (
                      <div key={i} className={`flex items-start gap-3 px-5 py-2 hover:bg-primary/5 cursor-pointer ${selected.has(String(i)) ? "" : "opacity-40"}`} onClick={() => toggleOne(i)}>
                        <input type="checkbox" checked={selected.has(String(i))} onChange={() => toggleOne(i)} className="rounded mt-1 shrink-0" onClick={e => e.stopPropagation()} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[11px] font-mono text-primary truncate">{m.fileName}</span>
                            <span className="text-[10px] text-muted-foreground opacity-60">line {m.lineNumber}</span>
                          </div>
                          <div className="text-[11px] font-mono text-muted-foreground truncate">{m.lineText.trim()}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
          )}
        </div>

        {phase === "found" && matches.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-primary/15 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-orange-400/80">
              <AlertTriangle className="w-3.5 h-3.5" />Changes are written directly to disk
            </div>
            <button onClick={handleApply} disabled={selected.size === 0} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 font-semibold">
              <Replace className="w-3.5 h-3.5" />Replace {selected.size} match{selected.size !== 1 ? "es" : ""}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
