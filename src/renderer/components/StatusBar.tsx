import React, { useState } from "react";
import { useAppStore } from "@/store";
import { AlertTriangle } from "lucide-react";

export function StatusBar() {
  const { hasUnsavedChanges, setHasUnsavedChanges, currentInstance } = useAppStore();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const handleSaveAll = () => {
    const event = new CustomEvent("save-all-configs");
    window.dispatchEvent(event);
  };

  const handleDiscardChanges = () => setShowDiscardDialog(true);

  const confirmDiscard = () => {
    const event = new CustomEvent("discard-all-changes");
    window.dispatchEvent(event);
    setHasUnsavedChanges(false);
    setShowDiscardDialog(false);
  };

  if (!currentInstance || !hasUnsavedChanges) return null;

  return (
    <>
      <div className="flex-none border-t border-primary/20 bg-gradient-to-r from-card/80 to-card/60 shadow-lg backdrop-blur-xl">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <>
                <span className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-1.5 text-sm font-semibold text-amber-400">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-amber-400" />
                  Unsaved changes
                </span>
                <button
                  onClick={handleDiscardChanges}
                  className="rounded-xl border border-transparent px-5 py-2 text-sm font-medium text-foreground transition-colors duration-200 hover:border-primary/30 hover:bg-primary/10"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSaveAll}
                  className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-colors duration-200 hover:bg-primary/90"
                >
                  Save All
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showDiscardDialog && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/70 backdrop-blur-md"
          onClick={() => setShowDiscardDialog(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-2xl border border-primary/30 bg-card p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-amber-500/30 bg-amber-500/10 shadow-lg shadow-amber-500/20">
                <AlertTriangle size={40} className="text-amber-400" />
              </div>
              <h3 className="mb-3 text-2xl font-bold text-foreground">Discard All Changes?</h3>
              <p className="mb-8 text-sm leading-relaxed text-muted-foreground">
                All unsaved changes will be lost. This action cannot be undone.
              </p>
              <div className="flex w-full gap-3">
                <button
                  onClick={() => setShowDiscardDialog(false)}
                  className="flex-1 rounded-xl border border-primary/20 bg-secondary px-5 py-3 text-sm font-semibold text-foreground transition-colors duration-200 hover:bg-secondary/80"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDiscard}
                  className="flex-1 rounded-xl bg-amber-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/30 transition-colors duration-200 hover:bg-amber-600"
                >
                  Discard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
