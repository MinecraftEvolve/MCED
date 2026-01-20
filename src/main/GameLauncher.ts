import { spawn, ChildProcess, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import os from 'os';

export interface LaunchConfig {
  instancePath: string;
  launcherType: 'modrinth' | 'curseforge' | 'multimc' | 'prism' | 'unknown';
}

export interface GameProcess {
  pid: number;
  instancePath: string;
  startTime: number;
  process: ChildProcess;
}

export class GameLauncher {
  private static runningProcesses = new Map<string, GameProcess>();

  static isInstanceRunning(instancePath: string): boolean {
    return this.runningProcesses.has(instancePath);
  }

  static getRunningInstances(): GameProcess[] {
    return Array.from(this.runningProcesses.values());
  }

  static async launchThroughLauncher(config: LaunchConfig): Promise<{ success: boolean; error?: string }> {
    try {
      if (this.isInstanceRunning(config.instancePath)) {
        return { success: false, error: 'Instance is already running' };
      }

      if (config.launcherType === 'modrinth') {
        await this.launchModrinthInstance(config.instancePath);
        return { success: true };
      }

      return { success: false, error: 'Launcher type not supported yet' };
    } catch (error) {
      console.error('[GameLauncher] Launch failed:', error);
      return { success: false, error: String(error) };
    }
  }

  private static async launchModrinthInstance(instancePath: string): Promise<void> {
    // Use the actual stored batch file from Modrinth
    const mcedDir = path.join(instancePath, '.mced');
    const launchBatPath = path.join(mcedDir, 'launch.bat');
    
    // Check if the launch.bat exists from a previous Modrinth launch
    try {
      await fs.access(launchBatPath);
      console.log('[GameLauncher] Using existing Modrinth launch.bat');
      
      const process = spawn('cmd.exe', ['/c', launchBatPath], {
        cwd: instancePath,
        detached: true,
        stdio: ['ignore', 'pipe', 'pipe']
      });

      process.stdout?.on('data', (data) => {
        console.log(`[Game Output] ${data.toString().trim()}`);
      });

      process.stderr?.on('data', (data) => {
        console.log(`[Game Error] ${data.toString().trim()}`);
      });

      this.runningProcesses.set(instancePath, {
        pid: process.pid!,
        instancePath,
        startTime: Date.now(),
        process
      });

      process.on('exit', (code) => {
        console.log(`[GameLauncher] Game exited with code ${code}`);
        this.runningProcesses.delete(instancePath);
      });

      return;
    } catch {
      console.log('[GameLauncher] No existing launch.bat, creating new one');
    }

    // Build command from Modrinth database
    const modrinthRoot = path.dirname(path.dirname(instancePath));
    const dbPath = path.join(modrinthRoot, 'app.db');
    
    const db = new Database(dbPath, { readonly: true });
    
    // Get profile info
    const profileName = path.basename(instancePath);
    const profile: any = db.prepare(`
      SELECT * FROM profiles WHERE path = ?
    `).get(profileName);

    if (!profile) {
      throw new Error('Profile not found in Modrinth database');
    }

    const minecraftVersion = profile.game_version;
    const loaderType = profile.mod_loader;
    const loaderVersion = profile.mod_loader_version;
    
    db.close();

    // Find Java
    const javaVersionsDir = path.join(modrinthRoot, 'meta', 'java_versions');
    const javaFolders = await fs.readdir(javaVersionsDir);
    const javaFolder = javaFolders.find(f => f.includes('jre17') || f.includes('java-17'));
    
    if (!javaFolder) {
      throw new Error('Java 17 not found in Modrinth java_versions');
    }

    const javaPath = path.join(javaVersionsDir, javaFolder, 'bin', 'java.exe');

    // Build classpath from Modrinth libraries
    const librariesDir = path.join(modrinthRoot, 'meta', 'libraries');
    const versionJarPath = path.join(modrinthRoot, 'meta', 'versions', `${minecraftVersion}-${loaderVersion}`, `${minecraftVersion}-${loaderVersion}.jar`);
    
    const classpath = await this.buildModrinthClasspath(librariesDir, versionJarPath);

    // Create launch batch file
    await fs.mkdir(mcedDir, { recursive: true });
    
    const batchContent = `@echo off
cd /d "${instancePath}"
"${javaPath}" -Xms2G -Xmx4G -cp "${classpath}" cpw.mods.bootstraplauncher.BootstrapLauncher --width 854 --height 480
pause
`;

    await fs.writeFile(launchBatPath, batchContent, 'utf8');
    console.log('[GameLauncher] Created launch.bat');

    // Launch the game
    const process = spawn('cmd.exe', ['/c', launchBatPath], {
      cwd: instancePath,
      detached: true,
      stdio: ['ignore', 'pipe', 'pipe']
    });

    process.stdout?.on('data', (data) => {
      console.log(`[Game Output] ${data.toString().trim()}`);
    });

    process.stderr?.on('data', (data) => {
      console.log(`[Game Error] ${data.toString().trim()}`);
    });

    this.runningProcesses.set(instancePath, {
      pid: process.pid!,
      instancePath,
      startTime: Date.now(),
      process
    });

    process.on('exit', (code) => {
      console.log(`[GameLauncher] Game exited with code ${code}`);
      this.runningProcesses.delete(instancePath);
    });
  }

  private static async buildModrinthClasspath(librariesDir: string, versionJarPath: string): Promise<string> {
    const jars: string[] = [];

    // Recursively find all JARs in libraries directory
    async function findJars(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          await findJars(fullPath);
        } else if (entry.name.endsWith('.jar') || entry.name.endsWith('.zip')) {
          jars.push(fullPath);
        }
      }
    }

    await findJars(librariesDir);
    
    // Add version JAR at the end
    jars.push(versionJarPath);

    return jars.join(';');
  }

  static killInstance(instancePath: string): boolean {
    const gameProcess = this.runningProcesses.get(instancePath);
    if (!gameProcess) {
      return false;
    }

    try {
      gameProcess.process.kill('SIGTERM');
      this.runningProcesses.delete(instancePath);
      return true;
    } catch (error) {
      console.error('[GameLauncher] Failed to kill process:', error);
      return false;
    }
  }
}
