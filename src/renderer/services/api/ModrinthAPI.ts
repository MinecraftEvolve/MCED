/**
 * Modrinth API Service
 * Fetches mod information from Modrinth
 */

export interface ModrinthMod {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_url?: string;
  downloads: number;
  followers: number;
  categories: string[];
  versions: string[];
  date_created: string;
  date_modified: string;
  license: {
    name: string;
    url?: string;
  };
  source_url?: string;
  wiki_url?: string;
  issues_url?: string;
  discord_url?: string;
}

class ModrinthAPIService {
  private baseUrl = "https://api.modrinth.com/v2";
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheDuration = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Search for a mod by slug or ID
   */
  async searchMod(query: string): Promise<ModrinthMod | null> {
    try {
      // Check cache
      const cached = this.getFromCache(`search:${query}`);
      if (cached) return cached;

      // Try as project ID/slug first
      try {
        const mod = await this.getProject(query);
        if (mod) {
          this.setCache(`search:${query}`, mod);
          return mod;
        }
      } catch {}

      // Search by query via Electron API
      const result = await window.api.modrinthSearch(query);
      if (result.success && result.mod) {
        const hit = result.mod;
        const mod: ModrinthMod = {
          id: hit.project_id,
          slug: hit.slug,
          title: hit.title,
          description: hit.description,
          icon_url: hit.icon_url,
          downloads: hit.downloads,
          followers: hit.follows,
          categories: hit.categories || [],
          versions: hit.versions || [],
          date_created: hit.date_created,
          date_modified: hit.date_modified,
          license: hit.license || { name: "Unknown" },
        };

        this.setCache(`search:${query}`, mod);
        return mod;
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get mod by project ID or slug
   */
  async getProject(idOrSlug: string): Promise<ModrinthMod | null> {
    try {
      const cached = this.getFromCache(`project:${idOrSlug}`);
      if (cached) return cached;

      const result = await window.api.modrinthGetProject(idOrSlug);
      if (!result.success || !result.project) return null;

      const data = result.project;
      const mod: ModrinthMod = {
        id: data.id,
        slug: data.slug,
        title: data.title,
        description: data.description,
        icon_url: data.icon_url,
        downloads: data.downloads,
        followers: data.followers,
        categories: data.categories || [],
        versions: data.versions || [],
        date_created: data.published,
        date_modified: data.updated,
        license: data.license || { name: "Unknown" },
        source_url: data.source_url,
        wiki_url: data.wiki_url,
        issues_url: data.issues_url,
        discord_url: data.discord_url,
      };

      this.setCache(`project:${idOrSlug}`, mod);
      return mod;
    } catch (error) {
      return null;
    }
  }

  /**
   * Get icon URL for a mod
   */
  async getIconUrl(modIdOrSlug: string): Promise<string | null> {
    const mod = await this.getProject(modIdOrSlug);
    return mod?.icon_url || null;
  }

  private getFromCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export default new ModrinthAPIService();
