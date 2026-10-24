import React, { useEffect, useRef, useState } from "react";
import { Search, X, ArrowUpDown } from "lucide-react";

const TYPE_FILTERS = ["all", "mod", "config", "profile", "setting"] as const;

type FilterState = {
  types: string[];
  searchInValues: boolean;
  modifiedOnly: boolean;
};

interface SmartSearchProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (result: any) => void;
  initialQuery?: string;
}

export function SmartSearch({ isOpen, onClose, onSelect, initialQuery = "" }: SmartSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [filters, setFilters] = useState<FilterState>({
    types: [],
    searchInValues: false,
    modifiedOnly: false,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setQuery(initialQuery);
  }, [initialQuery, isOpen]);

  useEffect(() => {
    if (!isOpen || !query.trim()) {
      setSearchResults([]);
      return;
    }

    const runSearch = async () => {
      setIsSearching(true);
      try {
        const results = await (window.api as any).smartSearch?.(query, filters);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (error) {
        console.error("Smart search failed:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(runSearch, 200);
    return () => clearTimeout(timer);
  }, [isOpen, query, filters]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") onClose();
    if (e.key === "Enter" && searchResults[0]) {
      onSelect?.(searchResults[0]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 pt-20 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl border-2 border-primary/30 bg-card shadow-2xl shadow-black/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b-2 border-primary/20 p-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search all configs... (try 'settings about performance')"
              className="w-full rounded-xl border-2 border-primary/20 bg-secondary/60 px-4 py-3 pl-12 text-lg text-foreground outline-none transition-colors duration-200 focus:border-primary/50 focus:ring-2 focus:ring-primary/30"
            />
            <Search className="absolute left-4 top-3.5 h-6 w-6 text-muted-foreground" />
            {isSearching && <div className="absolute right-4 top-4 h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />}
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter:</span>
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    types: f.types.includes(t)
                      ? f.types.filter((x) => x !== t)
                      : [...f.types, t],
                  }))
                }
                className={`rounded-full border px-2 py-0.5 text-xs transition-colors duration-200 ${
                  filters.types.includes(t)
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-primary/20 bg-secondary text-muted-foreground hover:border-primary/50"
                }`}
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => setFilters((f) => ({ ...f, modifiedOnly: !f.modifiedOnly }))}
              className={`rounded-full border px-2 py-0.5 text-xs transition-colors duration-200 ${
                filters.modifiedOnly
                  ? "border-orange-500/40 bg-orange-500/20 text-orange-400"
                  : "border-primary/20 bg-secondary text-muted-foreground hover:border-primary/50"
              }`}
            >
              Changed only
            </button>
            {(filters.types.length > 0 || filters.modifiedOnly) && (
              <button
                onClick={() => setFilters({ types: [], searchInValues: false, modifiedOnly: false })}
                className="text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {searchResults.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {query.trim() ? "No matches found" : "Search for settings, mods, or config values"}
            </div>
          ) : (
            <div className="space-y-2">
              {searchResults.map((result, index) => (
                <button
                  key={`${result.path ?? result.id ?? index}-${index}`}
                  onClick={() => {
                    onSelect?.(result);
                    onClose();
                  }}
                  className="flex w-full items-start gap-3 rounded-xl border border-primary/15 bg-card/60 p-3 text-left transition-colors duration-200 hover:border-primary/30 hover:bg-primary/5"
                >
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-1.5 text-primary">
                    <ArrowUpDown className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-foreground">{result.title ?? result.name ?? result.path ?? "Result"}</div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">{result.path ?? result.description ?? result.context ?? "No summary"}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-primary/10 px-4 py-3 text-xs text-muted-foreground">
          <span>Press Enter to open first result</span>
          <button onClick={onClose} className="inline-flex items-center gap-1 rounded-lg border border-primary/20 px-2 py-1 hover:bg-primary/10">
            <X className="h-3.5 w-3.5" />
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
