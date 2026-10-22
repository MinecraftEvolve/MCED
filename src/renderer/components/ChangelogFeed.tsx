import { useState } from "react";
import { createPortal } from "react-dom";
import { Rss, X, Loader2, ExternalLink, RefreshCw } from "lucide-react";
import { useAppStore } from "@/store";
import { useSettingsStore } from "@/store/settingsStore";
import { curseForgeAPI } from "@/services/api/CurseForgeAPI";

interface ChangelogEntry {
  modId: string;
  modName: string;
  version: string;
  date: string;
  body: string;
  source: "modrinth" | "curseforge";
  url: string;
}

interface Props { onClose: () => void; }

export function ChangelogFeed({ onClose }: Props) {
  const { mods } = useAppStore();
  const { settings } = useSettingsStore();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [fetched, setFetched] = useState(false);

  async function fetchChangelogs() {
    setLoading(true);
    setError(null);
    const results: ChangelogEntry[] = [];

    if (settings.curseForgeApiKey) {
      curseForgeAPI.setApiKey(settings.curseForgeApiKey);
    }

    // Limit to first 30 mods to avoid hammering APIs
    const toCheck = mods.slice(0, 30);

    await Promise.allSettled(toCheck.map(async (mod) => {
      const slug = mod.modId.replace(/_/g, "-");

      // Try Modrinth first
      try {
        const res = await fetch(
          `https://api.modrinth.com/v2/project/${encodeURIComponent(slug)}/version?limit=3`,
          { headers: { "User-Agent": "MCED/1.0 (github.com/LukeLuke1505)" } }
        );
        if (res.ok) {
          const versions: any[] = await res.json();
          for (const v of versions.slice(0, 2)) {
            if (v.changelog?.trim()) {
              results.push({
                modId: mod.modId,
                modName: mod.name ?? mod.modId,
                version: v.version_number,
                date: v.date_published,
                body: v.changelog.slice(0, 800),
                source: "modrinth",
                url: `https://modrinth.com/mod/${slug}/version/${v.version_number}`,
              });
            }
          }
          return;
        }
      } catch { /* fall through */ }

      // Try CurseForge if API key is set
      if (settings.curseForgeApiKey) {
        try {
          const data = await curseForgeAPI.searchMod(mod.name ?? mod.modId);
          if (data) {
            results.push({
              modId: mod.modId,
              modName: mod.name ?? mod.modId,
              version: data.dateModified?.split("T")[0] ?? "unknown",
              date: data.dateModified ?? new Date().toISOString(),
              body: data.summary ?? "See CurseForge for details.",
              source: "curseforge",
              url: data.links?.websiteUrl ?? `https://www.curseforge.com/minecraft/mc-mods/${slug}`,
            });
          }
        } catch { /* ignore */ }
      }
    }));

    // Sort by date descending
    results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEntries(results);
    setFetched(true);
    setLoading(false);
  }

  function formatDate(iso: string) {
    try {
      return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
    } catch { return iso; }
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/15 shrink-0">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Rss className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Changelog Feed</span>
          <span className="text-xs text-muted-foreground opacity-60 ml-1">Modrinth + CurseForge</span>
          <button onClick={fetchChangelogs} disabled={loading} className="ml-auto mr-2 p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground disabled:opacity-40" title="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {!fetched && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Rss className="w-10 h-10 text-muted-foreground opacity-20" />
              <p className="text-sm text-muted-foreground opacity-60">Fetch changelogs for your installed mods</p>
              {!settings.curseForgeApiKey && (
                <p className="text-xs text-orange-400/80">Set a CurseForge API key in Settings to also fetch CurseForge changelogs.</p>
              )}
              <button onClick={fetchChangelogs} className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground font-medium">
                <Rss className="w-3.5 h-3.5" />Fetch Changelogs
              </button>
            </div>
          )}
          {loading && <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Fetching from Modrinth & CurseForge…</div>}
          {error && <div className="px-5 py-3 text-xs text-red-400">{error}</div>}
          {fetched && !loading && entries.length === 0 && (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm opacity-60">No changelogs found. Mods may not be on Modrinth or CurseForge.</div>
          )}
          {fetched && !loading && entries.length > 0 && (
            <div className="divide-y divide-primary/10">
              {entries.map((entry, i) => {
                const key = `${entry.modId}-${entry.version}-${i}`;
                const isExpanded = expanded === key;
                return (
                  <div key={key} className="px-5 py-3">
                    <div className="flex items-start justify-between gap-3 mb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-semibold">{entry.modName}</span>
                        <span className="text-[10px] font-mono text-primary bg-primary/10 px-1.5 py-0.5 rounded">{entry.version}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-semibold ${entry.source === "modrinth" ? "border-green-500/30 text-green-400 bg-green-500/10" : "border-orange-500/30 text-orange-400 bg-orange-500/10"}`}>
                          {entry.source}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-muted-foreground opacity-60">{formatDate(entry.date)}</span>
                        <a href={entry.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="text-muted-foreground hover:text-foreground">
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    <p className={`text-[11px] text-muted-foreground leading-relaxed ${isExpanded ? "" : "line-clamp-3"}`}>
                      {entry.body}
                    </p>
                    {entry.body.length > 200 && (
                      <button onClick={() => setExpanded(isExpanded ? null : key)} className="text-[10px] text-primary mt-1 hover:underline">
                        {isExpanded ? "Show less" : "Show more"}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
