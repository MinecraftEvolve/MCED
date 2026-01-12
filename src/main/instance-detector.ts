import { promises as fs } from "fs";
import path from "path";
import {
  MinecraftInstance,
  LoaderInfo,
  ModpackInfo,
} from "../shared/types/instance.types";

export class InstanceDetector {
  async detectInstance(instancePath: string): Promise<MinecraftInstance> {
    const name = path.basename(instancePath);

    // Detect folders
    const modsFolder = path.join(instancePath, ".minecraft", "mods");
    const configFolder = path.join(instancePath, ".minecraft", "config");

    // Try alternate paths if .minecraft doesn't exist
    const altModsFolder = path.join(instancePath, "mods");
    const altConfigFolder = path.join(instancePath, "config");

    const finalModsFolder = (await this.folderExists(modsFolder))
      ? modsFolder
      : altModsFolder;
    const finalConfigFolder = (await this.folderExists(configFolder))
      ? configFolder
      : altConfigFolder;

    // Detect Minecraft version and loader
    const minecraftVersion = await this.detectMinecraftVersion(instancePath);
    const loader = await this.detectLoader(instancePath);
    const modpack = await this.detectModpack(instancePath);

    // Count mods
    let totalMods = 0;
    try {
      if (await this.folderExists(finalModsFolder)) {
        const files = await fs.readdir(finalModsFolder);
        totalMods = files.filter((f) => f.endsWith(".jar")).length;
      }
    } catch (error) {}

    return {
      path: instancePath,
      name,
      minecraftVersion,
      loader,
      modpack,
      modsFolder: finalModsFolder,
      configFolder: finalConfigFolder,
      totalMods,
      lastAccessed: Date.now(),
    };
  }

