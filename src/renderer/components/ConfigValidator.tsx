import { useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, X, AlertCircle, Loader2, ShieldCheck, RefreshCw } from "lucide-react";
import { useAppStore } from "@/store";
import TOML from "@iarna/toml";
import YAML from "js-yaml";

interface FileResult {
  relativePath: string;
  ext: string;
  ok: boolean;
  error?: string;
  line?: number;
}

interface Props { onClose: () => void; }

const CONFIG_EXTS = ["toml", "json", "yaml", "yml", "properties", "cfg", "conf", "ini"];

function validateContent(ext: string, content: string): { ok: boolean; error?: string; line?: number } {
  try {
    if (ext === "json" || ext === "cfg" || ext === "conf") {
      JSON.parse(content);
    } else if (ext === "toml") {
      TOML.parse(content);
    } else if (ext === "yaml" || ext === "yml") {
      YAML.load(content);
    } else if (ext === "properties" || ext === "ini") {
      // .properties: each non-comment line should be key=value
      const lineNum = content.split("\n").findIndex((l) => {
        const trimmed = l.trim();
        if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("!")) return false;
        if (trimmed.includes("=") || trimmed.includes(":")) return false;
        return true; // bare value with no = or : — mild warning
      });
      if (lineNum >= 0) {
        return { ok: true }; // just a warning, not an error
      }
    }
    return { ok: true };
  } catch (e: any) {
    const msg = e?.message ?? String(e);
    // Try to extract line number from error message
    const lineMatch = msg.match(/line[:\s]+(\d+)/i) ?? msg.match(/\[(\d+),/);
    const line = lineMatch ? Number(lineMatch[1]) : undefined;
    return { ok: false, error: msg.split("\n")[0].slice(0, 200), line };
  }
}

export function ConfigValidator({ onClose }: Props) {
  const { currentInstance } = useAppStore();
  const [results, setResults] = useState<FileResult[]>([]);
  const [phase, setPhase] = useState<"idle" | "scanning" | "done">("idle");
  const [filter, setFilter] = useState<"all" | "errors">("errors");

  async function handleScan() {
    if (!currentInstance) return;
    setPhase("scanning");
    const base = currentInstance.path.replace(/[\\/]$/, "") + "/config";
    const scan = await window.api.readdirRecursive(base, { extensions: CONFIG_EXTS });
    if (!scan.success || !scan.files) {
      setPhase("done");
      return;
    }

    const out: FileResult[] = [];
    for (const f of scan.files) {
      const ext = f.relativePath.split(".").pop()?.toLowerCase() ?? "";
      const res = await window.api.readFile(f.path);
      if (!res.success || res.content == null) {
        out.push({ relativePath: f.relativePath, ext, ok: false, error: "Could not read file" });
        continue;
      }
      if (res.content.trim() === "") {
        out.push({ relativePath: f.relativePath, ext, ok: true });
        continue;
      }
      const validation = validateContent(ext, res.content);
      out.push({ relativePath: f.relativePath, ext, ...validation });
    }

    out.sort((a, b) => {
      if (!a.ok && b.ok) return -1;
      if (a.ok && !b.ok) return 1;
      return a.relativePath.localeCompare(b.relativePath);
    });
    setResults(out);
    setPhase("done");
  }

  const errorCount = results.filter(r => !r.ok).length;
  const visible = filter === "errors" ? results.filter(r => !r.ok) : results;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/15 shrink-0">
          <div className="p-1.5 rounded-lg bg-green-500/10 border border-green-500/20">
            <ShieldCheck className="w-4 h-4 text-green-400" />
          </div>
          <span className="font-semibold text-sm">Config File Validator</span>
          <span className="text-xs text-muted-foreground opacity-60 ml-1">TOML · JSON · YAML · Properties</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {phase === "idle" && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <ShieldCheck className="w-10 h-10 text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground opacity-60">Parse all config files and report syntax errors</p>
              {!currentInstance && <p className="text-xs text-orange-400/80">Open an instance first.</p>}
              <button onClick={handleScan} disabled={!currentInstance} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-40">
                <ShieldCheck className="w-3.5 h-3.5" />Validate All Configs
              </button>
            </div>
          )}

          {phase === "scanning" && (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />Scanning and parsing config files…
            </div>
          )}

          {phase === "done" && (
            <>
              <div className="flex items-center gap-2 px-5 py-2.5 border-b border-primary/10 sticky top-0 bg-card/90 backdrop-blur-sm shrink-0">
                {errorCount === 0
                  ? <span className="flex items-center gap-1.5 text-xs text-green-400 font-medium"><CheckCircle2 className="w-3.5 h-3.5" />All {results.length} files valid</span>
                  : <span className="flex items-center gap-1.5 text-xs text-red-400 font-medium"><AlertCircle className="w-3.5 h-3.5" />{errorCount} error{errorCount !== 1 ? "s" : ""} in {results.length} files</span>}
                <div className="ml-auto flex items-center gap-1">
                  {["errors", "all"].map(f => (
                    <button key={f} onClick={() => setFilter(f as any)} className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-colors ${filter === f ? "bg-primary/20 border-primary/40 text-primary" : "border-primary/15 text-muted-foreground hover:border-primary/30"}`}>
                      {f === "errors" ? `Errors (${errorCount})` : `All (${results.length})`}
                    </button>
                  ))}
                  <button onClick={handleScan} className="p-1 rounded hover:bg-primary/10 text-muted-foreground ml-1">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {visible.length === 0 && (
                <div className="flex items-center justify-center py-12 text-muted-foreground text-sm opacity-60">
                  {filter === "errors" ? "No errors found — all files parsed successfully." : "No files found."}
                </div>
              )}

              <div className="divide-y divide-primary/10">
                {visible.map(r => (
                  <div key={r.relativePath} className="flex items-start gap-3 px-5 py-3 hover:bg-primary/5">
                    {r.ok
                      ? <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                      : <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono truncate">{r.relativePath}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-muted-foreground font-mono shrink-0">{r.ext}</span>
                      </div>
                      {!r.ok && r.error && (
                        <p className="text-[11px] text-red-400/90 mt-0.5 font-mono leading-relaxed">
                          {r.line != null && <span className="text-red-500/60 mr-1">line {r.line}:</span>}
                          {r.error}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
