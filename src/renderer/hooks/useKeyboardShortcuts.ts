import { useEffect } from "react";
import { useAppStore } from "@/store";

export function useKeyboardShortcuts() {
  const { hasUnsavedChanges, saveConfigs, discardChanges } = useAppStore();

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
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (hasUnsavedChanges) {
          discardChanges();
        }
      }

      // Ctrl+F - Focus search
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search"]',
        );
        searchInput?.focus();
      }

      // Escape - Clear search or deselect mod
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
  }, [hasUnsavedChanges, saveConfigs, discardChanges]);
}