  private async folderExists(folderPath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(folderPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  private async detectMinecraftVersion(instancePath: string): Promise<string> {
    // Try instance.cfg (MultiMC/Prism)
    const instanceCfg = path.join(instancePath, "instance.cfg");
    if (await this.fileExists(instanceCfg)) {
      try {
        const content = await fs.readFile(instanceCfg, "utf-8");
        const match = content.match(/IntendedVersion=([0-9.]+)/);
        if (match) return match[1];
      } catch (error) {}
    }

    // Try mmc-pack.json (MultiMC/Prism)
    const mmcPack = path.join(instancePath, "mmc-pack.json");
    if (await this.fileExists(mmcPack)) {
      try {
        const content = await fs.readFile(mmcPack, "utf-8");
        const json = JSON.parse(content);
        if (json.components) {
          const mc = json.components.find(
            (c: any) => c.uid === "net.minecraft",
          );
          if (mc && mc.version) return mc.version;
        }
      } catch (error) {}
    }

    // Try minecraftinstance.json (CurseForge)
    const curseforgeInstance = path.join(
      instancePath,
      "minecraftinstance.json",
    );
    if (await this.fileExists(curseforgeInstance)) {
      try {
        const content = await fs.readFile(curseforgeInstance, "utf-8");
        const json = JSON.parse(content);
        if (json.gameVersion) return json.gameVersion;
      } catch (error) {}
    }

    // Try manifest.json (CurseForge modpack)
    const manifest = path.join(instancePath, "manifest.json");
    if (await this.fileExists(manifest)) {
      try {
        const content = await fs.readFile(manifest, "utf-8");
        const json = JSON.parse(content);
        if (json.minecraft?.version) return json.minecraft.version;
      } catch (error) {}
    }

    // Fallback: Detect from mod filenames
    const modsFolder = path.join(instancePath, "mods");
    const altModsFolder = path.join(instancePath, ".minecraft", "mods");
    const finalModsFolder = (await this.folderExists(modsFolder))
      ? modsFolder
      : altModsFolder;

    if (await this.folderExists(finalModsFolder)) {
      try {
        const files = await fs.readdir(finalModsFolder);
        const jarFiles = files.filter((f) => f.endsWith(".jar"));

        // Try to extract version from filenames
        for (const jar of jarFiles) {
          const match = jar.match(
            /[-_](?:mc|minecraft)?[-_]?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i,
          );
          if (match) {
            return match[1];
          }
        }
      } catch (error) {}
    }

    return "Unknown";
  }

  private async detectLoader(instancePath: string): Promise<LoaderInfo> {
    // Try mmc-pack.json
    const mmcPack = path.join(instancePath, "mmc-pack.json");
    if (await this.fileExists(mmcPack)) {
      try {
        const content = await fs.readFile(mmcPack, "utf-8");
        const json = JSON.parse(content);
        if (json.components) {
          // Check for Forge
          const forge = json.components.find(
            (c: any) => c.uid === "net.minecraftforge",
          );
          if (forge)
            return { type: "forge", version: forge.version || "Unknown" };

          // Check for Fabric
          const fabric = json.components.find(
            (c: any) => c.uid === "net.fabricmc.fabric-loader",
          );
          if (fabric)
            return { type: "fabric", version: fabric.version || "Unknown" };

          // Check for NeoForge
          const neoforge = json.components.find(
            (c: any) => c.uid === "net.neoforged",
          );
          if (neoforge)
            return { type: "neoforge", version: neoforge.version || "Unknown" };

          // Check for Quilt
          const quilt = json.components.find(
            (c: any) => c.uid === "org.quiltmc.quilt-loader",
          );
          if (quilt)
            return { type: "quilt", version: quilt.version || "Unknown" };
        }
      } catch (error) {}
    }

    // Try Modrinth meta/versions folder (more reliable)
    try {
      const minecraftVersion = await this.detectMinecraftVersion(instancePath);
      const parentPath = path.dirname(instancePath);
      const metaPath = path.join(path.dirname(parentPath), "meta", "versions");

      if (await this.folderExists(metaPath)) {
        const versionDirs = await fs.readdir(metaPath);
        for (const versionDir of versionDirs) {
          if (versionDir.startsWith(minecraftVersion)) {
            const versionFile = path.join(
              metaPath,
              versionDir,
              `${versionDir}.json`,
            );
            if (await this.fileExists(versionFile)) {
              const content = await fs.readFile(versionFile, "utf-8");
              const data = JSON.parse(content);
              if (data.arguments?.game) {
                // Extract forge version from game arguments
                const forgeVersionIndex =
                  data.arguments.game.indexOf("--fml.forgeVersion");
                if (
                  forgeVersionIndex !== -1 &&
                  forgeVersionIndex + 1 < data.arguments.game.length
                ) {
                  return {
                    type: "forge",
                    version: data.arguments.game[forgeVersionIndex + 1],
                  };
                }
                // Check for Fabric
                const fabricVersionIndex =
                  data.arguments.game.indexOf("--fabric");
                if (fabricVersionIndex !== -1) {
                  // Try to extract version from id
                  const versionMatch = versionDir.match(/\d+\.\d+\.\d+-(.+)/);
                  if (versionMatch) {
                    return { type: "fabric", version: versionMatch[1] };
                  }
                }
              }
            }
          }
        }
      }
    } catch (error) {}

    // Try modrinth.index.json (Modrinth launcher)
    const modrinthIndex = path.join(
      instancePath,
      "..",
      path.basename(instancePath).replace(/\s+\d+\.\d+\.\d+$/, ""),
      "profile.json",
    );
    if (await this.fileExists(modrinthIndex)) {
      try {
        const content = await fs.readFile(modrinthIndex, "utf-8");
        const json = JSON.parse(content);
        if (json.loader) {
          const loader = json.loader.toLowerCase();
          // Get the actual loader version, not the Minecraft version
          const loaderVersion = json.loader_version || "Unknown";
          if (loader.includes("forge")) {
            return { type: "forge", version: loaderVersion };
          }
          if (loader.includes("fabric")) {
            return { type: "fabric", version: loaderVersion };
          }
          if (loader.includes("neoforge")) {
            return { type: "neoforge", version: loaderVersion };
          }
          if (loader.includes("quilt")) {
            return { type: "quilt", version: loaderVersion };
          }
        }
      } catch (error) {}
    }

    // Try minecraftinstance.json (CurseForge)
    const curseforgeInstance = path.join(
      instancePath,
      "minecraftinstance.json",
    );
    if (await this.fileExists(curseforgeInstance)) {
      try {
        const content = await fs.readFile(curseforgeInstance, "utf-8");
        const json = JSON.parse(content);
        if (json.baseModLoader) {
          const loaderName = json.baseModLoader.name.toLowerCase();
          if (loaderName.includes("forge")) {
            return {
              type: "forge",
              version: json.baseModLoader.minecraftVersion || "Unknown",
            };
          }
          if (loaderName.includes("fabric")) {
            return {
              type: "fabric",
              version: json.baseModLoader.minecraftVersion || "Unknown",
            };
          }
          if (loaderName.includes("neoforge")) {
            return {
              type: "neoforge",
              version: json.baseModLoader.minecraftVersion || "Unknown",
            };
          }
        }
      } catch (error) {}
    }

    // Try manifest.json
    const manifest = path.join(instancePath, "manifest.json");
    if (await this.fileExists(manifest)) {
      try {
        const content = await fs.readFile(manifest, "utf-8");
        const json = JSON.parse(content);
        if (
          json.minecraft?.modLoaders &&
          json.minecraft.modLoaders.length > 0
        ) {
          const loader = json.minecraft.modLoaders[0];
          const loaderId = loader.id.toLowerCase();
          if (loaderId.includes("forge")) {
            return {
              type: "forge",
              version: loader.id.split("-")[1] || "Unknown",
            };
          }
          if (loaderId.includes("fabric")) {
            return {
              type: "fabric",
              version: loader.id.split("-")[1] || "Unknown",
            };
          }
          if (loaderId.includes("neoforge")) {
            return {
              type: "neoforge",
              version: loader.id.split("-")[1] || "Unknown",
            };
          }
        }
      } catch (error) {}
    }

    // Fallback: Scan mods folder and extract version from JAR files
    const modsFolder = path.join(instancePath, "mods");
    const altModsFolder = path.join(instancePath, ".minecraft", "mods");
    const finalModsFolder = (await this.folderExists(modsFolder))
      ? modsFolder
      : altModsFolder;

    if (await this.folderExists(finalModsFolder)) {
      try {
        const files = await fs.readdir(finalModsFolder);
        const jarFiles = files.filter((f) => f.endsWith(".jar"));

        if (jarFiles.length > 0) {
          // Check first few mod files
          for (const jarFile of jarFiles.slice(0, 5)) {
            const loaderFromMod = await this.detectLoaderFromMod(
              path.join(finalModsFolder, jarFile),
            );
            if (loaderFromMod && loaderFromMod.version !== "Unknown")
              return loaderFromMod;
          }

          // If we still don't have version, try to extract from filename
          const loaderType = await this.detectLoaderFromMod(
            path.join(finalModsFolder, jarFiles[0]),
          );
          if (loaderType) {
            // Try to extract forge version from mod filename
            for (const jar of jarFiles) {
              const forgeMatch = jar.match(/forge[-_]?(\d+\.\d+\.\d+)/i);
              if (forgeMatch) {
                return { type: loaderType.type, version: forgeMatch[1] };
              }
              const mcMatch = jar.match(/mc[-_]?(\d+\.\d+\.\d+)/i);
              if (mcMatch) {
                return { type: loaderType.type, version: mcMatch[1] };
              }
            }
            return loaderType;
          }
        }
      } catch (error) {}
    }

    return { type: "vanilla", version: "Unknown" };
  }

  private async detectLoaderFromMod(
    jarPath: string,
  ): Promise<LoaderInfo | null> {
    try {
      const AdmZip = require("adm-zip");
      const zip = new AdmZip(jarPath);
      const entries = zip.getEntries();

      // Check for Fabric
      const fabricEntry = entries.find(
        (e: any) => e.entryName === "fabric.mod.json",
      );
      if (fabricEntry) {
        return { type: "fabric", version: "Unknown" };
      }

      // Check for Forge and extract version
      const forgeEntry = entries.find(
        (e: any) => e.entryName === "META-INF/mods.toml",
      );
      if (forgeEntry) {
        const content = forgeEntry.getData().toString("utf8");
        // Try to extract loaderVersion
        const loaderVersionMatch = content.match(
          /loaderVersion\s*=\s*"\[([0-9,.\s]+)\]"/,
        );
        if (loaderVersionMatch) {
          const versionRange = loaderVersionMatch[1].trim();
          const versionParts = versionRange.split(",")[0].trim(); // Get first version in range
          return { type: "forge", version: versionParts };
        }

        // Check for modLoader field
        const match = content.match(/modLoader\s*=\s*"([^"]+)"/);
        if (match && match[1].includes("javafml")) {
          return { type: "forge", version: "Unknown" };
        }
      }

      // Check for NeoForge
      const neoforgeEntry = entries.find(
        (e: any) => e.entryName === "META-INF/neoforge.mods.toml",
      );
      if (neoforgeEntry) {
        return { type: "neoforge", version: "Unknown" };
      }

      // Check for Quilt
      const quiltEntry = entries.find(
        (e: any) => e.entryName === "quilt.mod.json",
      );
      if (quiltEntry) {
        return { type: "quilt", version: "Unknown" };
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  private async detectModpack(
    instancePath: string,
  ): Promise<ModpackInfo | undefined> {
    // Try Modrinth profile.json (Modrinth Launcher)
    const instanceBaseName = path
      .basename(instancePath)
      .replace(/\s+\d+\.\d+\.\d+$/, "");
    const modrinthProfile = path.join(
      instancePath,
      "..",
      instanceBaseName,
      "profile.json",
    );
    if (await this.fileExists(modrinthProfile)) {
      try {
        const content = await fs.readFile(modrinthProfile, "utf-8");
        const json = JSON.parse(content);
        return {
          source: "modrinth",
          name: json.name || instanceBaseName,
          version:
            json.linked_data?.version_id || json.game_version || "Unknown",
        };
      } catch (error) {}
    }

    // Try manifest.json (CurseForge)
    const manifest = path.join(instancePath, "manifest.json");
    if (await this.fileExists(manifest)) {
      try {
        const content = await fs.readFile(manifest, "utf-8");
        const json = JSON.parse(content);
        return {
          source: "curseforge",
          name: json.name || "Unknown",
          version: json.version,
          author: json.author,
          projectId: json.projectID,
        };
      } catch (error) {}
    }

    // Try modrinth.index.json (Modrinth modpack format)
    const modrinthIndex = path.join(instancePath, "modrinth.index.json");
    if (await this.fileExists(modrinthIndex)) {
      try {
        const content = await fs.readFile(modrinthIndex, "utf-8");
        const json = JSON.parse(content);
        return {
          source: "modrinth",
          name: json.name || "Unknown",
          version: json.versionId,
        };
      } catch (error) {}
    }

    // Check if it's MultiMC/Prism based on folder structure
    const mmcPack = path.join(instancePath, "mmc-pack.json");
    if (await this.fileExists(mmcPack)) {
      const instanceName = path.basename(instancePath);
      return {
        source: instancePath.includes("PrismLauncher") ? "prism" : "multimc",
        name: instanceName,
      };
    }

    // Check if it's in Modrinth launcher directory
    if (instancePath.includes("ModrinthApp")) {
      const instanceName = path.basename(instancePath);
      return {
        source: "modrinth",
        name: instanceName.replace(/\s+\d+\.\d+\.\d+$/, ""),
        version: instanceName.match(/(\d+\.\d+\.\d+)$/)?.[1],
      };
    }

    return undefined;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(filePath);
      return stats.isFile();
    } catch {
      return false;
    }
  }
}
