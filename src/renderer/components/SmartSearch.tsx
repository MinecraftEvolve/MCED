import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAppStore } from "@/store";
import { useChangeTrackingStore } from "@/store/changeTrackingStore";
import { smartSearchService } from "@/services/SmartSearchService";

interface SearchableItem {
  modId: string;
  modName: string;
  setting: {
    key: string;
    value: unknown;
    type: string;
    description?: string;
  };
  configFile: string;
}

interface SearchResult {
  item: SearchableItem;
  score?: number;
  matches?: unknown[];
}

interface SearchFilters {
  types: string[];
  searchInValues: boolean;
  modifiedOnly: boolean;
}

interface SmartSearchProps {
  onClose: () => void;
}

export function SmartSearch({ onClose }: SmartSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    types: [],
    searchInValues: false,
    modifiedOnly: false,
  });
  const inputRef = useRef<HTMLInputElement>(null);
  const { mods } = useAppStore();
  const { changes } = useChangeTrackingStore();

  // Filter results by active filters
  const filteredResults = useMemo(() => {
    let res = results;
    if (filters.types.length > 0) {
      res = res.filter((r) => filters.types.includes(r.item.setting.type));
    }
    if (filters.modifiedOnly) {
      const modifiedKeys = new Set(
        (Array.from(changes.entries()) as [string, { isModified: boolean }][])
          .filter(([, c]) => c.isModified)
          .map(([k]) => k)
      );
      res = res.filter((r) => {
        const key = `${r.item.modId}:${r.item.setting.key}`;
        return modifiedKeys.has(key);
      });
    }
    return res;
  }, [results, filters, changes]);

  const TYPE_FILTERS = ["boolean", "integer", "float", "string", "enum", "array"] as const;

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("mced-recent-searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load recent searches:", e);
      }
    }
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    // Global ESC key handler
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    setIsSearching(true);

    const timer = setTimeout(() => {
      const searchResults = smartSearchService.search(query);
      setResults(searchResults.slice(0, 20));

      if (query.length >= 2) {
        const sugg = smartSearchService.getSuggestions(query);
        setSuggestions(sugg.slice(0, 5));
      }

      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  const handleResultClick = (result: SearchResult) => {
    // Find and select the mod
    const mod = mods.find((m) => m.modId === result.item.modId);
    if (mod) {
      useAppStore.getState().setSelectedMod(mod);
      onClose();
    }
  };

  const exampleQueries = ["settings about performance", "mod:create", "type:boolean", "value:true"];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl bg-background border border-primary/20 rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-primary/20">
          <div className="relative">
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search all configs... (try 'settings about performance')"
              className="w-full px-4 py-3 pl-12 bg-secondary border border-primary/20 rounded-md focus:outline-none focus:ring-2 focus:ring-primary text-lg"
            />
            <svg
              className="absolute left-4 top-3.5 h-6 w-6 text-muted-foreground"
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
            {isSearching && (
              <div className="absolute right-4 top-4">
                <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
              </div>
            )}
          </div>

          {/* Filter Pills */}
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-muted-foreground">Filter:</span>
            {TYPE_FILTERS.map((t) => (
              <button
                key={t}
                onClick={() =>
                  setFilters((f) => ({
                    ...f,
                    types: f.types.includes(t) ? f.types.filter((x) => x !== t) : [...f.types, t],
                  }))
                }
                className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                  filters.types.includes(t)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-secondary border-primary/20 hover:border-primary/50 text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
            <button
              onClick={() => setFilters((f) => ({ ...f, modifiedOnly: !f.modifiedOnly }))}
              className={`px-2 py-0.5 text-xs rounded-full border transition-colors ${
                filters.modifiedOnly
                  ? "bg-orange-500/20 text-orange-400 border-orange-500/40"
                  : "bg-secondary border-primary/20 hover:border-primary/50 text-muted-foreground"
              }`}
            >
              Changed only
            </button>
            {(filters.types.length > 0 || filters.modifiedOnly) && (
              <button
                onClick={() => setFilters({ types: [], searchInValues: false, modifiedOnly: false })}
                className="px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Examples */}
          {!query && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Try:</p>
              <div className="flex flex-wrap gap-2">
                {exampleQueries.map((example) => (
                  <button
                    key={example}
                    onClick={() => setQuery(example)}
                    className="px-3 py-1 text-sm bg-secondary hover:bg-secondary/80 rounded-full transition-colors"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions */}
          {suggestions.length > 0 && query.length >= 2 && (
            <div className="mt-2">
              <p className="text-xs text-muted-foreground mb-1">Suggestions:</p>
              <div className="flex flex-wrap gap-1">
                {suggestions.map((suggestion, i) => (
                  <button
                    key={i}
                    onClick={() => setQuery(suggestion)}
                    className="px-2 py-1 text-xs bg-accent hover:bg-accent/80 rounded transition-colors"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto">
          {filteredResults.length > 0 ? (
            <div className="divide-y divide-border">
              {filteredResults.map((result, i) => (
                <button
                  key={i}
                  onClick={() => handleResultClick(result)}
                  className="w-full p-4 text-left hover:bg-accent transition-colors"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{result.item.setting.key}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        {result.item.modName} • {result.item.configFile}
                      </p>
                      {result.item.setting.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {result.item.setting.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs px-2 py-1 bg-secondary rounded">
                        {result.item.setting.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {String(result.item.setting.value).substring(0, 20)}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : query && !isSearching ? (
            <div className="p-8 text-center text-muted-foreground">
              <p>No results found for "{query}"</p>
              <p className="text-sm mt-2">
                {filters.types.length > 0 || filters.modifiedOnly
                  ? "Try clearing the filters or different keywords"
                  : "Try different keywords or check the examples above"}
              </p>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-primary/20 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {filteredResults.length > 0 && `${filteredResults.length} results`}
            {filteredResults.length !== results.length && results.length > 0 && ` (${results.length} total)`}
            {smartSearchService.getIndexedCount() > 0 &&
              ` • ${smartSearchService.getIndexedCount()} settings indexed`}
          </span>
          <span>Press ESC to close</span>
        </div>
      </div>
    </div>
  );
}
