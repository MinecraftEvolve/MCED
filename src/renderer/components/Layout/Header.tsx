import React from 'react';
import { useAppStore } from '@/store';

export function Header() {
  const { currentInstance } = useAppStore();

  if (!currentInstance) return null;

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <div className="flex flex-col">
          <h1 className="text-lg font-semibold">{currentInstance.name}</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>MC {currentInstance.minecraftVersion}</span>
            <span>•</span>
            <span>{currentInstance.loader.type} {currentInstance.loader.version}</span>
            {currentInstance.modpack && (
              <>
                <span>•</span>
                <span>{currentInstance.modpack.name}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
