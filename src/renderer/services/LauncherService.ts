export class LauncherService {
  /**
   * Detect launcher from instance path
   */
  async detectLauncher(instancePath: string): Promise<{
    type: string;
    executable: string;
  } | null> {
    const path = instancePath.toLowerCase();

    if (path.includes('modrinthapp')) {
      return { type: 'modrinth', executable: 'modrinth-app' };
    }

    if (path.includes('multimc') || path.includes('prism')) {
      return this.detectMultiMCPrism(instancePath);
    }

    if (path.includes('curseforge')) {
      return { type: 'curseforge', executable: '' };
    }

    if (path.includes('atlauncher')) {
      return { type: 'atlauncher', executable: '' };
    }

    return null;
  }

  private detectMultiMCPrism(instancePath: string): { type: string; executable: string } {
    if (instancePath.toLowerCase().includes('prism')) {
      return { type: 'prism', executable: 'prismlauncher' };
    }
    return { type: 'multimc', executable: 'MultiMC' };
  }

  /**
   * Launch Minecraft
   */
  async launch(instancePath: string, launcherType: string): Promise<boolean> {
    try {
      const result = await window.electronAPI.launchMinecraft(instancePath, launcherType);
      return result.success;
    } catch (error) {
      console.error('Launch error:', error);
      return false;
    }
  }

  private extractInstanceName(path: string): string {
    const parts = path.split(/[/\\]/);
    return parts[parts.length - 1] || 'instance';
  }
}

export const launcherService = new LauncherService();
