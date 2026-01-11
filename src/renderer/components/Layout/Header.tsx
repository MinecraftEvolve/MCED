import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { LaunchButton } from './LaunchButton';

interface HeaderProps {
  onSearchClick: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
  const { currentInstance } = useAppStore();

  if (!currentInstance) return null;

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center px-6">
        <div className="flex-1 flex flex-col">
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

        <div className="flex items-center gap-3">
          <LaunchButton />
          
          <button
            onClick={onSearchClick}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-md transition-colors flex items-center gap-2 text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
            <span className="text-xs text-muted-foreground ml-1">Ctrl+F</span>
          </button>
        </div>
      </div>
    </header>
  );
}
