import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { StickyNote, X, Save, Trash2 } from "lucide-react";
import { useAppStore } from "@/store";

interface Props { onClose: () => void; }

function noteKey(instancePath: string, modId: string) {
  return `mod-note::${instancePath}::${modId}`;
}

export function ModNotes({ onClose }: Props) {
  const { mods, currentInstance, selectedMod } = useAppStore();
  const [activeMod, setActiveMod] = useState(selectedMod?.modId ?? (mods[0]?.modId ?? null));
  const [text, setText] = useState("");
  const [saved, setSaved] = useState(false);
  const [search, setSearch] = useState("");

  const instancePath = currentInstance?.path ?? "";

  useEffect(() => {
    if (!activeMod || !instancePath) return;
    try {
      setText(localStorage.getItem(noteKey(instancePath, activeMod)) ?? "");
    } catch { setText(""); }
  }, [activeMod, instancePath]);

  function handleSave() {
    if (!activeMod || !instancePath) return;
    try {
      if (text.trim()) {
        localStorage.setItem(noteKey(instancePath, activeMod), text);
      } else {
        localStorage.removeItem(noteKey(instancePath, activeMod));
      }
    } catch { /* storage blocked */ }
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function handleDelete() {
    if (!activeMod || !instancePath) return;
    try { localStorage.removeItem(noteKey(instancePath, activeMod)); } catch { /* ignore */ }
    setText("");
  }

  const modsWithNotes = new Set(
    mods.map(m => m.modId).filter(id => {
      try { return !!localStorage.getItem(noteKey(instancePath, id)); } catch { return false; }
    })
  );

  const visibleMods = search
    ? mods.filter(m => m.name?.toLowerCase().includes(search.toLowerCase()) || m.modId.toLowerCase().includes(search.toLowerCase()))
    : mods;

  const activeName = mods.find(m => m.modId === activeMod)?.name ?? activeMod ?? "Select a mod";

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex max-h-[80vh]" onClick={e => e.stopPropagation()}>
        {/* Mod list */}
        <div className="w-56 shrink-0 flex flex-col border-r border-primary/15">
          <div className="flex items-center gap-2 px-3 py-3 border-b border-primary/15">
            <StickyNote className="w-4 h-4 text-primary shrink-0" />
            <span className="font-semibold text-sm">Mod Notes</span>
            <button onClick={onClose} className="ml-auto p-1 rounded hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
          </div>
          <div className="px-2 py-2 border-b border-primary/10">
            <input
              className="w-full bg-background/50 border border-primary/20 rounded-lg px-2 py-1.5 text-xs outline-none placeholder:text-muted-foreground"
              placeholder="Search mods…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {visibleMods.map(m => (
              <button
                key={m.modId}
                onClick={() => setActiveMod(m.modId)}
                className={`w-full text-left px-3 py-2 hover:bg-primary/10 transition-colors flex items-center gap-2 ${activeMod === m.modId ? "bg-primary/15" : ""}`}
              >
                <span className="flex-1 text-xs truncate">{m.name ?? m.modId}</span>
                {modsWithNotes.has(m.modId) && <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex items-center justify-between px-4 py-3 border-b border-primary/15">
            <span className="text-sm font-medium truncate">{activeName}</span>
            <div className="flex items-center gap-1.5">
              <button onClick={handleDelete} disabled={!text.trim()} className="p-1.5 rounded hover:bg-red-500/10 text-muted-foreground hover:text-red-400 disabled:opacity-30" title="Clear note">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button onClick={handleSave} disabled={!activeMod} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 font-medium">
                <Save className="w-3.5 h-3.5" />
                {saved ? "Saved!" : "Save"}
              </button>
            </div>
          </div>
          {activeMod ? (
            <textarea
              className="flex-1 bg-transparent resize-none outline-none px-4 py-3 text-sm font-mono placeholder:text-muted-foreground min-h-[200px]"
              placeholder={`Notes for ${activeName}…\n\nTip: notes are stored locally in your browser and survive restarts.`}
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); } }}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm opacity-60">Select a mod to add notes</div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
