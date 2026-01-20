import AdmZip from "adm-zip";
import path from "path";
import { promises as fs } from "fs";
import { ModrinthProfileService } from "./ModrinthProfileService";
import { CurseForgeProfileService } from "./CurseForgeProfileService";
import { PackwizProfileService } from "./PackwizProfileService";

export interface JarData {
  modId: string;
  items: Array<{
    id: string;
    name: string;
    texture: string;
  }>;
  blocks: Array<{
    id: string;
    name: string;
    texture: string;
  }>;
  fluids: Array<{
    id: string;
    name: string;
    texture: string;
  }>;
  tags: Map<string, any>;
}

export type LauncherType = "modrinth" | "curseforge" | "generic" | "packwiz" | "unknown";

export class JarLoaderService {
  private static instance: JarLoaderService;
  private jarCache: Map<string, JarData> = new Map();
  private loadingPromises: Map<string, Promise<JarData>> = new Map();
  private loadAllPromise: Promise<JarData[]> | null = null;
  private lastModsFolder: string | null = null;

  private constructor() {}

  static getInstance(): JarLoaderService {
    if (!JarLoaderService.instance) {
      JarLoaderService.instance = new JarLoaderService();
    }
    return JarLoaderService.instance;
  }

  async detectLauncher(instancePath: string): Promise<LauncherType> {
    const profileJsonPath = path.join(instancePath, "profile.json");
    const modrinthAppPath = path.dirname(path.dirname(instancePath));
    const modrinthDbPath = path.join(modrinthAppPath, "app.db");

    const hasProfileJson = await fs
      .stat(profileJsonPath)
      .then(() => true)
      .catch(() => false);
    const hasModrinthDb = await fs
      .stat(modrinthDbPath)
      .then(() => true)
      .catch(() => false);
    const isCurseForge = await CurseForgeProfileService.isCurseForgeInstance(instancePath);
    const isPackwiz = await PackwizProfileService.isPackwizModpack(instancePath);

    if (hasModrinthDb && modrinthAppPath.includes("ModrinthApp")) {
      return "modrinth";
    } else if (isCurseForge) {
      return "curseforge";
    } else if (isPackwiz) {
      return "packwiz";
    } else if (hasProfileJson) {
      return "generic";
    }

    return "unknown";
  }

  async loadJar(jarPath: string, forceModId?: string): Promise<JarData> {
    // Check cache first
    if (this.jarCache.has(jarPath)) {
      return this.jarCache.get(jarPath)!;
    }

    // Check if already loading
    if (this.loadingPromises.has(jarPath)) {
      return this.loadingPromises.get(jarPath)!;
    }

    // Start loading
    const loadPromise = this._loadJarInternal(jarPath, forceModId);
    this.loadingPromises.set(jarPath, loadPromise);

    try {
      const data = await loadPromise;
      this.jarCache.set(jarPath, data);
      return data;
    } finally {
      this.loadingPromises.delete(jarPath);
    }
  }

