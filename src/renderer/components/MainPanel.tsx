import React from "react";
import { useAppStore } from "@/store";
import { ModCard } from "./ModCard";
import { ConfigEditor } from "./ConfigEditor/ConfigEditor";
import { KubeJSEditor } from "./KubeJS/KubeJSEditor";
import { RemoteConnectionManager } from "./remote/RemoteConnectionManager";
import { RemoteFileBrowser } from "./remote/RemoteFileBrowser";
import { FolderOpen } from "lucide-react";
import { useRemoteConnectionStore } from "../store/remoteConnectionStore";

export function MainPanel() {
  const { selectedMod, currentInstance, viewMode } = useAppStore();
  const { connectionStatus } = useRemoteConnectionStore();

  // Remote panel works independently of a local instance
  if (viewMode === "remote") {
    return (
      <main className="flex-1 overflow-hidden bg-background flex">
        <div className="w-80 flex-shrink-0 border-r border-primary/20 flex flex-col overflow-hidden">
          <RemoteConnectionManager />
        </div>
        <div className="flex-1 overflow-hidden">
          <RemoteFileBrowser />
        </div>
      </main>
    );
  }

  if (!currentInstance) return null;

  // Show KubeJS Editor when in KubeJS mode
  if (viewMode === "kubejs") {
    return (
      <main className="flex-1 overflow-auto bg-background">
        <KubeJSEditor instancePath={currentInstance.path} />
      </main>
    );
  }

  return (
    <main className="flex-1 overflow-auto bg-gradient-to-br from-background to-primary/5">
      <div className="container max-w-5xl mx-auto p-8 space-y-8">
        {selectedMod ? (
          <>
            <ModCard mod={selectedMod} />
            <div className="border-t border-primary/20 pt-8">
              <h2 className="text-3xl font-bold mb-6 bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent">Configuration</h2>
              <ConfigEditor modId={selectedMod.modId} instancePath={currentInstance.path} />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center space-y-4 animate-fadeIn">
              <div className="w-24 h-24 mx-auto bg-primary/10 rounded-3xl flex items-center justify-center mb-4">
                <FolderOpen className="w-12 h-12 text-primary" />
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
