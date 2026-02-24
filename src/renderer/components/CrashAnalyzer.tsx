import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { X, AlertTriangle, Upload, Cpu } from "lucide-react";
import { useAppStore } from "@/store";

interface CrashAnalyzerProps {
  onClose: () => void;
}

export function CrashAnalyzer({ onClose }: CrashAnalyzerProps) {
  const { mods } = useAppStore();
  const [result, setResult] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const analyze = async (content: string) => {
    setIsAnalyzing(true);
    setError(null);
    try {
      const knownModIds = mods.map((m) => m.modId);
      const res = await window.api.analyzeCrashLog(content, knownModIds);
      if (res.success) {
        setResult(res);
      } else {
        setError(res.error || "Analysis failed");
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    analyze(text);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    const text = await file.text();
    analyze(text);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-card border border-primary/20 rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b border-primary/20">
          <h2 className="font-bold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-400" />
            Crash Log Analyzer
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!result ? (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-primary/20 hover:border-primary/50 rounded-xl p-12 text-center cursor-pointer transition-colors"
            >
              <input ref={fileRef} type="file" accept=".txt,.log" className="hidden" onChange={handleFile} />
              {isAnalyzing ? (
                <div className="flex flex-col items-center gap-2">
                  <Cpu className="w-10 h-10 text-primary animate-pulse" />
                  <p className="text-muted-foreground">Analyzing crash log…</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-10 h-10 text-muted-foreground" />
                  <p className="font-medium">Drop crash log here or click to open</p>
                  <p className="text-sm text-muted-foreground">Supports .txt and .log files</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {result.mainCause && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <p className="text-xs font-semibold text-red-400 mb-1">Main Cause</p>
                  <p className="text-sm font-mono">{result.mainCause}</p>
                </div>
              )}
              {result.suspectedMods && result.suspectedMods.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Mods mentioned in crash</p>
                  <div className="flex flex-wrap gap-2">
                    {result.suspectedMods.map((m: string) => (
                      <span key={m} className="px-2 py-1 text-xs bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full">{m}</span>
                    ))}
                  </div>
                </div>
              )}
              {result.issues && result.issues.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2">Detected Issues ({result.issues.length})</p>
                  <div className="space-y-2">
                    {result.issues.map((issue: any, i: number) => (
                      <div key={i} className="p-2 bg-secondary/50 rounded-lg">
                        <p className="text-xs font-semibold text-yellow-400">{issue.reason}</p>
                        <p className="text-xs font-mono text-muted-foreground mt-1 truncate">{issue.line}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <button
                onClick={() => { setResult(null); setError(null); }}
                className="w-full py-2 text-sm text-muted-foreground hover:text-foreground border border-primary/20 rounded-lg transition-colors"
              >
                Analyze another file
              </button>
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">{error}</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
