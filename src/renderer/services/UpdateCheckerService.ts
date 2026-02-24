import modrinthAPI from "./api/ModrinthAPI";
import { ModInfo } from "../../shared/types/mod.types";
import { ModUpdateInfo, useUpdateStore } from "../store/updateStore";

class UpdateCheckerService {
  private checkPromise: Promise<void> | null = null;

  async checkUpdates(mods: ModInfo[], mcVersion?: string): Promise<void> {
    // Prevent concurrent checks
    if (this.checkPromise) return this.checkPromise;

    const store = useUpdateStore.getState();
    if (store.isChecking) return;

    store.setIsChecking(true);
    this.checkPromise = this._doCheck(mods, mcVersion)
      .finally(() => {
        store.setIsChecking(false);
        store.setLastChecked(new Date());
        this.checkPromise = null;
      });
    return this.checkPromise;
  }

  private async _doCheck(mods: ModInfo[], mcVersion?: string): Promise<void> {
    const store = useUpdateStore.getState();
    const updates = new Map<string, ModUpdateInfo>();

    // Check in batches to avoid rate limiting
    const batchSize = 5;
    for (let i = 0; i < mods.length; i += batchSize) {
      const batch = mods.slice(i, i + batchSize);
      await Promise.all(
        batch.map(async (mod) => {
          if (!mod.version) return;
          try {
            const latest = await modrinthAPI.getLatestVersion(mod.modId, mcVersion);
            if (!latest) return;
            // Compare versions - simple string comparison
            if (latest.version !== mod.version && latest.version > mod.version) {
              updates.set(mod.modId, {
                modId: mod.modId,
                currentVersion: mod.version,
                latestVersion: latest.version,
                latestVersionId: latest.versionId,
                changelog: latest.changelog,
                source: "modrinth",
              });
            }
          } catch {
            // Silently fail for individual mods
          }
        })
      );
      // Small delay between batches to respect rate limits
      if (i + batchSize < mods.length) {
        await new Promise(r => setTimeout(r, 200));
      }
    }

    store.setUpdates(updates);
  }
}

export const updateCheckerService = new UpdateCheckerService();
