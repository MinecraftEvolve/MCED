import React, { useState } from "react";
import { useAppStore } from "@/store";
import { ModCard } from "./ModCard";
import { ConfigEditor } from "./ConfigEditor/ConfigEditor";
import { KubeJSEditor } from "./KubeJS/KubeJSEditor";
import { RemoteConnectionManager } from "./remote/RemoteConnectionManager";
import { RemoteFileBrowser } from "./remote/RemoteFileBrowser";
import { RemoteConfigSearch } from "./remote/RemoteConfigSearch";
import { FolderOpen, Search } from "lucide-react";

export function MainPanel() {
  const { selectedMod, currentInstance, viewMode } = useAppStore();
  const [showRemoteSearch, setShowRemoteSearch] = useState(false);

  if (viewMode === "remote") {
    return (
      <main className="flex flex-1 overflow-hidden bg-background">
        <div className="w-80 flex-shrink-0 border-r border-primary/20 bg-card/20">
          <RemoteConnectionManager />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-primary/10 bg-card/30 px-3 py-1.5">
            <button
              onClick={() => setShowRemoteSearch(true)}
              className="mc-button-ghost"
              title="Search across all remote config files"
            >
              <Search className="h-3.5 w-3.5" />
              Search configs
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <RemoteFileBrowser />
          </div>
        </div>
        {showRemoteSearch && <RemoteConfigSearch onClose={() => setShowRemoteSearch(false)} />}
      </main>
    );
  }

  if (!currentInstance) return null;

  if (viewMode === "kubejs") {
    return (
      <main className="flex-1 overflow-auto bg-background">
        <KubeJSEditor instancePath={currentInstance.path} />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-primary/5">
      <div className="container mx-auto max-w-5xl space-y-8 p-8">
        {selectedMod ? (
          <>
            <ModCard mod={selectedMod} />
            <div className="border-t border-primary/20 pt-8">
              <h2 className="mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-3xl font-bold text-transparent">
                Configuration
              </h2>
              <ConfigEditor modId={selectedMod.modId} instancePath={currentInstance.path} />
            </div>
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            <div className="space-y-4 text-center animate-fadeIn">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-primary/10">
                <FolderOpen className="h-12 w-12 text-primary" />
              </div>
              <p className="text-2xl font-semibold text-foreground">Select a mod to view details</p>
              <p className="text-base">Choose from the list on the left to get started</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
