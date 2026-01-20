import React from "react";
import { useAppStore } from "@/store";

export function ModSearch() {
  const { searchQuery, setSearchQuery } = useAppStore();

  const handleClear = () => {
    setSearchQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setSearchQuery("");
      (e.target as HTMLInputElement).blur();
    }
  };

  return (
    <div className="p-4 border-b border-primary/20 bg-card/20">
      <div className="relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search mods... (ESC to clear)"
          className="w-full px-4 py-2.5 pl-10 bg-secondary/50 text-foreground rounded-xl border-2 border-primary/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/40 transition-all placeholder:text-muted-foreground/60 font-medium"
        />
        <svg
          className="absolute left-3 top-3 h-5 w-5 text-primary/60"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        {searchQuery && (
          <button
            onClick={handleClear}
            className="absolute right-2 top-2 p-1.5 hover:bg-destructive/20 text-muted-foreground hover:text-destructive rounded-lg transition-all"
            title="Clear search"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
