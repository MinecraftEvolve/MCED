import path from "path";
import { promises as fs } from "fs";
import { JarLoaderService } from "./JarLoaderService";

export interface FluidInfo {
  id: string; // Format: "modid:fluidname"
  modId: string;
  name: string;
  texture: string | null; // Base64 data URL or null
}

export interface FluidRegistryCache {
  fluids: FluidInfo[];
  lastUpdated: number;
}

export class FluidRegistryService {
  private cache: FluidRegistryCache | null = null;
  private cacheDir: string;
  private instancePath: string;
  private jarLoader: JarLoaderService;

  constructor(instancePath: string) {
    this.instancePath = instancePath;
    this.cacheDir = path.join(instancePath, ".mced", "fluid-cache");
    this.jarLoader = JarLoaderService.getInstance();
  }

  async initialize(modsFolder: string): Promise<void> {
    // Always rebuild to ensure fresh data
    await this.buildFluidRegistry(modsFolder);
    await this.saveCache();
  }

  async buildFluidRegistry(modsFolder: string): Promise<void> {
    const fluids: FluidInfo[] = [];

    try {
      // Load vanilla Minecraft fluids from Forge JAR
      const forgeData = await this.jarLoader.findAndLoadForgeJar(this.instancePath);
      if (forgeData) {
        forgeData.fluids.forEach((fluid) => {
          fluids.push({
            id: fluid.id,
            modId: "minecraft",
            name: fluid.name,
            texture: `data:image/png;base64,${fluid.texture}`,
          });
        });
      } else {
        // Fallback to vanilla Minecraft JAR
        const vanillaData = await this.jarLoader.findAndLoadMinecraftJar(this.instancePath);
        if (vanillaData && vanillaData.fluids.length > 0) {
          vanillaData.fluids.forEach((fluid) => {
            fluids.push({
              id: fluid.id,
              modId: "minecraft",
              name: fluid.name,
              texture: `data:image/png;base64,${fluid.texture}`,
            });
          });
        }
      }

      // Add hardcoded vanilla fluids (water and lava)
      fluids.push(
        {
          id: "minecraft:water",
          modId: "minecraft",
          name: "Water",
          texture: "",
        },
        {
          id: "minecraft:lava",
          modId: "minecraft",
          name: "Lava",
          texture: "",
        }
      );

      // Always load all JARs fresh to get fluid data
      await this.jarLoader.loadAllJars(modsFolder);
      const allJarData = this.jarLoader.getAllCachedData();

      for (const jarData of allJarData) {
        jarData.fluids.forEach((fluid) => {
          fluids.push({
            id: fluid.id,
            modId: jarData.modId,
            name: fluid.name,
            texture: `data:image/png;base64,${fluid.texture}`,
          });
        });
      }

      this.cache = {
        fluids,
        lastUpdated: Date.now(),
      };
    } catch (error) {
      console.error("Failed to build fluid registry:", error);
      this.cache = { fluids: [], lastUpdated: Date.now() };
    }
  }

  async loadCache(): Promise<boolean> {
    try {
      const cacheFile = path.join(this.cacheDir, "fluids.json");
      const data = await fs.readFile(cacheFile, "utf-8");
      this.cache = JSON.parse(data);
      return true;
    } catch (error) {
      return false;
    }
  }

  async saveCache(): Promise<void> {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      const cacheFile = path.join(this.cacheDir, "fluids.json");
      await fs.writeFile(cacheFile, JSON.stringify(this.cache, null, 2));
      console.error(`Fluid cache saved to ${cacheFile}`);
    } catch (error) {
      console.error("Failed to save fluid cache:", error);
    }
  }

  async getAllFluids(): Promise<FluidInfo[]> {
    if (!this.cache) {
      await this.loadCache();
    }
    return this.cache?.fluids || [];
  }

  async getFluidById(id: string): Promise<FluidInfo | null> {
    if (!this.cache) {
      await this.loadCache();
    }
    return this.cache?.fluids.find((f) => f.id === id) || null;
  }

  async searchFluids(query: string): Promise<FluidInfo[]> {
    const allFluids = await this.getAllFluids();
    const lowerQuery = query.toLowerCase();
    return allFluids.filter(
      (f) => f.id.toLowerCase().includes(lowerQuery) || f.name.toLowerCase().includes(lowerQuery)
    );
  }

  async rebuildCache(modsFolder: string): Promise<void> {
    await this.buildFluidRegistry(modsFolder);
    await this.saveCache();
  }
}
