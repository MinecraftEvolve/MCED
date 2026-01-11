import { promises as fs } from 'fs';
import path from 'path';
import { MinecraftInstance, LoaderInfo, ModpackInfo } from '@shared/types/instance.types';

export class InstanceDetector {
  async detectInstance(instancePath: string): Promise<MinecraftInstance> {
    const name = path.basename(instancePath);
    
    // Detect folders
    const modsFolder = path.join(instancePath, '.minecraft', 'mods');
    const configFolder = path.join(instancePath, '.minecraft', 'config');
    
    // Try alternate paths if .minecraft doesn't exist
    const altModsFolder = path.join(instancePath, 'mods');
    const altConfigFolder = path.join(instancePath, 'config');
    
    const finalModsFolder = await this.folderExists(modsFolder) ? modsFolder : altModsFolder;
    const finalConfigFolder = await this.folderExists(configFolder) ? configFolder : altConfigFolder;

    // Detect Minecraft version and loader
    const minecraftVersion = await this.detectMinecraftVersion(instancePath);
    const loader = await this.detectLoader(instancePath);
    const modpack = await this.detectModpack(instancePath);

    // Count mods
    let totalMods = 0;
    try {
      if (await this.folderExists(finalModsFolder)) {
        const files = await fs.readdir(finalModsFolder);
        totalMods = files.filter(f => f.endsWith('.jar')).length;
      }
    } catch (error) {
      console.error('Failed to count mods:', error);
    }

    return {
      path: instancePath,
      name,
      minecraftVersion,
      loader,
      modpack,
      modsFolder: finalModsFolder,
      configFolder: finalConfigFolder,
      totalMods,
      lastAccessed: new Date(),
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
    const instanceCfg = path.join(instancePath, 'instance.cfg');
    if (await this.fileExists(instanceCfg)) {
      try {
        const content = await fs.readFile(instanceCfg, 'utf-8');
        const match = content.match(/IntendedVersion=([0-9.]+)/);
        if (match) return match[1];
      } catch (error) {
        console.error('Failed to read instance.cfg:', error);
      }
    }

    // Try mmc-pack.json (MultiMC/Prism)
    const mmcPack = path.join(instancePath, 'mmc-pack.json');
    if (await this.fileExists(mmcPack)) {
      try {
        const content = await fs.readFile(mmcPack, 'utf-8');
        const json = JSON.parse(content);
        if (json.components) {
          const mc = json.components.find((c: any) => c.uid === 'net.minecraft');
          if (mc && mc.version) return mc.version;
        }
      } catch (error) {
        console.error('Failed to read mmc-pack.json:', error);
      }
    }

    // Try minecraftinstance.json (CurseForge)
    const curseforgeInstance = path.join(instancePath, 'minecraftinstance.json');
    if (await this.fileExists(curseforgeInstance)) {
      try {
        const content = await fs.readFile(curseforgeInstance, 'utf-8');
        const json = JSON.parse(content);
        if (json.gameVersion) return json.gameVersion;
      } catch (error) {
        console.error('Failed to read minecraftinstance.json:', error);
      }
    }

    // Try manifest.json (CurseForge modpack)
    const manifest = path.join(instancePath, 'manifest.json');
    if (await this.fileExists(manifest)) {
      try {
        const content = await fs.readFile(manifest, 'utf-8');
        const json = JSON.parse(content);
        if (json.minecraft?.version) return json.minecraft.version;
      } catch (error) {
        console.error('Failed to read manifest.json:', error);
      }
    }

    // Fallback: Detect from mod filenames
    const modsFolder = path.join(instancePath, 'mods');
    const altModsFolder = path.join(instancePath, '.minecraft', 'mods');
    const finalModsFolder = await this.folderExists(modsFolder) ? modsFolder : altModsFolder;
    
    if (await this.folderExists(finalModsFolder)) {
      try {
        const files = await fs.readdir(finalModsFolder);
        const jarFiles = files.filter(f => f.endsWith('.jar'));
        
        // Try to extract version from filenames
        for (const jar of jarFiles) {
          const match = jar.match(/[-_](?:mc|minecraft)?[-_]?([0-9]+\.[0-9]+(?:\.[0-9]+)?)/i);
          if (match) {
            return match[1];
          }
        }
      } catch (error) {
        console.error('Failed to detect MC version from mods:', error);
      }
    }

    return 'Unknown';
  }

  private async detectLoader(instancePath: string): Promise<LoaderInfo> {
    // Try mmc-pack.json
    const mmcPack = path.join(instancePath, 'mmc-pack.json');
    if (await this.fileExists(mmcPack)) {
      try {
        const content = await fs.readFile(mmcPack, 'utf-8');
        const json = JSON.parse(content);
        if (json.components) {
          // Check for Forge
          const forge = json.components.find((c: any) => c.uid === 'net.minecraftforge');
          if (forge) return { type: 'forge', version: forge.version || 'Unknown' };

          // Check for Fabric
          const fabric = json.components.find((c: any) => c.uid === 'net.fabricmc.fabric-loader');
          if (fabric) return { type: 'fabric', version: fabric.version || 'Unknown' };

          // Check for NeoForge
          const neoforge = json.components.find((c: any) => c.uid === 'net.neoforged');
          if (neoforge) return { type: 'neoforge', version: neoforge.version || 'Unknown' };

          // Check for Quilt
          const quilt = json.components.find((c: any) => c.uid === 'org.quiltmc.quilt-loader');
          if (quilt) return { type: 'quilt', version: quilt.version || 'Unknown' };
        }
      } catch (error) {
        console.error('Failed to read mmc-pack.json:', error);
      }
    }

    // Try minecraftinstance.json (CurseForge)
    const curseforgeInstance = path.join(instancePath, 'minecraftinstance.json');
    if (await this.fileExists(curseforgeInstance)) {
      try {
        const content = await fs.readFile(curseforgeInstance, 'utf-8');
        const json = JSON.parse(content);
        if (json.baseModLoader) {
          const loaderName = json.baseModLoader.name.toLowerCase();
          if (loaderName.includes('forge')) {
            return { type: 'forge', version: json.baseModLoader.minecraftVersion || 'Unknown' };
          }
          if (loaderName.includes('fabric')) {
            return { type: 'fabric', version: json.baseModLoader.minecraftVersion || 'Unknown' };
          }
          if (loaderName.includes('neoforge')) {
            return { type: 'neoforge', version: json.baseModLoader.minecraftVersion || 'Unknown' };
          }
        }
      } catch (error) {
        console.error('Failed to read minecraftinstance.json:', error);
      }
    }

    // Try manifest.json
    const manifest = path.join(instancePath, 'manifest.json');
    if (await this.fileExists(manifest)) {
      try {
        const content = await fs.readFile(manifest, 'utf-8');
        const json = JSON.parse(content);
        if (json.minecraft?.modLoaders && json.minecraft.modLoaders.length > 0) {
          const loader = json.minecraft.modLoaders[0];
          const loaderId = loader.id.toLowerCase();
          if (loaderId.includes('forge')) {
            return { type: 'forge', version: loader.id.split('-')[1] || 'Unknown' };
          }
          if (loaderId.includes('fabric')) {
            return { type: 'fabric', version: loader.id.split('-')[1] || 'Unknown' };
          }
          if (loaderId.includes('neoforge')) {
            return { type: 'neoforge', version: loader.id.split('-')[1] || 'Unknown' };
          }
        }
      } catch (error) {
        console.error('Failed to read manifest.json:', error);
      }
    }

    // Fallback: Scan mods folder
    const modsFolder = path.join(instancePath, 'mods');
    const altModsFolder = path.join(instancePath, '.minecraft', 'mods');
    const finalModsFolder = await this.folderExists(modsFolder) ? modsFolder : altModsFolder;
    
    if (await this.folderExists(finalModsFolder)) {
      try {
        const files = await fs.readdir(finalModsFolder);
        const jarFiles = files.filter(f => f.endsWith('.jar'));
        
        if (jarFiles.length > 0) {
          // Check first mod file
          const loaderFromMod = await this.detectLoaderFromMod(path.join(finalModsFolder, jarFiles[0]));
          if (loaderFromMod) return loaderFromMod;
        }
      } catch (error) {
        console.error('Failed to detect loader from mods:', error);
      }
    }

    return { type: 'vanilla', version: 'Unknown' };
  }

  private async detectLoaderFromMod(jarPath: string): Promise<LoaderInfo | null> {
    try {
      const AdmZip = require('adm-zip');
      const zip = new AdmZip(jarPath);
      const entries = zip.getEntries();

      // Check for Fabric
      const fabricEntry = entries.find((e: any) => e.entryName === 'fabric.mod.json');
      if (fabricEntry) {
        return { type: 'fabric', version: 'Unknown' };
      }

      // Check for Forge
      const forgeEntry = entries.find((e: any) => e.entryName === 'META-INF/mods.toml');
      if (forgeEntry) {
        const content = forgeEntry.getData().toString('utf8');
        const match = content.match(/modLoader\s*=\s*"([^"]+)"/);
        if (match && match[1].includes('javafml')) {
          return { type: 'forge', version: 'Unknown' };
        }
      }

      // Check for NeoForge
      const neoforgeEntry = entries.find((e: any) => e.entryName === 'META-INF/neoforge.mods.toml');
      if (neoforgeEntry) {
        return { type: 'neoforge', version: 'Unknown' };
      }

      // Check for Quilt
      const quiltEntry = entries.find((e: any) => e.entryName === 'quilt.mod.json');
      if (quiltEntry) {
        return { type: 'quilt', version: 'Unknown' };
      }

      return null;
    } catch (error) {
      console.error('Failed to scan mod JAR:', error);
      return null;
    }
  }

