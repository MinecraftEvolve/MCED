import axios from "axios";

const FTB_API_BASE = "https://api.modpacks.ch/public";

interface FTBModpack {
  id: number;
  name: string;
  synopsis: string;
  description: string;
  art: Array<{
    url: string;
    type: string;
  }>;
  authors: Array<{
    name: string;
  }>;
  versions: Array<{
    id: number;
    name: string;
  }>;
}

class FTBApi {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 24 * 60 * 60 * 1000; // 24 hours

  private getCached(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  async searchModpack(name: string): Promise<FTBModpack | null> {
    const cacheKey = `ftb_modpack_${name}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(
        `${FTB_API_BASE}/modpack/search/8?term=${encodeURIComponent(name)}`,
      );
      const modpacks = response.data.packs || [];

      if (modpacks.length > 0) {
        const modpack = modpacks[0];
        this.setCache(cacheKey, modpack);
        return modpack;
      }
      return null;
    } catch (error) {
      return null;
    }
  }
}

export const ftbApi = new FTBApi();
