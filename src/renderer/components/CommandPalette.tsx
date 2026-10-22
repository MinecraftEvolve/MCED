import { useState, useEffect, useRef, useCallback } from "react";
import Fuse from "fuse.js";
import { useAppStore } from "../store";
import { Search, Server, Settings, Box, FileText, Zap, ChevronRight } from "lucide-react";

interface PaletteItem {
  id: string;
  label: string;
  sublabel?: string;
  icon: React.ReactNode;
  category: "mod" | "action" | "remote";
  action: () => void;
}

interface Props {
  onClose: () => void;
  onOpenSettings: () => void;
}

export function CommandPalette({ onClose, onOpenSettings }: Props) {
  const { mods, setSelectedMod, setViewMode } = useAppStore();
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const buildItems = useCallback((): PaletteItem[] => {
    const items: PaletteItem[] = [
      {
        id: "action:remote",
        label: "Open Remote Panel",
        sublabel: "Connect to a Minecraft server",
        icon: <Server className="w-4 h-4 text-green-400" />,
        category: "action",
        action: () => { setViewMode("remote"); onClose(); },
      },
      {
        id: "action:settings",
        label: "Open Settings",
        sublabel: "Ctrl+,",
        icon: <Settings className="w-4 h-4 text-primary" />,
        category: "action",
        action: () => { onOpenSettings(); onClose(); },
      },
      {
        id: "action:mods",
        label: "Mod List",
        sublabel: "Browse all mods",
        icon: <Box className="w-4 h-4 text-purple-400" />,
        category: "action",
        action: () => { setViewMode("mods"); onClose(); },
      },
      {
        id: "action:kubejs",
        label: "KubeJS Editor",
        sublabel: "Edit scripts",
        icon: <Zap className="w-4 h-4 text-yellow-400" />,
        category: "action",
        action: () => { setViewMode("kubejs"); onClose(); },
      },
      ...mods.map((mod) => ({
        id: `mod:${mod.modId}`,
        label: mod.name || mod.modId,
        sublabel: mod.version
          ? `${mod.modId} · v${mod.version}${mod.configFiles?.length ? ` · ${mod.configFiles.length} config${mod.configFiles.length > 1 ? "s" : ""}` : ""}`
          : mod.modId,
        icon: mod.icon
          ? <img src={mod.icon} className="w-4 h-4 rounded" alt="" />
          : <FileText className="w-4 h-4 text-blue-400" />,
        category: "mod" as const,
        action: () => {
          setSelectedMod(mod);
          setViewMode("mods");
          onClose();
        },
      })),
    ];
    return items;
  }, [mods, setSelectedMod, setViewMode, onClose, onOpenSettings]);

  const allItems = buildItems();

  const results = query.trim()
    ? new Fuse(allItems, {
        keys: ["label", "sublabel", "id"],
        threshold: 0.4,
        includeScore: true,
      })
        .search(query)
        .map((r) => r.item)
    : allItems.slice(0, 12);

  const totalResults = results.length;

  useEffect(() => {
    setSelected(0);
  }, [query]);

  useEffect(() => {
    const el = listRef.current?.children[selected] as HTMLElement;
    el?.scrollIntoView({ block: "nearest" });
  }, [selected]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(s + 1, totalResults - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      results[selected]?.action();
    } else if (e.key === "Escape") {
      onClose();
    }
  }

  const grouped = results.reduce<Record<string, PaletteItem[]>>((acc, item) => {
    const key = item.category === "action" ? "Actions" : item.category === "mod" ? "Mods" : "Remote";
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  let cursor = 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl shadow-primary/10 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKey}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-primary/15">
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground/60"
            placeholder="Search mods, actions…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-muted-foreground font-mono border border-primary/20">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-1.5">
          {totalResults === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-8 opacity-50">
              No results for "{query}"
            </p>
          ) : (
            Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-4 py-1.5">
                  {group}
                </p>
                {items.map((item) => {
                  const idx = cursor++;
                  const isSelected = idx === selected;
                  return (
                    <button
                      key={item.id}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                        isSelected
                          ? "bg-primary/15 text-foreground"
                          : "hover:bg-primary/8 text-foreground"
                      }`}
                      onClick={item.action}
                      onMouseEnter={() => setSelected(idx)}
                    >
                      <span className="shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        {item.sublabel && (
                          <p className="text-[11px] text-muted-foreground truncate opacity-70">
                            {item.sublabel}
                          </p>
                        )}
                      </div>
                      {isSelected && (
                        <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="flex items-center gap-3 px-4 py-2 border-t border-primary/10 text-[10px] text-muted-foreground opacity-50">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> select</span>
          <span><kbd className="font-mono">Esc</kbd> close</span>
        </div>
      </div>
    </div>
  );
}
