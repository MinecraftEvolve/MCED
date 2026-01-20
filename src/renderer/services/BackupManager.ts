import { promises as fs } from "fs";
import path from "path";

interface Backup {
  id: string;
  timestamp: Date;
  configPath: string;
  backupPath: string;
  modName: string;
}

class BackupManager {
  private backups: Map<string, Backup[]> = new Map();
  private backupDir: string = "";

  async initialize(instancePath: string): Promise<void> {
    this.backupDir = path.join(instancePath, ".mced-backups");

    try {
      await fs.mkdir(this.backupDir, { recursive: true });
    } catch (error) {}
  }

  async createBackup(configPath: string, modName: string): Promise<string> {
    try {
      const timestamp = new Date();
      const backupId = `${modName}_${timestamp.getTime()}`;
      const fileName = path.basename(configPath);
      const backupPath = path.join(this.backupDir, `${backupId}_${fileName}`);

      // Read original file
      const content = await fs.readFile(configPath, "utf-8");

      // Write backup
      await fs.writeFile(backupPath, content, "utf-8");

      // Store backup metadata
      const backup: Backup = {
        id: backupId,
        timestamp,
        configPath,
        backupPath,
        modName,
      };

      const existing = this.backups.get(configPath) || [];
      existing.push(backup);
      this.backups.set(configPath, existing);

      // Keep only last 5 backups per file
      await this.cleanupOldBackups(configPath);

      return backupId;
    } catch (error) {
      throw error;
    }
  }

  async restoreBackup(backupId: string): Promise<void> {
    try {
      // Find backup
      let targetBackup: Backup | null = null;
      for (const backups of this.backups.values()) {
        const found = backups.find((b) => b.id === backupId);
        if (found) {
          targetBackup = found;
          break;
        }
      }

      if (!targetBackup) {
        throw new Error(`Backup ${backupId} not found`);
      }

      // Read backup content
      const content = await fs.readFile(targetBackup.backupPath, "utf-8");

      // Restore to original location
      await fs.writeFile(targetBackup.configPath, content, "utf-8");
    } catch (error) {
      throw error;
    }
  }

  async listBackups(configPath?: string): Promise<Backup[]> {
    if (configPath) {
      return this.backups.get(configPath) || [];
    }

    // Return all backups
    const allBackups: Backup[] = [];
    for (const backups of this.backups.values()) {
      allBackups.push(...backups);
    }
    return allBackups.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  private async cleanupOldBackups(configPath: string): Promise<void> {
    const backups = this.backups.get(configPath) || [];

    // Keep only last 5 backups
    if (backups.length > 5) {
      const toDelete = backups.slice(5);

      for (const backup of toDelete) {
        try {
          await fs.unlink(backup.backupPath);
        } catch (error) {}
      }

      this.backups.set(configPath, backups.slice(0, 5));
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      for (const [configPath, backups] of this.backups.entries()) {
        const index = backups.findIndex((b) => b.id === backupId);
        if (index !== -1) {
          const backup = backups[index];
          await fs.unlink(backup.backupPath);
          backups.splice(index, 1);
          this.backups.set(configPath, backups);
          return;
        }
      }
      throw new Error(`Backup ${backupId} not found`);
    } catch (error) {
      throw error;
    }
  }

  async cleanupAllBackups(): Promise<void> {
    try {
      await fs.rm(this.backupDir, { recursive: true, force: true });
      this.backups.clear();
    } catch (error) {}
  }
}

export const backupManager = new BackupManager();
