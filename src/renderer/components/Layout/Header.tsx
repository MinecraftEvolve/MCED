import React, { useState } from 'react';
import { useAppStore } from '@/store';
import { Settings } from '../Settings/Settings';

interface HeaderProps {
  onSearchClick: () => void;
}

export function Header({ onSearchClick }: HeaderProps) {
  const { currentInstance } = useAppStore();
  const [showSettings, setShowSettings] = useState(false);

  // If no instance, show minimal header with just settings button
  if (!currentInstance) {
    return (
      <header className="border-b border-border bg-card/50 backdrop-blur-xl">
        <div className="flex h-16 items-center px-6 gap-4">
          <div className="flex items-center gap-3">
            <img src="/assets/icon.png" alt="Logo" className="w-10 h-10 rounded-lg shadow-lg" />
            <span className="text-base font-bold">Minecraft Config Editor</span>
          </div>
          <div className="flex-1"></div>
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-sm"
            title="Settings"
          >
            <svg className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        {showSettings && <Settings onClose={() => setShowSettings(false)} />}
      </header>
    );
  }

  return (
    <header className="border-b border-border bg-card/50 backdrop-blur-xl">
      <div className="flex h-16 items-center px-6 gap-4">
        {/* App Logo & Title */}
        <div className="flex items-center gap-3">
          <img src="/assets/icon.png" alt="Logo" className="w-10 h-10 rounded-lg shadow-lg" />
          <div className="flex flex-col">
            <span className="text-xs text-muted-foreground font-medium">Minecraft Config Editor</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-8 w-px bg-border"></div>

        {/* Instance Info */}
        <div className="flex-1 flex flex-col">
          <h1 className="text-base font-bold bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
            {currentInstance.name}
          </h1>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="px-2 py-0.5 bg-green-500/10 text-green-400 rounded font-medium">
              MC {currentInstance.minecraftVersion}
            </span>
            <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded font-medium">
              {currentInstance.loader.type.charAt(0).toUpperCase() + currentInstance.loader.type.slice(1)} {currentInstance.loader.version}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={onSearchClick}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-sm"
          >
            <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
            <kbd className="text-xs text-muted-foreground ml-1 px-1.5 py-0.5 bg-background rounded border border-border">Ctrl+F</kbd>
          </button>
          
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-2 bg-secondary hover:bg-secondary/80 rounded-lg transition-all hover:scale-105 flex items-center gap-2 text-sm font-medium group shadow-sm"
            title="Settings"
          >
            <svg className="w-4 h-4 group-hover:rotate-45 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>
      
      {showSettings && <Settings onClose={() => setShowSettings(false)} />}
    </header>
  );
}
