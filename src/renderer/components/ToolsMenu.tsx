import { useState, useRef, useEffect } from "react";
import {
  Wrench, ChevronDown,
  Wand2, Replace, RotateCcw, ShieldCheck, ArrowLeftRight, FileDiff,
  Cpu, StickyNote, Zap, AlertTriangle, Activity, GitCompare, GitBranch, Database,
  PackagePlus, Rss, RefreshCw,
  Download,
} from "lucide-react";

interface ToolItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color?: string;
  needsInstance?: boolean;
}

const SECTIONS: { label: string; items: ToolItem[] }[] = [
  {
    label: "Config",
    items: [
      { id: "configTemplates", label: "Config Templates", icon: Wand2 },
      { id: "bulkReplace", label: "Bulk Find & Replace", icon: Replace, needsInstance: true },
      { id: "configReset", label: "Reset to Defaults", icon: RotateCcw, needsInstance: true, color: "text-orange-400" },
      { id: "configValidator", label: "Validate Config Files", icon: ShieldCheck, needsInstance: true, color: "text-green-400" },
      { id: "configSync", label: "Server Config Sync", icon: ArrowLeftRight, needsInstance: true, color: "text-green-400" },
      { id: "localRemoteDiff", label: "Local ↔ Remote Diff", icon: FileDiff, needsInstance: true, color: "text-blue-400" },
    ],
  },
  {
    label: "Instance",
    items: [
      { id: "jvmOptimizer", label: "JVM Optimizer", icon: Cpu, needsInstance: true },
      { id: "modNotes", label: "Mod Notes", icon: StickyNote, needsInstance: true, color: "text-yellow-400" },
      { id: "perfQuickApply", label: "Performance Quick-Apply", icon: Zap, needsInstance: true, color: "text-yellow-400" },
      { id: "crashAnalyzer", label: "Crash Log Analyzer", icon: AlertTriangle, color: "text-orange-400" },
      { id: "startupLog", label: "Startup Log Analyzer", icon: Activity, needsInstance: true, color: "text-green-400" },
      { id: "instanceDiff", label: "Instance Diff", icon: GitCompare, needsInstance: true, color: "text-blue-400" },
      { id: "dependencyGraph", label: "Dependency Graph", icon: GitBranch, needsInstance: true, color: "text-purple-400" },
      { id: "backups", label: "Instance Backup", icon: Database },
    ],
  },
  {
    label: "Discovery",
    items: [
      { id: "modInstaller", label: "Mod Installer", icon: PackagePlus },
      { id: "changelogFeed", label: "Changelog Feed", icon: Rss },
      { id: "modUpdateChecker", label: "Check Mod Updates", icon: RefreshCw, needsInstance: true },
      { id: "exportModpack", label: "Export as .mrpack", icon: Download, needsInstance: true },
    ],
  },
];

interface Props {
  hasInstance: boolean;
  onTool: (id: string) => void;
}

export function ToolsMenu({ hasInstance, onTool }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 border ${
          open
            ? "bg-primary/20 border-primary/40 text-primary"
            : "bg-secondary/60 hover:bg-secondary border-border/50 text-muted-foreground hover:text-foreground"
        }`}
      >
        <Wrench className="w-3.5 h-3.5" />
        Tools
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-card border border-primary/20 rounded-xl shadow-2xl shadow-black/30 z-[100] overflow-hidden">
          {SECTIONS.map((section, si) => (
            <div key={section.label}>
              {si > 0 && <div className="h-px bg-primary/10 mx-2" />}
              <div className="px-3 pt-2 pb-1 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {section.label}
              </div>
              {section.items.map(item => {
                const disabled = item.needsInstance && !hasInstance;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { if (!disabled) { onTool(item.id); setOpen(false); } }}
                    disabled={disabled}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs text-left transition-colors ${
                      disabled
                        ? "opacity-35 cursor-not-allowed"
                        : "hover:bg-primary/10 cursor-pointer"
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 shrink-0 ${item.color ?? "text-muted-foreground"}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
              {si === SECTIONS.length - 1 && <div className="h-1.5" />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
