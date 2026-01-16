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
    console.log("=== FluidRegistryService.initialize CALLED ===");
    console.log("Mods folder:", modsFolder);
    
    // Always rebuild to ensure fresh data
    console.log("Building new fluid registry...");
    await this.buildFluidRegistry(modsFolder);
    await this.saveCache();
  }

  async buildFluidRegistry(modsFolder: string): Promise<void> {
    console.log("=== buildFluidRegistry CALLED ===");
    const fluids: FluidInfo[] = [];

    try {
      // Load vanilla Minecraft fluids from Forge JAR
      console.log("Loading vanilla fluids from Forge JAR...");
      const forgeData = await this.jarLoader.findAndLoadForgeJar(this.instancePath);
      if (forgeData) {
        console.log(`Loaded ${forgeData.fluids.length} vanilla fluids from Forge JAR`);
        forgeData.fluids.forEach(fluid => {
          fluids.push({
            id: fluid.id,
            modId: 'minecraft',
            name: fluid.name,
            texture: `data:image/png;base64,${fluid.texture}`,
          });
        });
      } else {
        console.log("Forge JAR not found, trying Minecraft JAR...");
        // Fallback to vanilla Minecraft JAR
        const vanillaData = await this.jarLoader.findAndLoadMinecraftJar(this.instancePath);
        if (vanillaData && vanillaData.fluids.length > 0) {
          console.log(`Loaded ${vanillaData.fluids.length} vanilla fluids from Minecraft JAR`);
          vanillaData.fluids.forEach(fluid => {
            fluids.push({
              id: fluid.id,
              modId: 'minecraft',
              name: fluid.name,
              texture: `data:image/png;base64,${fluid.texture}`,
            });
          });
        }
      }

      // Add hardcoded vanilla fluids (water and lava)
      // These are always present in Minecraft but not as JSON registry entries
      fluids.push(
        {
          id: 'minecraft:water',
          modId: 'minecraft',
          name: 'Water',
          texture: '', // Will use default fluid texture
        },
        {
          id: 'minecraft:lava',
          modId: 'minecraft',
          name: 'Lava',
          texture: '', // Will use default fluid texture
        }
      );

      // Always load all JARs fresh to get fluid data
      // (ItemRegistryService might have loaded from cache without loading JARs)
      console.log("Loading all mod JARs for fluid extraction...");
      await this.jarLoader.loadAllJars(modsFolder);
      const allJarData = this.jarLoader.getAllCachedData();
      console.log(`Found ${allJarData.length} JAR entries after loading`);
      
      let fluidCount = 0;
      for (const jarData of allJarData) {
        if (jarData.fluids.length > 0) {
          console.log(`Found ${jarData.fluids.length} fluids in ${jarData.modId}`);
          fluidCount += jarData.fluids.length;
        }
        jarData.fluids.forEach(fluid => {
          fluids.push({
            id: fluid.id,
            modId: jarData.modId,
            name: fluid.name,
            texture: `data:image/png;base64,${fluid.texture}`,
          });
        });
      }
      
      console.log(`Total fluids extracted from ${allJarData.length} JARs: ${fluidCount}`);

      this.cache = {
        fluids,
        lastUpdated: Date.now(),
      };
      
      console.log(`Built fluid registry with ${fluids.length} fluids`);
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
      console.log(`Fluid cache saved to ${cacheFile}`);
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
    return this.cache?.fluids.find(f => f.id === id) || null;
  }

  async searchFluids(query: string): Promise<FluidInfo[]> {
    const allFluids = await this.getAllFluids();
    const lowerQuery = query.toLowerCase();
    return allFluids.filter(
      f =>
        f.id.toLowerCase().includes(lowerQuery) ||
        f.name.toLowerCase().includes(lowerQuery)
    );
  }

  async rebuildCache(modsFolder: string): Promise<void> {
    await this.buildFluidRegistry(modsFolder);
    await this.saveCache();
  }
}
