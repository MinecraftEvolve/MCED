import { promises as fs } from "fs";
import * as path from "path";

interface CurseForgeProfile {
  name: string;
  gameVersion: string;
  loader: string;
  loaderVersion: string;
}

export class CurseForgeProfileService {
  /**
   * Read CurseForge instance profile from minecraftinstance.json
   */
  async getProfile(instancePath: string): Promise<CurseForgeProfile | null> {
    try {
      const profilePath = path.join(instancePath, "minecraftinstance.json");
      const profileJson = await fs.readFile(profilePath, "utf-8");
      const profile = JSON.parse(profileJson);

      // Extract loader info from baseModLoader
      let loader = "forge"; // Default
      let loaderVersion = "";

      if (profile.baseModLoader) {
        // baseModLoader format: { "name": "forge-47.4.10", "forgeVersion": "47.4.10", ... }
        const loaderName = profile.baseModLoader.name || "";

        if (loaderName.includes("neoforge")) {
          loader = "neoforge";
          loaderVersion = profile.baseModLoader.neoForgeVersion || "";
        } else if (loaderName.includes("forge")) {
          loader = "forge";
          loaderVersion = profile.baseModLoader.forgeVersion || "";
        } else if (loaderName.includes("fabric")) {
          loader = "fabric";
          loaderVersion = profile.baseModLoader.fabricVersion || "";
        }
      }

      return {
        name: profile.name || "Unknown",
        gameVersion: profile.gameVersion || "1.20.1",
        loader,
        loaderVersion,
      };
    } catch (error) {
      console.error("Failed to read CurseForge profile:", error);
      return null;
    }
  }

  /**
   * Check if a directory is a CurseForge instance
   */
  static async isCurseForgeInstance(instancePath: string): Promise<boolean> {
    try {
      const curseclientPath = path.join(instancePath, ".curseclient");
      await fs.access(curseclientPath);
      return true;
    } catch {
      return false;
    }
  }
}
