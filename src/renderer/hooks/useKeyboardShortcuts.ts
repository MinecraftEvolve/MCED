import { useEffect } from "react";
import { useAppStore } from "@/store";

export function useKeyboardShortcuts(callbacks?: {
  onOpenSettings?: () => void;
  onOpenBackups?: () => void;
  onOpenSearch?: () => void;
  onOpenInstance?: () => void;
  onCloseInstance?: () => void;
}) {
  const { 
    hasUnsavedChanges, 
    saveConfigs, 
    discardChanges,
    mods,
    selectedMod,
    setSelectedMod,
    currentInstance
  } = useAppStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S - Save
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (hasUnsavedChanges) {
          saveConfigs();
        }
      }

      // Ctrl+Z - Undo/Discard
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        if (hasUnsavedChanges) {
          discardChanges();
        }
      }

      // Ctrl+F - Open Smart Search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        callbacks?.onOpenSearch?.();
      }

      // Ctrl+, - Open Settings
      if ((e.ctrlKey || e.metaKey) && e.key === ",") {
        e.preventDefault();
        callbacks?.onOpenSettings?.();
      }

      // Ctrl+B - Open Backups
      if ((e.ctrlKey || e.metaKey) && e.key === "b") {
        e.preventDefault();
        callbacks?.onOpenBackups?.();
      }

      // Ctrl+O - Open Instance
      if ((e.ctrlKey || e.metaKey) && e.key === "o") {
        e.preventDefault();
        callbacks?.onOpenInstance?.();
      }

      // Ctrl+W - Close Instance
      if ((e.ctrlKey || e.metaKey) && e.key === "w") {
        e.preventDefault();
        if (currentInstance) {
          callbacks?.onCloseInstance?.();
        }
      }

      // Alt+Left - Previous mod
      if (e.altKey && e.key === "ArrowLeft") {
        e.preventDefault();
        if (selectedMod && mods.length > 0) {
          const currentIndex = mods.findIndex(m => m.modId === selectedMod.modId);
          if (currentIndex > 0) {
            setSelectedMod(mods[currentIndex - 1]);
          }
        }
      }

      // Alt+Right - Next mod
      if (e.altKey && e.key === "ArrowRight") {
        e.preventDefault();
        if (selectedMod && mods.length > 0) {
          const currentIndex = mods.findIndex(m => m.modId === selectedMod.modId);
          if (currentIndex < mods.length - 1) {
            setSelectedMod(mods[currentIndex + 1]);
          }
        }
      }

      // Escape - Clear search or close modals
      if (e.key === "Escape") {
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search"]',
        );
        if (searchInput && searchInput.value) {
          searchInput.value = "";
          searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    hasUnsavedChanges, 
    saveConfigs, 
    discardChanges, 
    callbacks,
    mods,
    selectedMod,
    setSelectedMod,
    currentInstance
  ]);
}
