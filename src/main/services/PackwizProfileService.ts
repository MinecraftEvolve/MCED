import { promises as fs } from 'fs';
import * as path from 'path';
import * as toml from '@iarna/toml';

interface PackwizProfile {
  name: string;
  gameVersion: string;
  loader: string;
  loaderVersion: string;
}

export class PackwizProfileService {
  /**
   * Read Packwiz modpack profile from pack.toml
   */
  async getProfile(instancePath: string): Promise<PackwizProfile | null> {
    try {
      const packTomlPath = path.join(instancePath, 'pack.toml');
      const packTomlContent = await fs.readFile(packTomlPath, 'utf-8');
      const packData = toml.parse(packTomlContent) as any;

      // Packwiz format:
      // name = "Example Modpack"
      // version = "1.0.0"
      // [versions]
      // minecraft = "1.20.1"
      // fabric = "0.14.8"  (or forge, neoforge, quilt)

      let gameVersion = '1.20.1'; // Default
      let loader = 'forge'; // Default
      let loaderVersion = '';

      // Extract Minecraft version
      if (packData.versions?.minecraft) {
        gameVersion = packData.versions.minecraft as string;
      }

      // Detect loader type and version
      if (packData.versions?.fabric) {
        loader = 'fabric';
        loaderVersion = packData.versions.fabric as string;
      } else if (packData.versions?.forge) {
        loader = 'forge';
        loaderVersion = packData.versions.forge as string;
      } else if (packData.versions?.neoforge) {
        loader = 'neoforge';
        loaderVersion = packData.versions.neoforge as string;
      } else if (packData.versions?.quilt) {
        loader = 'quilt';
        loaderVersion = packData.versions.quilt as string;
      }

      return {
        name: packData.name || 'Unknown',
        gameVersion,
        loader,
        loaderVersion
      };
    } catch (error) {
      console.error('Failed to read Packwiz profile:', error);
      return null;
    }
  }

  /**
   * Check if a directory is a Packwiz modpack
   */
  static async isPackwizModpack(instancePath: string): Promise<boolean> {
    try {
      const packTomlPath = path.join(instancePath, 'pack.toml');
      const indexTomlPath = path.join(instancePath, 'index.toml');
      
      // Must have both pack.toml and index.toml
      await fs.access(packTomlPath);
      await fs.access(indexTomlPath);
      return true;
    } catch {
      return false;
    }
  }
}
