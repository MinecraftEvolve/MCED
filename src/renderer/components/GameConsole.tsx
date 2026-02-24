import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Trash2, Download } from "lucide-react";

export interface GameLogEntry {
  line: string;
  type: "stdout" | "stderr" | "system";
  instancePath: string;
  timestamp: number;
}

interface GameConsoleProps {
  instancePath: string;
  onClose: () => void;
}

export function GameConsole({ instancePath, onClose }: GameConsoleProps) {
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.api.onGameLog((entry) => {
      if (entry.instancePath === instancePath) {
        setLogs((prev) => [...prev, entry]);
      }
    });
    return () => {
      window.api.removeGameLogListener();
    };
  }, [instancePath]);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs, autoScroll]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  const handleClear = () => setLogs([]);

  const handleDownload = () => {
    const text = logs
      .map((l) => {
        const d = new Date(l.timestamp).toISOString();
        const prefix = l.type === "stderr" ? "[ERR]" : l.type === "system" ? "[SYS]" : "[OUT]";
        return `${d} ${prefix} ${l.line}`;
      })
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `minecraft-log-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-5xl bg-[#0d0d0d] border border-purple-500/30 rounded-xl shadow-2xl flex flex-col"
        style={{ height: "60vh" }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-500/20">
          <div className="flex items-center gap-2">
            <span className="text-green-400 font-mono text-sm font-bold">Game Console</span>
            <span className="text-xs text-muted-foreground font-mono truncate max-w-xs opacity-60">
              {instancePath}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {!autoScroll && (
              <button
                onClick={() => {
                  setAutoScroll(true);
                  bottomRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-2 py-1 text-xs bg-purple-500/20 text-purple-400 rounded border border-purple-500/30 hover:bg-purple-500/30 transition-colors"
              >
                ↓ Scroll to bottom
              </button>
            )}
            <button
              onClick={handleDownload}
              title="Download log"
              className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              title="Clear console"
              className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-foreground transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              title="Close console"
              className="p-1.5 hover:bg-white/10 rounded text-muted-foreground hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Log output */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto font-mono text-xs p-3 space-y-0.5"
        >
          {logs.length === 0 ? (
            <p className="text-muted-foreground/50 italic">Waiting for game output…</p>
          ) : (
            logs.map((entry, i) => (
              <div key={i} className="flex gap-2 leading-5 hover:bg-white/5 rounded px-1">
                <span className="shrink-0 text-muted-foreground/40 select-none">
                  {new Date(entry.timestamp).toLocaleTimeString("de", { hour12: false })}
                </span>
                <span
                  className={
                    entry.type === "stderr"
                      ? "text-red-400"
                      : entry.type === "system"
                        ? "text-yellow-400/80 italic"
                        : "text-green-300/90"
                  }
                >
                  {entry.line}
                </span>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-purple-500/20 flex items-center justify-between">
          <span className="text-xs text-muted-foreground/50 font-mono">
            {logs.length} line{logs.length !== 1 ? "s" : ""}
          </span>
          <span className="text-xs text-muted-foreground/50 font-mono flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-400/70 inline-block"></span>stdout
            <span className="w-2 h-2 rounded-full bg-red-400/70 inline-block ml-2"></span>stderr
            <span className="w-2 h-2 rounded-full bg-yellow-400/70 inline-block ml-2"></span>system
          </span>
        </div>
      </div>
    </div>
  );
}