  private async _loadJarInternal(jarPath: string, forceModId?: string): Promise<JarData> {
    const zip = new AdmZip(jarPath);
    const entries = zip.getEntries();

    // Extract mod ID
    const modId = forceModId || (await this.extractModId(entries, zip));

    // Extract all data in a single pass
    const items: JarData["items"] = [];
    const blocks: JarData["blocks"] = [];
    const fluids: JarData["fluids"] = [];
    const tags = new Map<string, any>();

    for (const entry of entries) {
      if (entry.isDirectory) continue;

      const entryPath = entry.entryName.replace(/\\/g, "/");

      // Item textures
      if (entryPath.includes("/textures/item/") && entryPath.endsWith(".png")) {
        const fileName = path.basename(entryPath, ".png");
        const texture = entry.getData().toString("base64");
        items.push({
          id: `${modId}:${fileName}`,
          name: fileName,
          texture,
        });
      }

      // Block textures
      else if (entryPath.includes("/textures/block/") && entryPath.endsWith(".png")) {
        const fileName = path.basename(entryPath, ".png");
        const texture = entry.getData().toString("base64");
        blocks.push({
          id: `${modId}:${fileName}`,
          name: fileName,
          texture,
        });
      }

      // Fluid textures
      else if (entryPath.includes("/textures/fluid/") && entryPath.endsWith(".png")) {
        const fileName = path.basename(entryPath, ".png");
        if (fileName.endsWith("_still")) {
          const fluidName = fileName.replace("_still", "");
          const texture = entry.getData().toString("base64");
          fluids.push({
            id: `${modId}:${fluidName}`,
            name: fluidName,
            texture,
          });
        }
      }

      // Tags
      else if (entryPath.includes("/tags/") && entryPath.endsWith(".json")) {
        try {
          const content = entry.getData().toString("utf8");
          const tagData = JSON.parse(content);
          const tagName = entryPath.split("/tags/")[1].replace(".json", "");
          tags.set(tagName, tagData);
        } catch (error) {
          // Skip invalid tags
        }
      }
    }

    return { modId, items, blocks, fluids, tags };
  }

  private async extractModId(entries: AdmZip.IZipEntry[], zip: AdmZip): Promise<string> {
    // Try mods.toml first
    const modsToml = entries.find((e) => e.entryName === "META-INF/mods.toml");
    if (modsToml) {
      try {
        const content = modsToml.getData().toString("utf8");
        const modIdMatch = content.match(/modId\s*=\s*["']([^"']+)["']/);
        if (modIdMatch) {
          return modIdMatch[1];
        }
      } catch (error) {
        // Continue to next method
      }
    }

    // Try mcmod.info
    const mcmodInfo = entries.find((e) => e.entryName === "mcmod.info");
    if (mcmodInfo) {
      try {
        const content = mcmodInfo.getData().toString("utf8");
        const info = JSON.parse(content);
        if (Array.isArray(info) && info[0]?.modid) {
          return info[0].modid;
        }
        if (info.modid) {
          return info.modid;
        }
      } catch (error) {
        // Continue to next method
      }
    }

    // Try fabric.mod.json
    const fabricMod = entries.find((e) => e.entryName === "fabric.mod.json");
    if (fabricMod) {
      try {
        const content = fabricMod.getData().toString("utf8");
        const info = JSON.parse(content);
        if (info.id) {
          return info.id;
        }
      } catch (error) {
        // Continue to next method
      }
    }

    // Fallback to first namespace found in assets
    for (const entry of entries) {
      if (entry.entryName.startsWith("assets/")) {
        const parts = entry.entryName.split("/");
        if (parts.length > 1) {
          return parts[1];
        }
      }
    }

    return "unknown";
  }

