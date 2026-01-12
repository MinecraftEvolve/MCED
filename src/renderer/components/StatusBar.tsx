import React, { useState } from "react";
import { useAppStore } from "@/store";
import { AlertTriangle } from "lucide-react";

export function StatusBar() {
  const { hasUnsavedChanges, setHasUnsavedChanges, currentInstance } =
    useAppStore();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);

  const handleSaveAll = () => {
    // Trigger save event - components will handle their own saves
    const event = new CustomEvent("save-all-configs");
    window.dispatchEvent(event);
  };

  const handleDiscardChanges = () => {
    setShowDiscardDialog(true);
  };

  const confirmDiscard = () => {
    const event = new CustomEvent("discard-all-changes");
    window.dispatchEvent(event);
    setHasUnsavedChanges(false);
    setShowDiscardDialog(false);
  };

  if (!currentInstance) return null;

  return (
    <>
      <footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-12 items-center justify-end px-6">
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <>
                <span className="text-sm text-amber-500 mr-2">• Unsaved changes</span>
                <button
                  onClick={handleDiscardChanges}
                  className="px-4 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSaveAll}
                  className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  Save All
                </button>
              </>
            )}
          </div>
        </div>
      </footer>

      {showDiscardDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center" style={{ zIndex: 10001 }}>
          <div className="bg-background border border-border rounded-xl shadow-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-full bg-amber-500/10 border-2 border-amber-500/20 flex items-center justify-center mb-4">
                <AlertTriangle size={32} className="text-amber-500" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">Discard All Changes?</h3>
              <p className="text-sm text-muted-foreground mb-6">
                All unsaved changes will be lost. This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDiscardDialog(false)}
                  className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDiscard}
                  className="flex-1 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-all font-medium shadow-lg shadow-amber-500/20"
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
