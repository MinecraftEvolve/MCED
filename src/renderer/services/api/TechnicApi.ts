import axios from 'axios';

const TECHNIC_API_BASE = 'https://api.technicpack.net';

interface TechnicModpack {
  name: string;
  displayName: string;
  url: string;
  iconUrl: string;
  logoUrl: string;
  backgroundUrl: string;
  description: string;
  user: string;
  downloads: number;
  runs: number;
  likes: number;
}

class TechnicApi {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private cacheTimeout = 24 * 60 * 60 * 1000;

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

  async getModpack(slug: string): Promise<TechnicModpack | null> {
    const cacheKey = `technic_modpack_${slug}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${TECHNIC_API_BASE}/modpack/${slug}`);
      this.setCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Technic API error:', error);
      return null;
    }
  }

  async searchModpack(query: string): Promise<TechnicModpack[]> {
    const cacheKey = `technic_search_${query}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await axios.get(`${TECHNIC_API_BASE}/modpack/search`, {
        params: { q: query }
      });
      const modpacks = response.data.modpacks || [];
      this.setCache(cacheKey, modpacks);
      return modpacks;
    } catch (error) {
      console.error('Technic API search error:', error);
      return [];
    }
  }
}

export const technicApi = new TechnicApi();
