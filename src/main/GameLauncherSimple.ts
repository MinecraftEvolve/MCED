import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';

export interface LaunchConfig {
  instancePath: string;
  minecraftVersion: string;
  loaderVersion: string;
}

export class GameLauncherSimple {
  private process: ChildProcess | null = null;

  async launch(config: LaunchConfig): Promise<void> {
    const modrinthApp = path.join(os.homedir(), 'AppData', 'Roaming', 'ModrinthApp');
    const metaPath = path.join(modrinthApp, 'meta');
    
    // Find Java
    const javaPath = await this.findJava(path.join(modrinthApp, 'java_versions'));
    if (!javaPath) throw new Error('Java not found');
    
    // Load version JSON
    const versionKey = `${config.minecraftVersion}-${config.loaderVersion}`;
    const versionJsonPath = path.join(metaPath, 'versions', versionKey, `${versionKey}.json`);
    const versionJson = JSON.parse(await fs.readFile(versionJsonPath, 'utf-8'));
    
    // Build classpath
    const cp = await this.buildClasspath(versionJson, metaPath, versionKey, config.instancePath);
    
    // Build args
    const jvmArgs = this.parseArgs(versionJson.arguments?.jvm || []);
    const gameArgs = this.parseArgs(versionJson.arguments?.game || []);
    
    const nativesDir = path.join(config.instancePath, '.mced', 'natives');
    await fs.mkdir(nativesDir, { recursive: true });
    
    const vars: Record<string, string> = {
      natives_directory: nativesDir,
      launcher_name: 'MCED',
      launcher_version: '1.0',
      classpath: cp.join(';'),
      library_directory: path.join(metaPath, 'libraries'),
      classpath_separator: ';',
      version_name: versionKey,
      path: '',
      auth_player_name: 'Player',
      version_type: 'release',
      game_directory: config.instancePath,
      assets_root: path.join(metaPath, 'assets'),
      assets_index_name: '5',
      auth_uuid: '00000000-0000-0000-0000-000000000000',
      auth_access_token: 'null',
      clientid: 'null',
      auth_xuid: 'null',
      user_type: 'legacy',
    };
    
    const expandedJvm = this.expand(jvmArgs, vars);
    const expandedGame = this.expand(gameArgs, vars);
    
    const fullArgs = [
      '-Xmx4G',
      '-Xms1G',
      ...expandedJvm,
      versionJson.mainClass,
      ...expandedGame
    ];
    
    this.process = spawn(javaPath, fullArgs, {
      cwd: config.instancePath,
      stdio: ['ignore', 'inherit', 'inherit'],
    });
    
    this.process.on('exit', (code) => {
      console.log(`Game exited: ${code}`);
      this.process = null;
    });
  }
  
  private async findJava(javaDir: string): Promise<string | null> {
    try {
      const dirs = await fs.readdir(javaDir);
      for (const dir of dirs) {
        const javaExe = path.join(javaDir, dir, 'bin', 'java.exe');
        try {
          await fs.access(javaExe);
          return javaExe;
        } catch {}
      }
    } catch {}
    return null;
  }
  
  private async buildClasspath(versionJson: any, metaPath: string, versionKey: string, instancePath: string): Promise<string[]> {
    const cp: string[] = [];
    const libsDir = path.join(metaPath, 'libraries');
    
    // Add version JAR
    const versionJar = path.join(metaPath, 'versions', versionKey, `${versionKey}.jar`);
    try {
      await fs.access(versionJar);
      cp.push(versionJar);
    } catch {}
    
    // Add libraries
    for (const lib of versionJson.libraries || []) {
      if (lib.include_in_classpath === false) continue;
      if (lib.rules && !this.checkRules(lib.rules)) continue;
      
      if (lib.downloads?.artifact?.path) {
        const libPath = path.join(libsDir, lib.downloads.artifact.path);
        try {
          await fs.access(libPath);
          cp.push(libPath);
        } catch {}
      }
    }
    
    return cp;
  }
  
  private checkRules(rules: any[]): boolean {
    for (const rule of rules) {
      if (rule.os) {
        const match = this.osMatches(rule.os);
        if (rule.action === 'allow' && !match) return false;
        if (rule.action === 'disallow' && match) return false;
      } else if (rule.action === 'allow') {
        return true;
      }
    }
    return true;
  }
  
  private osMatches(osRule: any): boolean {
    if (osRule.name === 'windows' && os.platform() !== 'win32') return false;
    if (osRule.name === 'linux' && os.platform() !== 'linux') return false;
    if (osRule.name === 'osx' && os.platform() !== 'darwin') return false;
    return true;
  }
  
  private parseArgs(args: any[]): string[] {
    const result: string[] = [];
    for (const arg of args) {
      if (typeof arg === 'string') {
        result.push(arg);
      } else if (arg.rules && this.checkRules(arg.rules)) {
        if (Array.isArray(arg.value)) {
          result.push(...arg.value);
        } else {
          result.push(arg.value);
        }
      }
    }
    return result;
  }
  
  private expand(args: string[], vars: Record<string, string>): string[] {
    return args.map(arg => {
      let result = arg;
      for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
      }
      return result;
    });
  }
  
  kill() {
    if (this.process) {
      this.process.kill();
      this.process = null;
    }
  }
}
