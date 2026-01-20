import React from "react";
import { ModInfo } from "@shared/types/mod.types";
import { useAppStore } from "@/store";

interface ModCardProps {
  mod: ModInfo;
}

export function ModCard({ mod }: ModCardProps) {
  const compactView = useAppStore((state) => state.settings.compactView);
  const showTooltips = useAppStore((state) => state.settings.showTooltips);

  // Generate platform URLs
  const curseforgeUrl =
    mod.platformData?.platform === "curseforge"
      ? `https://www.curseforge.com/minecraft/mc-mods/${mod.platformData.slug || mod.platformData.projectId}`
      : `https://www.curseforge.com/minecraft/search?search=${encodeURIComponent(mod.name)}`;

  const modrinthUrl =
    mod.platformData?.platform === "modrinth"
      ? `https://modrinth.com/mod/${mod.platformData.slug || mod.platformData.projectId}`
      : `https://modrinth.com/mods?q=${encodeURIComponent(mod.name)}`;

  const iconSize = compactView ? "w-16 h-16" : "w-20 h-20";
  const padding = compactView ? "p-4" : "p-6";

  return (
    <div className={`space-y-${compactView ? "4" : "6"} animate-fadeIn`}>
      {/* Mod Header */}
      <div
        className={`border-2 border-primary/20 rounded-2xl ${padding} bg-gradient-to-br from-card via-card/95 to-card/80 shadow-xl backdrop-blur-sm hover:border-primary/40 transition-all duration-300`}
      >
        <div className="flex items-start gap-4">
          {mod.icon ? (
            <img
              src={mod.icon}
              alt={mod.name}
              className={`${iconSize} rounded-2xl object-cover shadow-lg ring-2 ring-primary/30 hover:ring-primary/50 transition-all hover:scale-105`}
              title={showTooltips ? mod.name : undefined}
              onError={(e) => {
                // Fallback if icon fails to load
                e.currentTarget.style.display = "none";
              }}
            />
          ) : (
            <div className={`${iconSize} rounded-2xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-primary text-3xl font-bold shadow-lg ring-2 ring-primary/30`}>
              {mod.name.substring(0, 2).toUpperCase()}
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              {mod.name}
            </h2>
            <p className="text-muted-foreground flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg font-semibold text-sm border border-primary/20">
                v{mod.version}
              </span>
              {mod.authors && mod.authors.length > 0 && (
                <>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

        {mod.description && (
          <p className="mt-4 text-muted-foreground leading-relaxed border-l-4 border-primary/40 pl-4 py-2 bg-primary/5 rounded-r-lg">
            {mod.description}
          </p>
        )}

        {/* Links */}
        <div className="flex flex-wrap gap-2 mt-4">
          {mod.homepage && (
            <a
              href={mod.homepage}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-xl transition-all hover:scale-105 flex items-center gap-2 shadow-md font-semibold border-2 border-border hover:border-primary/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            className="px-4 py-2 text-sm bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 rounded-xl transition-all hover:scale-105 flex items-center gap-2 shadow-md font-semibold border-2 border-orange-500/20 hover:border-orange-500/40"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18.326 9.2c-.288 0-.564.058-.817.164v-.001a2.213 2.213 0 00-.717.478 2.23 2.23 0 00-.48.718 2.206 2.206 0 00-.163.817v2.84c0 .287.058.563.163.817.105.253.265.48.48.718.215.237.464.423.717.478.253.106.529.164.817.164h1.99v-.879h-1.99a1.33 1.33 0 01-.49-.098 1.324 1.324 0 01-.43-.286 1.323 1.323 0 01-.287-.43 1.33 1.33 0 01-.098-.49v-2.84c0-.175.033-.343.098-.49.065-.147.159-.279.287-.43.128-.15.278-.27.43-.286.147-.065.315-.098.49-.098h1.99V9.2zm-4.645.879a1.33 1.33 0 00-.49-.098h-3.11v.879h3.11c.174 0 .342.033.49.098.147.065.278.159.43.286.15.128.27.278.286.43.065.147.098.315.098.49v2.84c0 .175-.033.343-.098.49a1.324 1.324 0 01-.287.43c-.128.15-.278.27-.43.286-.147.065-.315.098-.49.098h-3.11v.879h3.11c.288 0 .564-.058.817-.164.253-.105.48-.265.718-.478.237-.215.423-.464.478-.718.106-.253.164-.529.164-.817v-2.84a2.206 2.206 0 00-.164-.817 2.23 2.23 0 00-.478-.718 2.213 2.213 0 00-.718-.478 2.206 2.206 0 00-.817-.164zm-5.27 5.876h.888V9.2h-.888z" />
            </svg>
            CurseForge
          </a>

          <a
            href={modrinthUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm bg-green-500/10 text-green-400 hover:bg-green-500/20 rounded-xl transition-all hover:scale-105 flex items-center gap-2 shadow-md font-semibold border-2 border-green-500/20 hover:border-green-500/40"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 512 512">
              <path d="M331 201a49 49 0 1098 0 49 49 0 10-98 0zm-158 0a49 49 0 1098 0 49 49 0 10-98 0zm265 0C438 90 348 0 238 0S38 90 38 201c0 82 50 153 122 184l-24 85c-3 9 8 17 16 11l84-59c95 38 206 0 262-102 11-19 17-41 17-64zm-60 0c0 85-77 154-173 154-96 0-173-69-173-154S142 47 238 47s173 69 173 154z" />
            </svg>
            Modrinth
          </a>

          {mod.sources && (
            <a
              href={mod.sources}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-xl transition-all hover:scale-105 flex items-center gap-2 shadow-md font-semibold border-2 border-border hover:border-primary/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              className="px-4 py-2 text-sm bg-secondary hover:bg-secondary/80 rounded-xl transition-all hover:scale-105 flex items-center gap-2 shadow-md font-semibold border-2 border-border hover:border-primary/30"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

      {/* Additional Info */}
      <div className="border-2 border-primary/20 rounded-2xl p-6 bg-card shadow-lg hover:shadow-xl hover:border-primary/30 transition-all duration-300">
        <h3 className="font-bold mb-4 flex items-center gap-2 text-lg text-foreground">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
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
          <div className="flex justify-between items-center p-3 rounded-xl hover:bg-primary/5 transition-colors border-2 border-transparent hover:border-primary/20">
            <dt className="text-muted-foreground font-semibold">Mod ID:</dt>
            <dd className="font-mono text-xs bg-secondary/50 px-3 py-1.5 rounded-lg border border-border">{mod.modId}</dd>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl hover:bg-primary/5 transition-colors border-2 border-transparent hover:border-primary/20">
            <dt className="text-muted-foreground font-semibold">Version:</dt>
            <dd className="font-bold">{mod.version}</dd>
          </div>
          <div className="flex justify-between items-center p-3 rounded-xl hover:bg-primary/5 transition-colors border-2 border-transparent hover:border-primary/20">
            <dt className="text-muted-foreground font-semibold">Loader:</dt>
            <dd className="capitalize font-bold">{mod.loader || "Unknown"}</dd>
          </div>
          {mod.license && (
            <div className="flex justify-between items-center p-3 rounded-xl hover:bg-primary/5 transition-colors border-2 border-transparent hover:border-primary/20">
              <dt className="text-muted-foreground font-semibold">License:</dt>
              <dd className="font-bold">{mod.license}</dd>
            </div>
          )}
        </dl>
      </div>
    </div>
  );
}
