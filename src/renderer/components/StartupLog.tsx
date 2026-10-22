import { useState } from "react";
import { createPortal } from "react-dom";
import { Activity, X, Loader2, AlertTriangle, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { useAppStore } from "@/store";

interface ModTiming {
  modId: string;
  ms: number;
}

interface ParsedLog {
  totalLoadMs: number | null;
  modTimings: ModTiming[];
  warnings: string[];
  errors: string[];
  mcVersion: string | null;
  modCount: number | null;
}

function parseLog(text: string): ParsedLog {
  const lines = text.split("\n");
  const result: ParsedLog = { totalLoadMs: null, modTimings: [], warnings: [], errors: [], mcVersion: null, modCount: null };

  for (const line of lines) {
    // Minecraft version
    const mcMatch = line.match(/Minecraft\s+([\d.]+)/i);
    if (mcMatch && !result.mcVersion) result.mcVersion = mcMatch[1];

    // Mod count (Fabric/Forge/NeoForge patterns)
    const modCountMatch = line.match(/Loading (\d+) mods|found (\d+) mods|(\d+) mods? loaded/i);
    if (modCountMatch) result.modCount = parseInt(modCountMatch[1] ?? modCountMatch[2] ?? modCountMatch[3]);

    // Total load time
    const totalMatch = line.match(/(?:loading|started|took)\s+(\d+[\d,]*)\s*ms/i)
      ?? line.match(/(?:Forge|NeoForge|Fabric|Loader).+(?:loaded|started).+?(\d+[\d,]*)\s*ms/i);
    if (totalMatch && !result.totalLoadMs) {
      result.totalLoadMs = parseInt(totalMatch[1].replace(/,/g, ""));
    }

    // Per-mod timing (Forge pattern: "Mod modid took X ms")
    const modTimeMatch = line.match(/Mod\s+(\S+)\s+took\s+([\d.]+)\s*ms/i);
    if (modTimeMatch) {
      result.modTimings.push({ modId: modTimeMatch[1], ms: parseFloat(modTimeMatch[2]) });
    }

    // Warnings
    if (/\[WARN\]|\bWARN\b/i.test(line) && !line.includes("ForgeHooks")) {
      result.warnings.push(line.replace(/^\[[\d:]+\]\s*/, "").trim());
    }

    // Errors
    if (/\[ERROR\]|\bERROR\b|Exception in thread/i.test(line)) {
      result.errors.push(line.replace(/^\[[\d:]+\]\s*/, "").trim());
    }
  }

  // Sort timings descending
  result.modTimings.sort((a, b) => b.ms - a.ms);
  return result;
}

interface Props {
  onClose: () => void;
}

export function StartupLog({ onClose }: Props) {
  const { currentInstance } = useAppStore();
  const [parsed, setParsed] = useState<ParsedLog | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>("timings");

  async function loadLog() {
    if (!currentInstance) return;
    setLoading(true);
    setError(null);
    try {
      const logPath = currentInstance.path.replace(/[\\/]$/, "") + "/logs/latest.log";
      const result = await window.api.readFile(logPath);
      if (!result.success || !result.content) {
        setError(result.error ?? "Could not read logs/latest.log");
        return;
      }
      setParsed(parseLog(result.content));
    } catch (e: any) {
      setError(e?.message ?? "Failed to read log");
    } finally {
      setLoading(false);
    }
  }

  const maxMs = parsed?.modTimings[0]?.ms ?? 1;

  const Section = ({ id, title, icon: Icon, count, color, children }: any) => (
    <div className="rounded-xl border border-primary/15 overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-card/60 hover:bg-primary/10 transition-colors"
        onClick={() => setExpandedSection(expandedSection === id ? null : id)}
      >
        <Icon className={`w-3.5 h-3.5 ${color} shrink-0`} />
        <span className="flex-1 text-sm font-medium text-left">{title}</span>
        <span className="text-[11px] text-muted-foreground">{count}</span>
        {expandedSection === id ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
      </button>
      {expandedSection === id && <div className="border-t border-primary/10">{children}</div>}
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary/15">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Activity className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Startup Log Analyzer</p>
              <p className="text-[11px] text-muted-foreground opacity-60">
                {parsed?.mcVersion ? `Minecraft ${parsed.mcVersion}` : "Parse logs/latest.log"}
                {parsed?.modCount ? ` · ${parsed.modCount} mods` : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!parsed && (
              <button
                onClick={loadLog}
                disabled={loading || !currentInstance}
                className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 font-medium flex items-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Activity className="w-3.5 h-3.5" />}
                Analyze
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
        </div>

        {error && <div className="px-5 py-3 text-xs text-red-400 bg-red-500/10 border-b border-red-500/20">{error}</div>}

        {/* Summary strip */}
        {parsed && (
          <div className="flex items-center gap-4 px-5 py-3 border-b border-primary/10 text-sm">
            {parsed.totalLoadMs !== null && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-semibold">{(parsed.totalLoadMs / 1000).toFixed(1)}s</span>
                <span className="text-muted-foreground text-xs">total load</span>
              </div>
            )}
            {parsed.warnings.length > 0 && (
              <div className="flex items-center gap-1 text-orange-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                {parsed.warnings.length} warnings
              </div>
            )}
            {parsed.errors.length > 0 && (
              <div className="flex items-center gap-1 text-red-400 text-xs">
                <AlertTriangle className="w-3.5 h-3.5" />
                {parsed.errors.length} errors
              </div>
            )}
            <button onClick={loadLog} className="ml-auto text-xs text-muted-foreground hover:text-foreground">Reload</button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {!parsed && !loading && (
            <div className="text-center py-12 text-muted-foreground text-sm opacity-60">
              Click Analyze to parse the startup log
            </div>
          )}
          {loading && <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>}

          {parsed && (
            <>
              {/* Mod timings */}
              {parsed.modTimings.length > 0 && (
                <Section id="timings" title="Mod Load Times" icon={Clock} color="text-primary" count={`${parsed.modTimings.length} mods`}>
                  <div className="p-3 space-y-1.5 max-h-60 overflow-y-auto">
                    {parsed.modTimings.slice(0, 30).map((t, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-muted-foreground w-32 truncate shrink-0">{t.modId}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-primary/10 overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${(t.ms / maxMs) * 100}%` }} />
                        </div>
                        <span className="text-[11px] font-mono text-muted-foreground w-16 text-right shrink-0">{t.ms.toFixed(0)}ms</span>
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Warnings */}
              {parsed.warnings.length > 0 && (
                <Section id="warnings" title="Warnings" icon={AlertTriangle} color="text-orange-400" count={parsed.warnings.length}>
                  <div className="max-h-48 overflow-y-auto divide-y divide-primary/10">
                    {parsed.warnings.slice(0, 50).map((w, i) => (
                      <div key={i} className="px-3 py-1.5 text-[11px] font-mono text-orange-300/80 leading-relaxed">{w}</div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Errors */}
              {parsed.errors.length > 0 && (
                <Section id="errors" title="Errors" icon={AlertTriangle} color="text-red-400" count={parsed.errors.length}>
                  <div className="max-h-48 overflow-y-auto divide-y divide-primary/10">
                    {parsed.errors.slice(0, 50).map((e, i) => (
                      <div key={i} className="px-3 py-1.5 text-[11px] font-mono text-red-300/80 leading-relaxed">{e}</div>
                    ))}
                  </div>
                </Section>
              )}

              {parsed.modTimings.length === 0 && parsed.warnings.length === 0 && parsed.errors.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm opacity-60">
                  No timing data or issues found in the log.
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
