import { useState, useEffect } from "react";
import { useAppStore } from "../store";
import { Bookmark, Plus, RotateCcw, Trash2, Loader2, Calendar, X } from "lucide-react";

interface Backup {
  id: string;
  name: string;
  createdAt: number;
  size?: number;
}

interface Props {
  onClose: () => void;
}

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProfileManager({ onClose }: Props) {
  const { currentInstance } = useAppStore();
  const [profiles, setProfiles] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showInput, setShowInput] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const instancePath = currentInstance?.path;

  async function load() {
    if (!instancePath) return;
    setLoading(true);
    try {
      const all: Backup[] = await window.api.listBackups(instancePath);
      setProfiles(all.sort((a, b) => b.createdAt - a.createdAt));
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [instancePath]);

  async function handleCreate() {
    if (!instancePath || !newName.trim()) return;
    setCreating(true);
    try {
      await window.api.createBackup(instancePath, newName.trim());
      setNewName("");
      setShowInput(false);
      await load();
    } finally {
      setCreating(false);
    }
  }

  async function handleRestore(id: string) {
    if (!instancePath) return;
    if (!confirm("Apply this profile? Current configs will be overwritten.")) return;
    setRestoring(id);
    try {
      await window.api.restoreBackup(instancePath, id);
    } finally {
      setRestoring(null);
    }
  }

  async function handleDelete(id: string) {
    if (!instancePath) return;
    if (!confirm("Delete this profile? This cannot be undone.")) return;
    await window.api.deleteBackup(instancePath, id);
    await load();
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-primary/15">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
              <Bookmark className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">Config Profiles</p>
              <p className="text-[11px] text-muted-foreground opacity-60">
                Snapshots of your config folder
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : profiles.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <Bookmark className="w-10 h-10 mx-auto text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground opacity-60">No profiles yet</p>
              <p className="text-xs text-muted-foreground opacity-40">
                Save your current configs as a named profile
              </p>
            </div>
          ) : (
            profiles.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-primary/15 bg-card/60 hover:border-primary/30 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Calendar className="w-2.5 h-2.5 text-muted-foreground opacity-50" />
                    <p className="text-[10px] text-muted-foreground opacity-50">
                      {formatDate(p.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleRestore(p.id)}
                    disabled={!!restoring}
                    className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-40 transition-colors font-medium"
                    title="Apply this profile"
                  >
                    {restoring === p.id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <RotateCcw className="w-3 h-3" />
                    )}
                    Apply
                  </button>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/15 text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2 border-t border-primary/10">
          {showInput ? (
            <div className="flex gap-2">
              <input
                className="flex-1 px-3 py-2 rounded-xl bg-background/60 border border-primary/20 focus:border-primary outline-none text-sm transition-colors"
                placeholder="Profile name (e.g. Performance, Survival)"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                  if (e.key === "Escape") setShowInput(false);
                }}
                autoFocus
              />
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 flex items-center gap-1.5 shadow-lg shadow-primary/20"
              >
                {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowInput(true)}
              disabled={!instancePath}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-primary/30 hover:bg-primary/10 text-sm font-medium transition-colors disabled:opacity-40"
            >
              <Plus className="w-4 h-4" />
              Save Current as Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