  private async detectModpack(instancePath: string): Promise<ModpackInfo | undefined> {
    // Try manifest.json (CurseForge)
    const manifest = path.join(instancePath, 'manifest.json');
    if (await this.fileExists(manifest)) {
      try {
        const content = await fs.readFile(manifest, 'utf-8');
        const json = JSON.parse(content);
        return {
          source: 'curseforge',
          name: json.name || 'Unknown',
          version: json.version,
          author: json.author,
          projectId: json.projectID,
        };
      } catch (error) {
        console.error('Failed to read manifest.json:', error);
      }
    }

    // Try modrinth.index.json (Modrinth)
    const modrinthIndex = path.join(instancePath, 'modrinth.index.json');
    if (await this.fileExists(modrinthIndex)) {
      try {
        const content = await fs.readFile(modrinthIndex, 'utf-8');
        const json = JSON.parse(content);
        return {
          source: 'modrinth',
          name: json.name || 'Unknown',
          version: json.versionId,
        };
      } catch (error) {
        console.error('Failed to read modrinth.index.json:', error);
      }
    }

    // Check if it's MultiMC/Prism based on folder structure
    const mmcPack = path.join(instancePath, 'mmc-pack.json');
    if (await this.fileExists(mmcPack)) {
      const instanceName = path.basename(instancePath);
      return {
        source: instancePath.includes('PrismLauncher') ? 'prism' : 'multimc',
        name: instanceName,
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
