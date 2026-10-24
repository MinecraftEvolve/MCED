import { useState } from "react";
import { createPortal } from "react-dom";
import { RefreshCw, X, ExternalLink, Check, AlertCircle, Loader2, ArrowUpCircle } from "lucide-react";
import { useAppStore } from "@/store";

interface UpdateStatus {
  modId: string;
  name: string;
  installedVersion: string;
  latestVersion: string | null;
  hasUpdate: boolean;
  modrinthSlug: string | null;
  projectUrl: string | null;
  error?: string;
}

interface Props { onClose: () => void; }

export function ModUpdateChecker({ onClose }: Props) {
  const { mods, currentInstance } = useAppStore();
  const [results, setResults] = useState<UpdateStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [checked, setChecked] = useState(false);
  const [progress, setProgress] = useState(0);

  async function checkUpdates() {
    if (!currentInstance) return;
    setLoading(true);
    setChecked(false);
    setResults([]);
    setProgress(0);

    const mcVersion = currentInstance.minecraftVersion;
    const loaderType = currentInstance.loader?.type ?? "fabric";
    const out: UpdateStatus[] = [];

    const BATCH = 5;
    for (let i = 0; i < mods.length; i += BATCH) {
      const batch = mods.slice(i, i + BATCH);
      await Promise.allSettled(batch.map(async (mod) => {
        const slug = mod.platformData?.slug ?? mod.modId.replace(/_/g, "-");
        const url = `https://api.modrinth.com/v2/project/${encodeURIComponent(slug)}/version?game_versions=["${mcVersion}"]&loaders=["${loaderType}"]&limit=1`;
        try {
          const res = await fetch(url, {
            headers: { "User-Agent": "MCED/1.0 (github.com/LukeLuke1505)" },
          });
          if (!res.ok) {
            out.push({ modId: mod.modId, name: mod.name, installedVersion: mod.version, latestVersion: null, hasUpdate: false, modrinthSlug: null, projectUrl: null });
            return;
          }
          const versions: any[] = await res.json();
          if (!versions.length) {
            out.push({ modId: mod.modId, name: mod.name, installedVersion: mod.version, latestVersion: null, hasUpdate: false, modrinthSlug: slug, projectUrl: `https://modrinth.com/mod/${slug}` });
            return;
          }
          const latest = versions[0].version_number;
          const hasUpdate = latest !== mod.version;
          out.push({
            modId: mod.modId,
            name: mod.name,
            installedVersion: mod.version,
            latestVersion: latest,
            hasUpdate,
            modrinthSlug: slug,
            projectUrl: `https://modrinth.com/mod/${slug}/version/${latest}`,
          });
        } catch {
          out.push({ modId: mod.modId, name: mod.name, installedVersion: mod.version, latestVersion: null, hasUpdate: false, modrinthSlug: null, projectUrl: null });
        }
      }));
      setProgress(Math.min(i + BATCH, mods.length));
    }

    out.sort((a, b) => {
      if (a.hasUpdate && !b.hasUpdate) return -1;
      if (!a.hasUpdate && b.hasUpdate) return 1;
      return a.name.localeCompare(b.name);
    });
    setResults(out);
    setChecked(true);
    setLoading(false);
  }

  const updateCount = results.filter(r => r.hasUpdate).length;
  const notFoundCount = results.filter(r => !r.modrinthSlug && !r.hasUpdate).length;

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/15 shrink-0">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <RefreshCw className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Mod Update Checker</span>
          <span className="text-xs text-muted-foreground opacity-60 ml-1">via Modrinth</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!checked && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <RefreshCw className="w-10 h-10 text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground opacity-60">{mods.length} mod{mods.length !== 1 ? "s" : ""} will be checked against Modrinth</p>
              {!currentInstance && <p className="text-xs text-orange-400/80">Open an instance first.</p>}
              <button
                onClick={checkUpdates}
                disabled={!currentInstance}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium disabled:opacity-40"
              >
                <RefreshCw className="w-3.5 h-3.5" />Check for Updates
              </button>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground text-sm">
              <Loader2 className="w-6 h-6 animate-spin" />
              <p>Checking {progress}/{mods.length} mods…</p>
              <div className="w-48 h-1 bg-primary/10 rounded-full overflow-hidden">
                <div className="h-full bg-primary transition-all" style={{ width: `${(progress / mods.length) * 100}%` }} />
              </div>
            </div>
          )}

          {checked && !loading && (
            <>
              <div className="flex items-center gap-3 px-5 py-2.5 border-b border-primary/10 text-xs text-muted-foreground bg-card/90 backdrop-blur-sm sticky top-0 shrink-0">
                {updateCount > 0
                  ? <span className="text-orange-400 font-medium">{updateCount} update{updateCount !== 1 ? "s" : ""} available</span>
                  : <span className="text-green-400 font-medium">All mods up to date</span>}
                <span className="opacity-50 ml-auto">{results.length} checked · {notFoundCount} not on Modrinth</span>
                <button onClick={checkUpdates} className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-foreground ml-1">
                  <RefreshCw className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-primary/10">
                {results.map(r => (
                  <div key={r.modId} className={`flex items-center gap-3 px-5 py-2.5 hover:bg-primary/5 ${r.hasUpdate ? "" : "opacity-50"}`}>
                    {r.hasUpdate
                      ? <ArrowUpCircle className="w-4 h-4 text-orange-400 shrink-0" />
                      : r.latestVersion
                      ? <Check className="w-4 h-4 text-green-400 shrink-0" />
                      : <AlertCircle className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{r.name}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">
                        {r.installedVersion}
                        {r.latestVersion && r.hasUpdate && <span className="text-orange-400"> → {r.latestVersion}</span>}
                        {r.latestVersion && !r.hasUpdate && <span className="text-green-400"> (latest)</span>}
                        {!r.latestVersion && <span className="opacity-60"> (not found on Modrinth)</span>}
                      </p>
                    </div>
                    {r.projectUrl && (
                      <a
                        href={r.projectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-lg border font-medium ${r.hasUpdate ? "border-orange-500/30 text-orange-400 bg-orange-500/10 hover:bg-orange-500/20" : "border-primary/20 hover:bg-primary/10 text-muted-foreground"}`}
                      >
                        <ExternalLink className="w-3 h-3" />
                        {r.hasUpdate ? "Update" : "View"}
                      </a>
                    )}
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
