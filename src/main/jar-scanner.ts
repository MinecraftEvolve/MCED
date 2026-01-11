import AdmZip from 'adm-zip';
import path from 'path';
import { promises as fs } from 'fs';
import { ModMetadata, ModInfo } from '@shared/types/mod.types';

export class JarScanner {
  async scanModsFolder(modsFolder: string): Promise<ModInfo[]> {
    const mods: ModInfo[] = [];

    try {
      const files = await fs.readdir(modsFolder);
      const jarFiles = files.filter(f => f.endsWith('.jar'));

      for (const jarFile of jarFiles) {
        const jarPath = path.join(modsFolder, jarFile);
        try {
          const modInfo = await this.extractModMetadata(jarPath);
          if (modInfo) {
            mods.push(modInfo);
          }
        } catch (error) {
          console.error(`Failed to parse ${jarFile}:`, error);
        }
      }
    } catch (error) {
      console.error('Failed to scan mods folder:', error);
    }

    return mods;
  }

  async extractModMetadata(jarPath: string): Promise<ModInfo | null> {
    try {
      const zip = new AdmZip(jarPath);
      const zipEntries = zip.getEntries();

      // Try Forge/NeoForge first
      let metadata = await this.tryForgeMetadata(zip, zipEntries);
      
      // Try Fabric
      if (!metadata) {
        metadata = await this.tryFabricMetadata(zip, zipEntries);
      }

      // Try NeoForge
      if (!metadata) {
        metadata = await this.tryNeoForgeMetadata(zip, zipEntries);
      }

      if (!metadata) {
        return null;
      }

      // Extract icon if available
      if (metadata.logoFile) {
        const iconData = await this.extractIconFromZip(zip, metadata.logoFile);
        if (iconData) {
          metadata.icon = iconData;
        }
      }

      return {
        ...metadata,
        jarPath,
        configFiles: [],
        loader: this.detectLoader(zipEntries),
      };
    } catch (error) {
      console.error(`Failed to extract metadata from ${jarPath}:`, error);
      return null;
    }
  }

  private async tryForgeMetadata(zip: AdmZip, entries: AdmZip.IZipEntry[]): Promise<ModMetadata | null> {
    // Try mods.toml (modern Forge)
    const modsTomlEntry = entries.find(e => e.entryName === 'META-INF/mods.toml');
    if (modsTomlEntry) {
      try {
        const toml = require('@iarna/toml');
        const content = modsTomlEntry.getData().toString('utf-8');
        const parsed = toml.parse(content);
        
        if (parsed.mods && Array.isArray(parsed.mods) && parsed.mods.length > 0) {
          const mod = parsed.mods[0];
          return {
            modId: mod.modId || 'unknown',
            name: mod.displayName || mod.modId || 'Unknown Mod',
            version: mod.version || '0.0.0',
            description: mod.description,
            authors: mod.authors ? (typeof mod.authors === 'string' ? [mod.authors] : mod.authors) : undefined,
            homepage: mod.displayURL,
            logoFile: mod.logoFile || 'logo.png',
            credits: mod.credits,
            license: parsed.license,
          };
        }
      } catch (error) {
        console.error('Failed to parse mods.toml:', error);
      }
    }

    // Try mcmod.info (legacy Forge)
    const mcmodInfoEntry = entries.find(e => e.entryName === 'mcmod.info');
    if (mcmodInfoEntry) {
      try {
        const content = mcmodInfoEntry.getData().toString('utf-8');
        const parsed = JSON.parse(content);
        const modList = Array.isArray(parsed) ? parsed : (parsed.modList || []);
        
        if (modList.length > 0) {
          const mod = modList[0];
          return {
            modId: mod.modid || 'unknown',
            name: mod.name || mod.modid || 'Unknown Mod',
            version: mod.version || '0.0.0',
            description: mod.description,
            authors: mod.authorList || (mod.authors ? [mod.authors] : undefined),
            homepage: mod.url,
            logoFile: mod.logoFile,
            credits: mod.credits,
          };
        }
      } catch (error) {
        console.error('Failed to parse mcmod.info:', error);
      }
    }

    return null;
  }

  private async tryFabricMetadata(zip: AdmZip, entries: AdmZip.IZipEntry[]): Promise<ModMetadata | null> {
    const fabricModJsonEntry = entries.find(e => e.entryName === 'fabric.mod.json');
    if (!fabricModJsonEntry) return null;

    try {
      const content = fabricModJsonEntry.getData().toString('utf-8');
      const mod = JSON.parse(content);

      return {
        modId: mod.id || 'unknown',
        name: mod.name || mod.id || 'Unknown Mod',
        version: mod.version || '0.0.0',
        description: mod.description,
        authors: Array.isArray(mod.authors) 
          ? mod.authors.map((a: any) => typeof a === 'string' ? a : a.name)
          : mod.authors ? [mod.authors] : undefined,
        homepage: mod.contact?.homepage,
        sources: mod.contact?.sources,
        issueTracker: mod.contact?.issues,
        license: mod.license,
        logoFile: mod.icon,
      };
    } catch (error) {
      console.error('Failed to parse fabric.mod.json:', error);
      return null;
    }
  }

  private async tryNeoForgeMetadata(zip: AdmZip, entries: AdmZip.IZipEntry[]): Promise<ModMetadata | null> {
    const neoforgeModsTomlEntry = entries.find(e => e.entryName === 'META-INF/neoforge.mods.toml');
    if (!neoforgeModsTomlEntry) return null;

    try {
      const toml = require('@iarna/toml');
      const content = neoforgeModsTomlEntry.getData().toString('utf-8');
      const parsed = toml.parse(content);

      if (parsed.mods && Array.isArray(parsed.mods) && parsed.mods.length > 0) {
        const mod = parsed.mods[0];
        return {
          modId: mod.modId || 'unknown',
          name: mod.displayName || mod.modId || 'Unknown Mod',
          version: mod.version || '0.0.0',
          description: mod.description,
          authors: mod.authors ? (typeof mod.authors === 'string' ? [mod.authors] : mod.authors) : undefined,
          homepage: mod.displayURL,
          logoFile: mod.logoFile,
          credits: mod.credits,
          license: parsed.license,
        };
      }
    } catch (error) {
      console.error('Failed to parse neoforge.mods.toml:', error);
    }

    return null;
  }

  private detectLoader(entries: AdmZip.IZipEntry[]): 'forge' | 'fabric' | 'neoforge' | 'quilt' {
    if (entries.some(e => e.entryName === 'META-INF/neoforge.mods.toml')) {
      return 'neoforge';
    }
    if (entries.some(e => e.entryName === 'fabric.mod.json')) {
      return 'fabric';
    }
    if (entries.some(e => e.entryName === 'quilt.mod.json')) {
      return 'quilt';
    }
    return 'forge';
  }

  private async extractIconFromZip(zip: AdmZip, iconPath: string): Promise<string | null> {
    try {
      const entry = zip.getEntry(iconPath);
      if (!entry) return null;

      const data = entry.getData();
      const base64 = data.toString('base64');
      const ext = path.extname(iconPath).toLowerCase();
      const mimeType = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : 'image/png';
      
      return `data:${mimeType};base64,${base64}`;
    } catch (error) {
      console.error('Failed to extract icon:', error);
      return null;
    }
  }

  async extractIcon(jarPath: string, iconPath: string): Promise<string | null> {
    try {
      const zip = new AdmZip(jarPath);
      return await this.extractIconFromZip(zip, iconPath);
    } catch (error) {
      console.error('Failed to extract icon:', error);
      return null;
    }
  }
}
