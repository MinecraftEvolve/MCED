import React from "react";
import { useAppStore } from "@/store";
import { ModCard } from "./ModCard";
import { ConfigEditor } from "./ConfigEditor/ConfigEditor";

export function MainPanel() {
  const { selectedMod, currentInstance } = useAppStore();

  if (!currentInstance) return null;

  return (
    <main className="flex-1 overflow-auto bg-background">
      <div className="container max-w-5xl mx-auto p-6 space-y-6">
        {selectedMod ? (
          <>
            <ModCard mod={selectedMod} />
            <div className="border-t border-border pt-6">
              <h2 className="text-2xl font-bold mb-4">Configuration</h2>
              <ConfigEditor
                modId={selectedMod.modId}
                instancePath={currentInstance.path}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <p className="text-lg mb-2">Select a mod to view details</p>
              <p className="text-sm">Choose from the list on the left</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
