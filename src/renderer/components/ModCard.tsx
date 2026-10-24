import { ModInfo } from "@shared/types/mod.types";
import { useAppStore } from "@/store";
import { useUpdateStore } from "@/store/updateStore";

interface ModCardProps {
  mod: ModInfo;
}

export function ModCard({ mod }: ModCardProps) {
  const compactView = useAppStore((state) => state.settings.compactView);
  const showTooltips = useAppStore((state) => state.settings.showTooltips);
  const getUpdate = useUpdateStore((s) => s.getUpdate);
  const updateInfo = getUpdate(mod.modId);

  const curseforgeUrl =
    mod.platformData?.platform === "curseforge"
      ? `https://www.curseforge.com/minecraft/mc-mods/${mod.platformData.slug || mod.platformData.projectId}`
      : `https://www.curseforge.com/minecraft/search?search=${encodeURIComponent(mod.name)}`;

  const modrinthUrl =
    mod.platformData?.platform === "modrinth"
      ? `https://modrinth.com/mod/${mod.platformData.slug || mod.platformData.projectId}`
      : `https://modrinth.com/mods?q=${encodeURIComponent(mod.name)}`;

  const iconSize = compactView ? "h-16 w-16" : "h-20 w-20";
  const padding = compactView ? "p-4" : "p-6";

  return (
    <div className={`space-y-${compactView ? "4" : "6"} animate-fadeIn`}>
      <div
        className={`rounded-2xl border border-primary/20 bg-gradient-to-br from-card via-card/95 to-card/80 shadow-xl backdrop-blur-sm transition-all duration-200 hover:border-primary/40 hover:shadow-2xl ${padding}`}
      >
        <div className="flex items-start gap-4">
          {mod.icon ? (
            <img
              src={mod.icon}
              alt={mod.name}
              className={`${iconSize} rounded-2xl object-cover shadow-lg ring-2 ring-primary/30 transition-all duration-200 hover:scale-105 hover:ring-primary/50`}
              title={showTooltips ? mod.name : undefined}
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div
              className={`${iconSize} flex items-center justify-center rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30 text-3xl font-bold text-primary shadow-lg ring-2 ring-primary/30`}
            >
              {mod.name.substring(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <h2 className="mb-2 text-2xl font-bold text-foreground">{mod.name}</h2>
            <p className="flex flex-wrap items-center gap-2 text-muted-foreground">
              <span className="rounded-lg border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">
                v{mod.version}
              </span>
              {mod.authors && mod.authors.length > 0 && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="flex items-center gap-1.5">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    <span className="font-medium">{mod.authors.join(", ")}</span>
                  </span>
                </>
              )}
            </p>
          </div>
        </div>

        {updateInfo && (
          <div className="mt-3 flex items-center gap-3 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-orange-400">Update available</p>
              <p className="text-xs text-muted-foreground">
                {updateInfo.currentVersion} → <span className="font-semibold text-orange-400">{updateInfo.latestVersion}</span>
              </p>
            </div>
            {updateInfo.downloadUrl && (
              <a
                href={updateInfo.downloadUrl}
                target="_blank"
                rel="noreferrer"
                className="whitespace-nowrap rounded-lg border border-orange-500/40 bg-orange-500/20 px-3 py-1.5 text-xs font-semibold text-orange-400 transition-colors duration-200 hover:bg-orange-500/30"
              >
                Download
              </a>
            )}
          </div>
        )}

        {mod.description && (
          <p className="mt-4 rounded-r-lg border-l-4 border-primary/40 bg-primary/5 py-2 pl-4 text-muted-foreground leading-relaxed">
            {mod.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {mod.homepage && (
            <a
              href={mod.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border-2 border-border bg-secondary px-4 py-2 text-sm font-semibold shadow-md transition-all duration-200 hover:scale-[1.01] hover:bg-secondary/80"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
              Homepage
            </a>
          )}

          <a
            href={curseforgeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-orange-500/10 px-4 py-2 text-sm font-semibold text-orange-600 shadow-md transition-all duration-200 hover:scale-[1.01] hover:bg-orange-500/20 dark:text-orange-400"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.326 9.2c-.288 0-.564.058-.817.164v-.001a2.213 2.213 0 00-.717.478 2.23 2.23 0 00-.48.718 2.206 2.206 0 00-.163.817v2.84c0 .287.058.563.163.817.105.253.265.48.48.718.215.238.465.43.717.478.253.106.529.164.817.164h.328c.286 0 .561-.058.815-.164a2.2 2.2 0 00.717-.478 2.234 2.234 0 00.479-.718 2.198 2.198 0 00.163-.817v-2.84a2.2 2.2 0 00-.163-.817 2.235 2.235 0 00-.479-.718 2.214 2.214 0 00-.717-.478 2.231 2.231 0 00-.815-.164zm-10.544 0c-.288 0-.564.058-.817.164v-.001a2.213 2.213 0 00-.717.478 2.23 2.23 0 00-.48.718 2.205 2.205 0 00-.163.817v2.84c0 .287.058.563.163.817.105.253.265.48.48.718.215.238.465.43.717.478.253.106.529.164.817.164h.328c.286 0 .561-.058.815-.164a2.2 2.2 0 00.717-.478 2.234 2.234 0 00.479-.718 2.198 2.198 0 00.163-.817v-2.84a2.2 2.2 0 00-.163-.817 2.235 2.235 0 00-.479-.718 2.214 2.214 0 00-.717-.478 2.231 2.231 0 00-.815-.164h-.328z" />
            </svg>
            CurseForge
          </a>

          <a
            href={modrinthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-xl bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-600 shadow-md transition-all duration-200 hover:scale-[1.01] hover:bg-green-500/20 dark:text-green-400"
          >
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 512 512">
              <path d="M331 201a49 49 0 1098 0 49 49 0 10-98 0zm-158 0a49 49 0 1098 0 49 49 0 10-98 0zm265 0C438 90 348 0 238 0S38 90 38 201c0 82 50 153 122 184l-24 85c-3 9 8 17 16 11l84-59c95 38 200-7 252-98 19-33 28-69 28-106 0-22-4-43-11-63z" />
            </svg>
            Modrinth
          </a>

          {mod.sources && (
            <a
              href={mod.sources}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border-2 border-border bg-secondary px-4 py-2 text-sm font-semibold shadow-md transition-all duration-200 hover:scale-[1.01] hover:bg-secondary/80"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              Source
            </a>
          )}

          {mod.issueTracker && (
            <a
              href={mod.issueTracker}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-xl border-2 border-border bg-secondary px-4 py-2 text-sm font-semibold shadow-md transition-all duration-200 hover:scale-[1.01] hover:bg-secondary/80"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Issues
            </a>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-primary/20 bg-card p-6 shadow-lg transition-all duration-200 hover:border-primary/30 hover:shadow-xl">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-foreground">
          <svg className="h-5 w-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Details
        </h3>

        <dl className="space-y-2 text-sm">
          <div className="flex items-center justify-between rounded-xl border-2 border-transparent p-3 transition-colors duration-200 hover:border-primary/20 hover:bg-primary/5">
            <dt className="font-semibold text-muted-foreground">Mod ID:</dt>
            <dd className="rounded-lg border border-border bg-secondary/50 px-3 py-1.5 font-mono text-xs">{mod.modId}</dd>
          </div>
          <div className="flex items-center justify-between rounded-xl border-2 border-transparent p-3 transition-colors duration-200 hover:border-primary/20 hover:bg-primary/5">
            <dt className="font-semibold text-muted-foreground">Version:</dt>
            <dd className="font-bold">{mod.version}</dd>
          </div>
          <div className="flex items-center justify-between rounded-xl border-2 border-transparent p-3 transition-colors duration-200 hover:border-primary/20 hover:bg-primary/5">
            <dt className="font-semibold text-muted-foreground">Loader:</dt>
            <dd className="font-bold capitalize">{mod.loader || "Unknown"}</dd>
          </div>
          {mod.license && (
            <div className="flex items-center justify-between rounded-xl border-2 border-transparent p-3 transition-colors duration-200 hover:border-primary/20 hover:bg-primary/5">
              <dt className="font-semibold text-muted-foreground">License:</dt>
              <dd className="font-bold">{mod.license}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
