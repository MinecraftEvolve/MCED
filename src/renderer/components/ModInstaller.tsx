import { useState } from "react";
import { createPortal } from "react-dom";
import { PackagePlus, X, Search, Loader2, Download, ExternalLink, Github } from "lucide-react";
import { useAppStore } from "@/store";
import { useSettingsStore } from "@/store/settingsStore";
import { curseForgeAPI } from "@/services/api/CurseForgeAPI";

type Source = "modrinth" | "curseforge" | "github";

interface ModResult {
  id: string;
  name: string;
  description: string;
  author: string;
  downloads?: number;
  url: string;
  downloadUrl?: string;
  iconUrl?: string;
  source: Source;
  slug?: string;
}

interface Props { onClose: () => void; }

export function ModInstaller({ onClose }: Props) {
  const { currentInstance } = useAppStore();
  const { settings } = useSettingsStore();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<Source>("modrinth");
  const [results, setResults] = useState<ModResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installed, setInstalled] = useState<Set<string>>(new Set());

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      if (source === "modrinth") {
        const res = await fetch(
          `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&facets=[["project_type:mod"]]&limit=20`,
          { headers: { "User-Agent": "MCED/1.0 (github.com/LukeLuke1505)" } }
        );
        if (!res.ok) throw new Error(`Modrinth: ${res.status}`);
        const data = await res.json();
        setResults((data.hits ?? []).map((h: any) => ({
          id: h.project_id,
          name: h.title,
          description: h.description,
          author: h.author,
          downloads: h.downloads,
          url: `https://modrinth.com/mod/${h.slug}`,
          iconUrl: h.icon_url,
          source: "modrinth" as Source,
          slug: h.slug,
        })));
      } else if (source === "curseforge") {
        if (!settings.curseForgeApiKey) {
          setError("CurseForge API key not set. Add it in Settings.");
          setLoading(false);
          return;
        }
        curseForgeAPI.setApiKey(settings.curseForgeApiKey);
        const mods = await curseForgeAPI.searchMods(query, 20);
        setResults(mods.map(mod => ({
          id: String(mod.id),
          name: mod.name,
          description: mod.summary,
          author: mod.authors?.[0]?.name ?? "Unknown",
          downloads: mod.downloadCount,
          url: mod.links?.websiteUrl ?? `https://www.curseforge.com/minecraft/mc-mods/${mod.slug}`,
          iconUrl: mod.logo?.thumbnailUrl,
          source: "curseforge" as Source,
          slug: mod.slug,
        })));
      } else if (source === "github") {
        const res = await fetch(
          `https://api.github.com/search/repositories?q=${encodeURIComponent(query + " minecraft mod")}&sort=stars&per_page=20`,
          { headers: { Accept: "application/vnd.github+json" } }
        );
        if (!res.ok) throw new Error(`GitHub: ${res.status}`);
        const data = await res.json();
        const items: any[] = data.items ?? [];
        // Fetch latest release for each to get download URL
        const withRelease = await Promise.all(items.slice(0, 10).map(async (repo: any) => {
          let downloadUrl: string | undefined;
          try {
            const relRes = await fetch(`https://api.github.com/repos/${repo.full_name}/releases/latest`);
            if (relRes.ok) {
              const rel = await relRes.json();
              const jar = (rel.assets ?? []).find((a: any) => a.name.endsWith(".jar"));
              if (jar) downloadUrl = jar.browser_download_url;
            }
          } catch { /* no release */ }
          return {
            id: String(repo.id),
            name: repo.name,
            description: repo.description ?? "",
            author: repo.owner?.login ?? "",
            downloads: repo.stargazers_count,
            url: repo.html_url,
            downloadUrl,
            source: "github" as Source,
            slug: repo.full_name,
          };
        }));
        setResults(withRelease);
      }
    } catch (e: any) {
      setError(e?.message ?? "Search failed");
    }
    setLoading(false);
  }

  async function handleInstall(mod: ModResult) {
    // For GitHub/CurseForge, or Modrinth without an open instance: open page/download directly
    if (mod.source !== "modrinth" || !currentInstance) {
      window.open(mod.downloadUrl ?? mod.url, "_blank");
      setInstalled(prev => new Set([...prev, mod.id]));
      return;
    }

    // Modrinth with instance: fetch version filtered by MC version + loader for a targeted download URL
    setInstalling(mod.id);
    try {
      if (mod.slug) {
        const res = await fetch(
          `https://api.modrinth.com/v2/project/${mod.slug}/version?game_versions=["${currentInstance.minecraftVersion}"]&loaders=["${currentInstance.loader.type}"]&limit=1`,
          { headers: { "User-Agent": "MCED/1.0" } }
        );
        if (res.ok) {
          const versions: any[] = await res.json();
          const file = versions[0]?.files?.find((f: any) => f.primary) ?? versions[0]?.files?.[0];
          window.open(file?.url ?? mod.url, "_blank");
        } else {
          window.open(mod.url, "_blank");
        }
      } else {
        window.open(mod.url, "_blank");
      }
      setInstalled(prev => new Set([...prev, mod.id]));
    } catch {
      window.open(mod.url, "_blank");
      setInstalled(prev => new Set([...prev, mod.id]));
    }
    setInstalling(null);
  }

  const SOURCE_LABELS: Record<Source, string> = {
    modrinth: "Modrinth",
    curseforge: "CurseForge",
    github: "GitHub Releases",
  };

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-2xl mx-4 bg-card rounded-2xl border border-primary/30 shadow-2xl flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-primary/15 shrink-0">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <PackagePlus className="w-4 h-4 text-primary" />
          </div>
          <span className="font-semibold text-sm">Mod Installer</span>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground"><X className="w-4 h-4" /></button>
        </div>

        {/* Source tabs */}
        <div className="flex gap-1 px-5 pt-3 pb-2 shrink-0">
          {(["modrinth", "curseforge", "github"] as Source[]).map(s => (
            <button
              key={s}
              onClick={() => { setSource(s); setResults([]); }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors font-medium ${source === s ? "bg-primary/20 border-primary/40 text-primary" : "border-primary/15 text-muted-foreground hover:border-primary/30"}`}
            >
              {s === "github" && <Github className="w-3 h-3 inline mr-1" />}
              {SOURCE_LABELS[s]}
            </button>
          ))}
        </div>

        {/* Search bar */}
        <div className="flex gap-2 px-5 pb-3 shrink-0">
          <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/20 bg-background/50">
            <Search className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <input
              className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
              placeholder={`Search ${SOURCE_LABELS[source]}…`}
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              autoFocus
            />
          </div>
          <button onClick={handleSearch} disabled={!query.trim() || loading} className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl bg-primary text-primary-foreground disabled:opacity-40 font-medium">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Search
          </button>
        </div>

        {source === "github" && (
          <div className="px-5 pb-2 text-[10px] text-muted-foreground opacity-60 shrink-0">
            GitHub results open the release page in your browser for manual download.
          </div>
        )}

        {error && <div className="px-5 py-2 text-xs text-red-400 shrink-0">{error}</div>}

        <div className="flex-1 overflow-y-auto divide-y divide-primary/10">
          {loading && <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground text-sm"><Loader2 className="w-4 h-4 animate-spin" />Searching {SOURCE_LABELS[source]}…</div>}
          {!loading && results.length === 0 && query && (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm opacity-60">No results found</div>
          )}
          {results.map(mod => (
            <div key={mod.id} className="flex items-start gap-3 px-5 py-3 hover:bg-primary/5">
              {mod.iconUrl ? (
                <img src={mod.iconUrl} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0 border border-primary/15" />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/15 flex items-center justify-center shrink-0">
                  {source === "github" ? <Github className="w-4 h-4 text-muted-foreground" /> : <PackagePlus className="w-4 h-4 text-muted-foreground" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{mod.name}</span>
                  <span className="text-[10px] text-muted-foreground opacity-50">by {mod.author}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{mod.description}</p>
                {mod.downloads !== undefined && (
                  <span className="text-[10px] text-muted-foreground opacity-50">
                    {source === "github" ? `★ ${mod.downloads.toLocaleString()}` : `${mod.downloads.toLocaleString()} downloads`}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <a href={mod.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground" title="View page">
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={() => handleInstall(mod)}
                  disabled={installing === mod.id || installed.has(mod.id)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium disabled:opacity-40 ${
                    installed.has(mod.id)
                      ? "border-green-500/30 text-green-400 bg-green-500/10"
                      : "border-primary/30 hover:bg-primary/10"
                  }`}
                >
                  {installing === mod.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {installed.has(mod.id) ? "Opened" : "Install"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body
  );
}
