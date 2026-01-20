import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { AlertTriangle, Play, Square } from "lucide-react";

export function StatusBar() {
  const {
    hasUnsavedChanges,
    setHasUnsavedChanges,
    currentInstance,
    launcherType,
    setLauncherType,
  } = useAppStore();
  const [showDiscardDialog, setShowDiscardDialog] = useState(false);
  const [isGameRunning, setIsGameRunning] = useState(false);

  const handleKillGame = async () => {
    if (!currentInstance) return;

    const confirm = window.confirm("Are you sure you want to stop the game?");
    if (!confirm) return;

    try {
      const result = await window.api.launcherKillInstance(currentInstance.path);
      if (result.success) {
        setIsGameRunning(false);
      } else {
        alert(`Failed to stop game: ${result.error}`);
      }
    } catch (error) {
      alert(`Error stopping game: ${error}`);
    }
  };

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
      <div className="flex-none border-t border-primary/20 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-xl shadow-lg">
        <div className="flex h-14 items-center justify-between px-6">
          {/* Actions */}
          <div className="flex items-center gap-3">
            {hasUnsavedChanges && (
              <>
                <span className="flex items-center gap-2 text-sm text-amber-400 font-semibold px-3 py-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20">
                  <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></div>
                  Unsaved changes
                </span>
                <button
                  onClick={handleDiscardChanges}
                  className="px-5 py-2 text-sm rounded-xl hover:bg-accent/20 hover:text-accent-foreground transition-all font-medium border-2 border-transparent hover:border-accent/30 hover:scale-105"
                >
                  Discard Changes
                </button>
                <button
                  onClick={handleSaveAll}
                  className="px-5 py-2 text-sm bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 hover:scale-105"
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
          className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center animate-fadeIn"
          style={{ zIndex: 10001 }}
        >
          <div
            className="bg-card border-2 border-primary/30 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 animate-slideInRight"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 rounded-2xl bg-amber-500/10 border-2 border-amber-500/30 flex items-center justify-center mb-6 shadow-lg shadow-amber-500/20">
                <AlertTriangle size={40} className="text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-3">Discard All Changes?</h3>
              <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
                All unsaved changes will be lost. This action cannot be undone.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDiscardDialog(false)}
                  className="flex-1 px-5 py-3 bg-secondary text-secondary-foreground rounded-xl hover:bg-secondary/80 transition-all font-semibold border-2 border-border hover:border-primary/30 hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDiscard}
                  className="flex-1 px-5 py-3 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all font-semibold shadow-lg shadow-amber-500/30 hover:shadow-amber-500/50 hover:scale-105"
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
