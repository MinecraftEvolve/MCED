import { app, BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { UpdateInfo } from '../shared/types/api.types';

class UpdateCheckerService {
  private mainWindow: BrowserWindow | null = null;
  private updateDownloaded = false;

  initialize(window: BrowserWindow) {
    this.mainWindow = window;

    // Configure auto-updater
    autoUpdater.autoDownload = false; // Don't auto-download, let user decide
    autoUpdater.autoInstallOnAppQuit = true;

    // Set up event handlers
    autoUpdater.on('checking-for-update', () => {
      console.log('[Auto Updater] Checking for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      console.log('[Auto Updater] Update available:', info.version);
      this.notifyRenderer({
        available: true,
        currentVersion: app.getVersion(),
        latestVersion: info.version,
        releaseNotes: info.releaseNotes as string,
        downloadUrl: `https://github.com/MinecraftEvolve/MCED/releases/tag/v${info.version}`,
        publishedAt: info.releaseDate,
      });
    });

    autoUpdater.on('update-not-available', () => {
      console.log('[Auto Updater] No updates available');
    });

    autoUpdater.on('error', (err) => {
      console.error('[Auto Updater] Error:', err);
    });

    autoUpdater.on('download-progress', (progress) => {
      console.log(`[Auto Updater] Download progress: ${progress.percent.toFixed(2)}%`);
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-download-progress', {
          percent: progress.percent,
          transferred: progress.transferred,
          total: progress.total,
        });
      }
    });

    autoUpdater.on('update-downloaded', () => {
      console.log('[Auto Updater] Update downloaded');
      this.updateDownloaded = true;
      if (this.mainWindow) {
        this.mainWindow.webContents.send('update-downloaded');
      }
    });
  }

  async checkForUpdates(): Promise<UpdateInfo> {
    try {
      const result = await autoUpdater.checkForUpdates();
      
      if (!result || !result.updateInfo) {
        return {
          available: false,
          currentVersion: app.getVersion(),
        };
      }

      const isNewer = this.compareVersions(result.updateInfo.version, app.getVersion()) > 0;

      return {
        available: isNewer,
        currentVersion: app.getVersion(),
        latestVersion: result.updateInfo.version,
        releaseNotes: result.updateInfo.releaseNotes as string,
        downloadUrl: `https://github.com/MinecraftEvolve/MCED/releases/tag/v${result.updateInfo.version}`,
        publishedAt: result.updateInfo.releaseDate,
      };
    } catch (error) {
      console.error('[Auto Updater] Failed to check for updates:', error);
      return {
        available: false,
        currentVersion: app.getVersion(),
      };
    }
  }

  async downloadUpdate(): Promise<void> {
    try {
      console.log('[Auto Updater] Starting download...');
      await autoUpdater.downloadUpdate();
    } catch (error) {
      console.error('[Auto Updater] Failed to download update:', error);
      throw error;
    }
  }

  quitAndInstall(): void {
    if (this.updateDownloaded) {
      autoUpdater.quitAndInstall(false, true);
    }
  }

  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const part1 = parts1[i] || 0;
      const part2 = parts2[i] || 0;

      if (part1 > part2) return 1;
      if (part1 < part2) return -1;
    }

    return 0;
  }

  private notifyRenderer(updateInfo: UpdateInfo) {
    if (this.mainWindow) {
      this.mainWindow.webContents.send('update-available', updateInfo);
    }
  }
}

export const updateChecker = new UpdateCheckerService();
