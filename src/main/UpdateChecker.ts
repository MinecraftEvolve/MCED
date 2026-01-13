import { app } from 'electron';
import axios from 'axios';
import { UpdateInfo } from '../shared/types/api.types';

const GITHUB_REPO = 'MinecraftEvolve/MCED';
const CHECK_INTERVAL = 1000 * 60 * 60; // Check every hour

interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  html_url: string;
  published_at: string;
  prerelease: boolean;
}

class UpdateCheckerService {
  private checkInterval: NodeJS.Timeout | null = null;
  private lastCheck: Date | null = null;
  private cachedUpdate: UpdateInfo | null = null;

  async checkForUpdates(): Promise<UpdateInfo> {
    const currentVersion = app.getVersion();
    
    // Return cached result if checked recently (within 10 minutes)
    if (this.cachedUpdate && this.lastCheck) {
      const timeSinceCheck = Date.now() - this.lastCheck.getTime();
      if (timeSinceCheck < 10 * 60 * 1000) {
        return this.cachedUpdate;
      }
    }

    try {
      const response = await axios.get<GitHubRelease>(
        `https://api.github.com/repos/${GITHUB_REPO}/releases/latest`,
        {
          headers: {
            'Accept': 'application/vnd.github.v3+json',
          },
          timeout: 10000,
        }
      );

      const latestRelease = response.data;
      const latestVersion = latestRelease.tag_name.replace(/^v/, '');
      const isNewer = this.compareVersions(latestVersion, currentVersion) > 0;

      const updateInfo: UpdateInfo = {
        available: isNewer && !latestRelease.prerelease,
        currentVersion,
        latestVersion,
        releaseNotes: latestRelease.body,
        downloadUrl: latestRelease.html_url,
        publishedAt: latestRelease.published_at,
      };

      this.cachedUpdate = updateInfo;
      this.lastCheck = new Date();

      return updateInfo;
    } catch (error) {
      console.error('[Update Checker] Failed to check for updates:', error);
      return {
        available: false,
        currentVersion,
      };
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

  startAutoCheck(callback: (update: UpdateInfo) => void) {
    // Check immediately on start
    this.checkForUpdates().then(callback);

    // Then check periodically
    this.checkInterval = setInterval(() => {
      this.checkForUpdates().then(callback);
    }, CHECK_INTERVAL);
  }

  stopAutoCheck() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }
}

export const updateChecker = new UpdateCheckerService();