  async loadAllJars(modsFolder: string): Promise<JarData[]> {
    // If already loading from the same folder, return the same promise
    if (this.loadAllPromise && this.lastModsFolder === modsFolder) {
      console.log(`Returning cached loadAllJars promise for ${modsFolder}`);
      return this.loadAllPromise;
    }

    // If loading from a different folder, clear cache
    if (this.lastModsFolder && this.lastModsFolder !== modsFolder) {
      this.clearCache();
    }

    this.lastModsFolder = modsFolder;

    this.loadAllPromise = (async () => {
      const files = await fs.readdir(modsFolder);
      const jarFiles = files.filter((f) => f.endsWith(".jar"));

      console.log(`Loading ${jarFiles.length} JAR files with chunked concurrency...`);

      // Process JARs in chunks to prevent overwhelming the system
      const CHUNK_SIZE = 10;
      const results: JarData[] = [];

      for (let i = 0; i < jarFiles.length; i += CHUNK_SIZE) {
        const chunk = jarFiles.slice(i, i + CHUNK_SIZE);
        console.log(
          `Processing chunk ${Math.floor(i / CHUNK_SIZE) + 1}/${Math.ceil(jarFiles.length / CHUNK_SIZE)}`
        );

        const chunkResults = await Promise.all(
          chunk.map((jar) => this.loadJar(path.join(modsFolder, jar)))
        );

        results.push(...chunkResults);

        // Small delay between chunks to prevent overwhelming the system
        if (i + CHUNK_SIZE < jarFiles.length) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      console.log(`Successfully loaded ${results.length} JARs`);
      return results;
    })();

    return this.loadAllPromise;
  }

  async findAndLoadForgeJar(instancePath: string): Promise<JarData | null> {
    try {
      // Get instance config to determine Minecraft and loader versions
      const configPath = path.join(instancePath, "profile.json");
      if (!(await fs.stat(configPath).catch(() => null))) {
        console.log("Instance config not found");
        return null;
      }

      const config = JSON.parse(await fs.readFile(configPath, "utf-8"));
      const mcVersion = config.metadata?.game_version;
      const loaderVersion = config.metadata?.loader_version?.id;

      if (!mcVersion || !loaderVersion) {
        console.log("Could not determine Minecraft or loader version");
        return null;
      }

      console.log(`Looking for Forge JAR: MC ${mcVersion}, Loader ${loaderVersion}`);

      // Find Forge JAR in meta/versions directory
      const modrinthPath = path.dirname(path.dirname(instancePath));
      const metaVersionsPath = path.join(modrinthPath, "meta", "versions");
      const versionFolder = `${mcVersion}-${loaderVersion}`;
      const forgeJarPath = path.join(metaVersionsPath, versionFolder, `${versionFolder}.jar`);

      console.log("Looking for Forge JAR at:", forgeJarPath);

      if (!(await fs.stat(forgeJarPath).catch(() => null))) {
        console.log("Forge JAR not found at expected location");
        return null;
      }

      // Load the Forge JAR with 'minecraft' as the mod ID
      console.log("Loading vanilla Minecraft assets from Forge JAR...");
      return await this.loadJar(forgeJarPath, "minecraft");
    } catch (error) {
      console.error("Error loading Forge JAR:", error);
      return null;
    }
  }

  async findAndLoadMinecraftJar(instancePath: string): Promise<JarData | null> {
    try {
      let mcVersion = "1.20.1"; // Default fallback
      let loaderType = "forge";
      let loaderVersion = "";

      // Detect launcher type by checking which files exist
      const profileJsonPath = path.join(instancePath, "profile.json");
      const modrinthAppPath = path.dirname(path.dirname(instancePath));
      const modrinthDbPath = path.join(modrinthAppPath, "app.db");

      const hasProfileJson = await fs
        .stat(profileJsonPath)
        .then(() => true)
        .catch(() => false);
      const hasModrinthDb = await fs
        .stat(modrinthDbPath)
        .then(() => true)
        .catch(() => false);
      const isCurseForge = await CurseForgeProfileService.isCurseForgeInstance(instancePath);
      const isPackwiz = await PackwizProfileService.isPackwizModpack(instancePath);

      if (hasProfileJson) {
        // Standard launcher (ATLauncher, MultiMC, Prism, etc.)
        console.log("Detected launcher: Generic (profile.json)");
        try {
          const profileJson = await fs.readFile(profileJsonPath, "utf-8");
          const profile = JSON.parse(profileJson);
          mcVersion = profile.game_version;
          loaderType = profile.loader.toLowerCase();
          loaderVersion = profile.loader_version?.id || profile.loader_version || "";
          console.log(
            `Loaded profile from profile.json: MC ${mcVersion}, ${loaderType} ${loaderVersion}`
          );
        } catch (error) {
          console.error("Failed to parse profile.json:", error);
          return null;
        }
      } else if (hasModrinthDb && modrinthAppPath.includes("ModrinthApp")) {
        // Modrinth App launcher
        console.log("Detected launcher: Modrinth App (app.db)");
        const profileService = new ModrinthProfileService(modrinthAppPath);

        const profile = profileService.getProfileByPath(instancePath);
        profileService.closeDatabase();

        if (profile && profile.game_version) {
          mcVersion = profile.game_version;
          loaderType = profile.loader.toLowerCase();
          loaderVersion = profile.loader_version;
          console.log(
            `Loaded profile from Modrinth database: MC ${mcVersion}, ${loaderType} ${loaderVersion}`
          );
        } else {
          console.log("Could not find profile in Modrinth database");
          console.log("Attempting to detect version from folder structure...");

          // Try to extract version from folder name
          const folderName = path.basename(instancePath);
          const versionMatch = folderName.match(/(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            mcVersion = versionMatch[1];
            console.log(`Detected MC version from folder name: ${mcVersion}`);
          } else {
            console.log("Unable to determine Minecraft version, skipping vanilla asset loading");
            return null;
          }
        }
      } else if (isCurseForge) {
        // CurseForge launcher
        console.log("Detected launcher: CurseForge (.curseclient)");
        const profileService = new CurseForgeProfileService();
        const profile = await profileService.getProfile(instancePath);

        if (profile) {
          mcVersion = profile.gameVersion;
          loaderType = profile.loader.toLowerCase();
          loaderVersion = profile.loaderVersion;
          console.log(
            `Loaded profile from CurseForge: MC ${mcVersion}, ${loaderType} ${loaderVersion}`
          );
        } else {
          console.log("Failed to load CurseForge profile, attempting folder-based detection");
          const folderName = path.basename(instancePath);
          const versionMatch = folderName.match(/(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            mcVersion = versionMatch[1];
            console.log(`Detected MC version from folder name: ${mcVersion}`);
          } else {
            console.log("Unable to determine Minecraft version from CurseForge instance");
            return null;
          }
        }
      } else if (isPackwiz) {
        // Packwiz modpack
        console.log("Detected modpack format: Packwiz (pack.toml)");
        const profileService = new PackwizProfileService();
        const profile = await profileService.getProfile(instancePath);

        if (profile) {
          mcVersion = profile.gameVersion;
          loaderType = profile.loader.toLowerCase();
          loaderVersion = profile.loaderVersion;
          console.log(
            `Loaded profile from Packwiz: MC ${mcVersion}, ${loaderType} ${loaderVersion}`
          );
        } else {
          console.log("Failed to load Packwiz profile, attempting folder-based detection");
          const folderName = path.basename(instancePath);
          const versionMatch = folderName.match(/(\d+\.\d+\.\d+)/);
          if (versionMatch) {
            mcVersion = versionMatch[1];
            console.log(`Detected MC version from folder name: ${mcVersion}`);
          } else {
            console.log("Unable to determine Minecraft version from Packwiz modpack");
            return null;
          }
        }
      } else {
        // Unknown launcher
        console.log("Unknown launcher type, attempting folder-based detection");
        const folderName = path.basename(instancePath);
        const versionMatch = folderName.match(/(\d+\.\d+\.\d+)/);
        if (versionMatch) {
          mcVersion = versionMatch[1];
          console.log(`Detected MC version from folder name: ${mcVersion}`);
        } else {
          console.log("Unable to determine Minecraft version, skipping vanilla asset loading");
          return null;
        }
      }

      console.log(`Looking for Minecraft JAR: MC ${mcVersion}`);

      // Try Modrinth first
      const modrinthPath = path.dirname(path.dirname(instancePath));

      // For Forge/NeoForge, check in meta/versions for the modloader jar (contains vanilla assets)
      if (loaderType === "forge" || loaderType === "neoforge") {
        const metaVersionsPath = path.join(modrinthPath, "meta", "versions");
        const versionFolder = `${mcVersion}-${loaderVersion}`;
        const loaderJarPath = path.join(metaVersionsPath, versionFolder, `${versionFolder}.jar`);

        console.log("Looking for loader JAR at:", loaderJarPath);

        if (await fs.stat(loaderJarPath).catch(() => null)) {
          console.log("Loading vanilla Minecraft assets from loader JAR...");
          return await this.loadJar(loaderJarPath, "minecraft");
        }
      }

      // For Fabric/Quilt, look for vanilla Minecraft JAR
      const metaVersionsPath = path.join(modrinthPath, "meta", "versions");
      const vanillaJarPath = path.join(metaVersionsPath, mcVersion, `${mcVersion}.jar`);

      console.log("Looking for vanilla Minecraft JAR at:", vanillaJarPath);

      if (await fs.stat(vanillaJarPath).catch(() => null)) {
        console.log("Loading vanilla Minecraft assets from vanilla JAR...");
        return await this.loadJar(vanillaJarPath, "minecraft");
      }

      // Try CurseForge locations
      const curseForgeBaseMeta = path.join(
        path.dirname(path.dirname(instancePath)),
        "meta",
        "versions"
      );
      const curseForgeBaseInstall = "C:\\Users\\Luke\\curseforge\\minecraft\\Install\\versions";

      // Try loader-specific jar first (for Forge/NeoForge)
      if (loaderType === "forge" || loaderType === "neoforge") {
        // CurseForge uses format: forge-47.4.10 (not 1.20.1-forge-47.4.10)
        const loaderFolderName = `${loaderType}-${loaderVersion}`;
        const loaderJarName = `${loaderFolderName}.jar`;

        // Try Install/versions (CurseForge structure)
        const curseForgeInstallLoaderPath = path.join(
          curseForgeBaseInstall,
          loaderFolderName,
          loaderJarName
        );

        console.log("Looking for loader JAR at:", curseForgeInstallLoaderPath);

        if (await fs.stat(curseForgeInstallLoaderPath).catch(() => null)) {
          console.log("Loading vanilla Minecraft assets from CurseForge loader JAR...");
          return await this.loadJar(curseForgeInstallLoaderPath, "minecraft");
        }

        // Try meta/versions (alternative structure with MC version prefix)
        const loaderVersionStr = `${mcVersion}-${loaderVersion}`;
        const curseForgeMetaLoaderPath = path.join(
          curseForgeBaseMeta,
          loaderVersionStr,
          `${loaderVersionStr}.jar`
        );

        if (await fs.stat(curseForgeMetaLoaderPath).catch(() => null)) {
          console.log("Loading vanilla Minecraft assets from CurseForge meta loader JAR...");
          return await this.loadJar(curseForgeMetaLoaderPath, "minecraft");
        }
      }

      // Try vanilla jar in meta/versions
      const curseForgeMetaVanillaPath = path.join(
        curseForgeBaseMeta,
        mcVersion,
        `${mcVersion}.jar`
      );

      if (await fs.stat(curseForgeMetaVanillaPath).catch(() => null)) {
        console.log("Loading vanilla Minecraft assets from CurseForge vanilla JAR...");
        return await this.loadJar(curseForgeMetaVanillaPath, "minecraft");
      }

      // Try vanilla jar in Install/versions
      const curseForgeInstallVanillaPath = path.join(
        curseForgeBaseInstall,
        mcVersion,
        `${mcVersion}.jar`
      );

      if (await fs.stat(curseForgeInstallVanillaPath).catch(() => null)) {
        console.log("Loading vanilla Minecraft assets from CurseForge vanilla JAR...");
        return await this.loadJar(curseForgeInstallVanillaPath, "minecraft");
      }

      console.log("Minecraft JAR not found in any expected location");
      return null;
    } catch (error) {
      console.error("Error loading Minecraft JAR:", error);
      return null;
    }
  }

  clearCache(): void {
    this.jarCache.clear();
    this.loadAllPromise = null;
    this.lastModsFolder = null;
  }

  getCachedJarData(jarPath: string): JarData | undefined {
    return this.jarCache.get(jarPath);
  }

  getAllCachedData(): JarData[] {
    return Array.from(this.jarCache.values());
  }
}
