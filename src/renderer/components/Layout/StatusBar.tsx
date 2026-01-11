import React from 'react';
import { useAppStore } from '@/store';

export function StatusBar() {
  const { hasUnsavedChanges, currentInstance } = useAppStore();

  if (!currentInstance) return null;

  return (
    <footer className="border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-12 items-center justify-between px-6">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Ready</span>
        </div>
        
        <div className="flex items-center gap-3">
          {hasUnsavedChanges && (
            <>
              <button
                className="px-4 py-1.5 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
              >
                Discard Changes
              </button>
              <button
                className="px-4 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Save All
              </button>
            </>
          )}
        </div>
      </div>
    </footer>
  );
}
