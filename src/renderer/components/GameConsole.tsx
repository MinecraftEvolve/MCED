import React, { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, Trash2, Download, Terminal, Search, ArrowDown, ChevronRight } from "lucide-react";

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

function getLineColor(type: GameLogEntry["type"], line: string): string {
  if (type === "stderr") return "text-red-400";
  if (type === "system") return "text-yellow-300/80 italic";
  if (/\[ERROR\]|\bERROR\b|Exception|at com\.|at net\.|at java\./.test(line)) return "text-red-300/90";
  if (/\[WARN\]|\bWARN\b/.test(line)) return "text-orange-300/90";
  if (/\[INFO\]/.test(line)) return "text-slate-300/80";
  return "text-emerald-300/80";
}

export function GameConsole({ instancePath, onClose }: GameConsoleProps) {
  const [logs, setLogs] = useState<GameLogEntry[]>([]);
  const [autoScroll, setAutoScroll] = useState(true);
  const [filter, setFilter] = useState("");
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = window.api.onGameLog((entry) => {
      if (entry.instancePath === instancePath) {
        setLogs((prev) => {
          const next = [...prev, entry];
          return next.length > 2000 ? next.slice(next.length - 2000) : next;
        });
      }
    });
    return () => unsubscribe();
  }, [instancePath]);

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: "instant" });
    }
  }, [logs, autoScroll]);

  // Ctrl+F focuses the filter input
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "f") {
        e.preventDefault();
        filterRef.current?.focus();
      }
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    setAutoScroll(atBottom);
  }, []);

  const scrollToBottom = () => {
    setAutoScroll(true);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

  const visibleLogs = logs.filter((entry) => {
    if (showOnlyErrors && entry.type !== "stderr" && !/ERROR|Exception/.test(entry.line)) return false;
    if (filter && !entry.line.toLowerCase().includes(filter.toLowerCase())) return false;
    return true;
  });

  const errorCount = logs.filter((l) => l.type === "stderr" || /\bERROR\b|Exception/.test(l.line)).length;

  const instanceName = instancePath.split(/[\\/]/).pop() ?? instancePath;

  const content = (
    <div className="fixed inset-0 z-[9999] flex items-stretch justify-stretch bg-black/70 backdrop-blur-sm">
      {/* Clickable backdrop on the sides */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Panel — slides up from bottom, full-width, ~70% height */}
      <div
        className="relative mt-auto w-full flex flex-col"
        style={{ height: "72vh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top drag handle area */}
        <div className="flex justify-center py-1.5 bg-[#0f0f12] border-t border-purple-500/40 rounded-t-2xl cursor-default select-none">
          <div className="w-10 h-1 rounded-full bg-purple-500/40" />
        </div>

        {/* Header bar */}
        <div className="flex items-center gap-3 px-4 py-2.5 bg-[#0f0f12] border-b border-purple-500/20">
          <Terminal className="w-4 h-4 text-purple-400 shrink-0" />
          <span className="text-sm font-bold text-purple-300 font-mono">Console</span>
          <ChevronRight className="w-3.5 h-3.5 text-purple-500/50" />
          <span className="text-xs text-muted-foreground/60 font-mono truncate flex-1">{instanceName}</span>

          {/* Error badge */}
          {errorCount > 0 && (
            <button
              onClick={() => setShowOnlyErrors((v) => !v)}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-mono font-semibold border transition-all ${
                showOnlyErrors
                  ? "bg-red-500/20 text-red-300 border-red-500/40"
                  : "bg-red-500/10 text-red-400/70 border-red-500/20 hover:border-red-500/40 hover:text-red-300"
              }`}
              title="Toggle error filter"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
              {errorCount} error{errorCount !== 1 ? "s" : ""}
            </button>
          )}

          {/* Filter input */}
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 pointer-events-none" />
            <input
              ref={filterRef}
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter… (Ctrl+F)"
              className="w-44 pl-6 pr-2 py-1 text-xs font-mono bg-white/5 border border-white/10 rounded-md text-foreground placeholder:text-muted-foreground/30 focus:outline-none focus:border-purple-500/50 focus:bg-white/8 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              title="Download log"
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-white/8 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleClear}
              title="Clear console"
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-foreground hover:bg-white/8 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-white/10 mx-1" />
            <button
              onClick={onClose}
              title="Close (Esc)"
              className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Log output */}
        <div
          ref={containerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto bg-[#080810] font-mono text-xs"
        >
          {visibleLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 text-muted-foreground/30">
              <Terminal className="w-8 h-8" />
              <p className="italic">
                {logs.length === 0 ? "Waiting for game output…" : "No lines match the current filter."}
              </p>
            </div>
          ) : (
            <div className="py-2">
              {visibleLogs.map((entry, i) => (
                <div
                  key={i}
                  className="flex gap-3 px-4 py-0.5 leading-5 hover:bg-white/[0.03] group"
                >
                  <span className="shrink-0 text-muted-foreground/25 select-none w-16 text-right">
                    {new Date(entry.timestamp).toLocaleTimeString(undefined, { hour12: false })}
                  </span>
                  <span className={`break-all ${getLineColor(entry.type, entry.line)}`}>
                    {entry.line}
                  </span>
                </div>
              ))}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 bg-[#0f0f12] border-t border-purple-500/20">
          <div className="flex items-center gap-3 text-xs text-muted-foreground/40 font-mono">
            <span>{logs.length} lines</span>
            {filter && <span className="text-purple-400/60">{visibleLogs.length} shown</span>}
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground/40 font-mono">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 inline-block" />stdout</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-400/60 inline-block" />stderr</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-yellow-400/60 inline-block" />system</span>
          </div>

          {/* Scroll-to-bottom button */}
          {!autoScroll && (
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono bg-purple-500/15 text-purple-300 rounded-lg border border-purple-500/30 hover:bg-purple-500/25 transition-colors"
            >
              <ArrowDown className="w-3 h-3" />
              Jump to bottom
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
