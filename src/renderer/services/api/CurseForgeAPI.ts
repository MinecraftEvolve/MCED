interface CurseForgeSearchResponse {
  data: CurseForgeModData[];
  pagination: {
    resultCount: number;
    pageSize: number;
    totalCount: number;
  };
}

interface CurseForgeModData {
  id: number;
  name: string;
  slug: string;
  summary: string;
  downloadCount: number;
  dateReleased: string;
  dateModified: string;
  logo: {
    thumbnailUrl: string;
    url: string;
  };
  links: {
    websiteUrl: string;
    wikiUrl?: string;
    issuesUrl?: string;
    sourceUrl?: string;
  };
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  authors: Array<{
    id: number;
    name: string;
    url: string;
  }>;
}

class CurseForgeAPI {
  private baseURL = "https://api.curseforge.com/v1";
  private apiKey: string | null = null;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheExpiry = 1000 * 60 * 60;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.apiKey) {
      throw new Error("CurseForge API key not configured");
    }

    const cacheKey = `${endpoint}${JSON.stringify(options)}`;
    const cached = this.cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        "x-api-key": this.apiKey,
        Accept: "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`CurseForge API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });

    return data;
  }

  async searchMod(query: string): Promise<CurseForgeModData | null> {
    try {
      const response = await this.request<CurseForgeSearchResponse>("/mods/search", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.data && response.data.length > 0) {
        const normalizedQuery = query.toLowerCase().replace(/[_\s-]/g, "");

        const exactMatch = response.data.find(
          (mod) =>
            mod.slug.toLowerCase() === query.toLowerCase() ||
            mod.name.toLowerCase() === query.toLowerCase() ||
            mod.slug.toLowerCase().replace(/[_\s-]/g, "") === normalizedQuery ||
            mod.name.toLowerCase().replace(/[_\s-]/g, "") === normalizedQuery
        );

        return exactMatch || response.data[0];
      }

      return null;
    } catch (error) {
      console.error("CurseForge API error:", error);
      return null;
    }
  }

  async getModById(modId: number): Promise<CurseForgeModData | null> {
    try {
      const response = await this.request<{ data: CurseForgeModData }>(`/mods/${modId}`);
      return response.data;
    } catch (error) {
      console.error("CurseForge API error:", error);
      return null;
    }
  }

  async getModsByIds(modIds: number[]): Promise<CurseForgeModData[]> {
    try {
      const response = await this.request<{ data: CurseForgeModData[] }>("/mods", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ modIds }),
      });
      return response.data;
    } catch (error) {
      console.error("CurseForge API error:", error);
      return [];
    }
  }

  clearCache() {
    this.cache.clear();
  }
}

export const curseForgeAPI = new CurseForgeAPI();
export default curseForgeAPI;
