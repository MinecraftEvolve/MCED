import Fuse from "fuse.js";
import { ConfigFile, ConfigSetting } from "@/types/config.types";
import { ModInfo } from "../../shared/types/mod.types";

interface SearchableItem {
  modId: string;
  modName: string;
  setting: ConfigSetting;
  configFile: string;
}

interface SearchResult {
  item: SearchableItem;
  score: number;
  matches: any[];
}

export class SmartSearchService {
  private fuse: Fuse<SearchableItem> | null = null;
  private searchableItems: SearchableItem[] = [];

  /**
   * Index all configs for searching
   */
  indexConfigs(mods: ModInfo[], configsByMod: Map<string, ConfigFile[]>) {
    this.searchableItems = [];

    for (const mod of mods) {
      const configs = configsByMod.get(mod.modId) || [];

      for (const config of configs) {
        for (const setting of config.settings) {
          this.searchableItems.push({
            modId: mod.modId,
            modName: mod.name,
            setting,
            configFile: config.name,
          });
        }
      }
    }

    this.fuse = new Fuse(this.searchableItems, {
      keys: [
        { name: "setting.key", weight: 0.4 },
        { name: "setting.description", weight: 0.3 },
        { name: "modName", weight: 0.2 },
        { name: "setting.section", weight: 0.1 },
        { name: "setting.value", weight: 0.25 }, // Add value searching
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
    });
  }

  /**
   * Search across all configs
   */
  search(query: string): SearchResult[] {
    if (!this.fuse || !query.trim()) {
      return [];
    }

    const trimmedQuery = query.trim().toLowerCase();

    // Check for special queries
    if (trimmedQuery.startsWith("mod:")) {
      return this.searchByMod(trimmedQuery.substring(4).trim());
    }

    if (trimmedQuery.startsWith("type:")) {
      return this.searchByType(trimmedQuery.substring(5).trim());
    }

    if (trimmedQuery.startsWith("value:")) {
      return this.searchByValue(trimmedQuery.substring(6).trim());
    }

    // Natural language processing
    if (this.isNaturalLanguage(trimmedQuery)) {
      return this.naturalLanguageSearch(trimmedQuery);
    }

    // Regular fuzzy search
    const results = this.fuse.search(query);
    return results.map((r) => ({
      item: r.item,
      score: r.score || 0,
      matches: Array.from(r.matches || []),
    }));
  }

  /**
   * Search by mod name
   */
  private searchByMod(modName: string): SearchResult[] {
    return this.searchableItems
      .filter(
        (item) =>
          item.modName.toLowerCase().includes(modName) || item.modId.toLowerCase().includes(modName)
      )
      .map((item) => ({
        item,
        score: 0,
        matches: [],
      }));
  }

  /**
   * Search by setting type
   */
  private searchByType(type: string): SearchResult[] {
    return this.searchableItems
      .filter((item) => item.setting.type === type)
      .map((item) => ({
        item,
        score: 0,
        matches: [],
      }));
  }

  /**
   * Search by value
   */
  private searchByValue(value: string): SearchResult[] {
    return this.searchableItems
      .filter((item) => {
        const itemValue = String(item.setting.value).toLowerCase();
        return itemValue === value || itemValue.includes(value);
      })
      .map((item) => ({
        item,
        score: 0,
        matches: [],
      }));
  }

  /**
   * Check if query is natural language
   */
  private isNaturalLanguage(query: string): boolean {
    const naturalPhrases = [
      "settings about",
      "settings for",
      "settings that",
      "configs for",
      "show me",
      "find",
      "all settings",
      "how to",
    ];

    return naturalPhrases.some((phrase) => query.includes(phrase));
  }

  /**
   * Natural language search with semantic understanding
   */
  private naturalLanguageSearch(query: string): SearchResult[] {
    const keywords = this.extractKeywords(query);

    if (keywords.length === 0) {
      return (
        this.fuse?.search(query).map((r) => ({
          item: r.item,
          score: r.score || 0,
          matches: Array.from(r.matches || []),
        })) || []
      );
    }

    // Search for each keyword and combine results
    const resultMap = new Map<SearchableItem, { score: number; matches: any[] }>();

    for (const keyword of keywords) {
      const results = this.fuse?.search(keyword) || [];

      for (const result of results) {
        const existing = resultMap.get(result.item);
        if (existing) {
          existing.score = Math.min(existing.score, result.score || 0);
          existing.matches.push(...Array.from(result.matches || []));
        } else {
          resultMap.set(result.item, {
            score: result.score || 0,
            matches: Array.from(result.matches || []),
          });
        }
      }
    }

    return Array.from(resultMap.entries())
      .map(([item, { score, matches }]) => ({ item, score, matches }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 50);
  }

  /**
   * Extract keywords from natural language query
   */
  private extractKeywords(query: string): string[] {
    // Remove common words
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "about",
      "settings",
      "configs",
      "config",
      "setting",
      "show",
      "me",
      "find",
      "all",
      "how",
      "that",
      "is",
      "are",
    ]);

    return query
      .toLowerCase()
      .split(/\s+/)
      .filter((word) => word.length > 2 && !stopWords.has(word));
  }

  /**
   * Get search suggestions
   */
  getSuggestions(partial: string): string[] {
    if (!partial || partial.length < 2) {
      return [];
    }

    const results = this.fuse?.search(partial, { limit: 10 }) || [];
    return results.map((r) => r.item.setting.key);
  }

  /**
   * Get total indexed items count
   */
  getIndexedCount(): number {
    return this.searchableItems.length;
  }
}

export const smartSearchService = new SmartSearchService();
