import { spawn, ChildProcess } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import Database from 'better-sqlite3';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

interface AuthInfo {
  playerName: string;
  uuid: string;
  accessToken: string;
  userType: 'msa' | 'legacy';
  xuid?: string;
}

interface GameProcess {
  pid: number;
  instancePath: string;
  startTime: number;
  process: ChildProcess;
}

interface VersionData {
  mainClass: string;
  libraries: any[];
  arguments?: { jvm?: any[]; game?: any[] };
  minecraftArguments?: string;
  assets: string;
  assetsDir: string;
  clientJar: string;
  libsDir: string;
}

export class LaunchService {
  private static runningProcesses = new Map<string, GameProcess>();

  async launch(
    instancePath: string,
    launcher: string,
    mcVersion: string,
    loaderVersion: string
  ): Promise<{ success: boolean; pid?: number; error?: string }> {
    try {
      if (LaunchService.isRunning(instancePath)) {
        return { success: false, error: 'Instance is already running' };
      }

      console.log(`[MCED Launch] Starting ${mcVersion} via ${launcher}`);

      // Auth — best-effort, offline fallback
      const auth = (await this.getAuth(launcher)) ?? {
        playerName: 'Player',
        uuid: '00000000-0000-0000-0000-000000000000',
        accessToken: '0',
        userType: 'legacy' as const,
      };
      console.log(`[MCED Launch] Auth: ${auth.playerName} (${auth.userType})`);

      // Java
      const javaPath = await this.findJava(launcher, mcVersion);
      console.log(`[MCED Launch] Java: ${javaPath}`);

      // Version data + libraries
      const versionData = await this.resolveVersionData(
        launcher,
        instancePath,
        mcVersion,
        loaderVersion
      );

      // Classpath
      const classpath = await this.buildClasspath(versionData);

      // Natives dir
      const nativesDir = path.join(instancePath, '.mced', 'natives');
      await fs.mkdir(nativesDir, { recursive: true });

      // Variable map for ${variable} substitution
      const vars: Record<string, string> = {
        natives_directory: nativesDir,
        launcher_name: 'MCED',
        launcher_version: '1.0',
        classpath,
        library_directory: versionData.libsDir,
        classpath_separator: this.classpathSep(),
        version_name: mcVersion,
        path: '',
        auth_player_name: auth.playerName,
        version_type: 'release',
        game_directory: instancePath,
        assets_root: versionData.assetsDir,
        assets_index_name: versionData.assets || '1',
        auth_uuid: auth.uuid,
        auth_access_token: auth.accessToken,
        clientid: 'null',
        auth_xuid: auth.xuid || 'null',
        user_type: auth.userType,
      };

      const rawJvmArgs = this.parseArgs(versionData.arguments?.jvm || []);
      const rawGameArgs = this.parseArgs(versionData.arguments?.game || []);
      const expandedJvm = this.expandVars(rawJvmArgs, vars);
      const expandedGame = this.expandVars(rawGameArgs, vars);

      // Legacy minecraftArguments string (pre-1.13)
      const legacyArgs = versionData.minecraftArguments
        ? this.expandVars(versionData.minecraftArguments.split(' '), vars)
        : [];

      const fullArgs = [
        '-Xmx4G',
        '-Xms1G',
        ...expandedJvm,
        versionData.mainClass,
        ...expandedGame,
        ...legacyArgs,
      ];

      console.log(`[MCED Launch] Spawning with mainClass: ${versionData.mainClass}`);

      const childProcess = spawn(javaPath, fullArgs, {
        cwd: instancePath,
        stdio: ['ignore', 'pipe', 'pipe'],
        detached: false,
      });

      childProcess.stdout?.on('data', (data: Buffer) => {
        console.log(`[MC] ${data.toString().trimEnd()}`);
      });
      childProcess.stderr?.on('data', (data: Buffer) => {
        console.log(`[MC ERR] ${data.toString().trimEnd()}`);
      });

      LaunchService.runningProcesses.set(instancePath, {
        pid: childProcess.pid!,
        instancePath,
        startTime: Date.now(),
        process: childProcess,
      });

      childProcess.on('exit', (code) => {
        console.log(`[MCED Launch] Game exited with code ${code}`);
        LaunchService.runningProcesses.delete(instancePath);
      });

      childProcess.on('error', (err) => {
        console.error('[MCED Launch] Process error:', err);
        LaunchService.runningProcesses.delete(instancePath);
      });

      // Allow MCED to close without terminating Minecraft
      childProcess.unref();

      return { success: true, pid: childProcess.pid };
    } catch (error) {
      console.error('[MCED Launch] Failed:', error);
      return { success: false, error: String(error) };
    }
  }

  static kill(instancePath: string): boolean {
    const proc = this.runningProcesses.get(instancePath);
    if (!proc) return false;
    try {
      proc.process.kill('SIGTERM');
      this.runningProcesses.delete(instancePath);
      return true;
    } catch {
      return false;
    }
  }

  static isRunning(instancePath: string): boolean {
    return this.runningProcesses.has(instancePath);
  }

  static getRunningInstances(): string[] {
    return Array.from(this.runningProcesses.keys());
  }

  // ---------------------------------------------------------------------------
  // Auth reading
  // ---------------------------------------------------------------------------

  private async getAuth(launcher: string): Promise<AuthInfo | null> {
    if (launcher === 'prism' || launcher === 'multimc') {
      const auth = await this.readPrismAuth(launcher);
      if (auth) return auth;
    }
    if (launcher === 'modrinth') {
      const auth = await this.readModrinthAuth();
      if (auth) return auth;
    }
    return this.readVanillaAuth();
  }

  private getLauncherDataDir(launcher: string): string {
    const home = os.homedir();
    const platform = os.platform();

    switch (launcher) {
      case 'prism':
        if (platform === 'win32') return path.join(process.env.APPDATA || '', 'PrismLauncher');
        if (platform === 'darwin')
          return path.join(home, 'Library', 'Application Support', 'PrismLauncher');
        return path.join(home, '.local', 'share', 'PrismLauncher');

      case 'multimc':
        if (platform === 'win32') return path.join(process.env.APPDATA || '', 'MultiMC');
        if (platform === 'darwin')
          return path.join(home, 'Library', 'Application Support', 'MultiMC');
        return path.join(home, '.local', 'share', 'multimc');

      case 'modrinth':
        if (platform === 'win32') return path.join(process.env.APPDATA || '', 'ModrinthApp');
        if (platform === 'darwin')
          return path.join(home, 'Library', 'Application Support', 'com.modrinth.theseus');
        return path.join(home, '.local', 'share', 'com.modrinth.theseus');

      default: {
        if (platform === 'win32') return path.join(process.env.APPDATA || '', '.minecraft');
        if (platform === 'darwin')
          return path.join(home, 'Library', 'Application Support', 'minecraft');
        return path.join(home, '.minecraft');
      }
    }
  }

  private getDotMinecraft(): string {
    return this.getLauncherDataDir('vanilla');
  }

  private async readPrismAuth(launcher: string): Promise<AuthInfo | null> {
    const dataDir = this.getLauncherDataDir(launcher);
    const accountsPath = path.join(dataDir, 'accounts.json');
    try {
      const data = JSON.parse(await fs.readFile(accountsPath, 'utf-8'));
      const activeId: string = data.activeAccount;
      const accounts: any[] = data.accounts || [];
      const active =
        accounts.find((a: any) => a.profile?.id === activeId) ?? accounts[0];
      if (!active) return null;

      return {
        playerName: active.profile?.name || 'Player',
        uuid: active.profile?.id || '00000000-0000-0000-0000-000000000000',
        accessToken:
          active.accessToken || active.ygg?.extra?.accessToken || '0',
        userType: active.type === 'MSA' ? 'msa' : 'legacy',
        xuid: active.xuid,
      };
    } catch (e) {
      console.warn('[MCED Launch] Could not read Prism auth:', e);
      return null;
    }
  }

  private async readModrinthAuth(): Promise<AuthInfo | null> {
    const dataDir = this.getLauncherDataDir('modrinth');
    const dbPath = path.join(dataDir, 'app.db');
    let db: Database.Database | null = null;
    try {
      db = new Database(dbPath, { readonly: true });
      const tables = (
        db
          .prepare("SELECT name FROM sqlite_master WHERE type='table'")
          .all() as { name: string }[]
      ).map((t) => t.name);

      for (const table of ['users', 'auth', 'accounts', 'user']) {
        if (!tables.includes(table)) continue;
        try {
          const row = db.prepare(`SELECT * FROM ${table} LIMIT 1`).get() as any;
          if (!row) continue;
          const token =
            row.access_token || row.accessToken || row.token || row.minecraft_token;
          const name = row.username || row.name || row.player_name || 'Player';
          const uuid =
            row.uuid ||
            row.id ||
            row.player_uuid ||
            '00000000-0000-0000-0000-000000000000';
          if (token) {
            return { playerName: name, uuid, accessToken: token, userType: 'msa' };
          }
        } catch {}
      }
    } catch (e) {
      console.warn('[MCED Launch] Could not read Modrinth auth:', e);
    } finally {
      db?.close();
    }
    return null;
  }

  private async readVanillaAuth(): Promise<AuthInfo | null> {
    const accountsPath = path.join(
      this.getDotMinecraft(),
      'launcher_accounts.json'
    );
    try {
      const data = JSON.parse(await fs.readFile(accountsPath, 'utf-8'));
      const activeId: string = data.activeAccountLocalId;
      const accounts: Record<string, any> = data.accounts || {};
      const active =
        accounts[activeId] ?? (Object.values(accounts)[0] as any);
      if (!active) return null;

      return {
        playerName:
          active.minecraftProfile?.name || active.username || 'Player',
        uuid:
          active.minecraftProfile?.id ||
          '00000000-0000-0000-0000-000000000000',
        accessToken: active.accessToken || '0',
        userType: 'msa',
      };
    } catch (e) {
      console.warn('[MCED Launch] Could not read Vanilla auth:', e);
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Java finding
  // ---------------------------------------------------------------------------

  private async findJava(launcher: string, mcVersion: string): Promise<string> {
    const requiredMajor = this.requiredJavaMajor(mcVersion);
    const javaExe = os.platform() === 'win32' ? 'java.exe' : 'java';

    // 1. Launcher-bundled Java
    const launcherJava = await this.findLauncherJava(launcher, javaExe, requiredMajor);
    if (launcherJava) return launcherJava;

    // 2. JAVA_HOME
    if (process.env.JAVA_HOME) {
      const candidate = path.join(process.env.JAVA_HOME, 'bin', javaExe);
      if (await this.fileExists(candidate)) return candidate;
    }

    // 3. System PATH
    try {
      const cmd = os.platform() === 'win32' ? 'where java' : 'which java';
      const { stdout } = await execAsync(cmd);
      const javaPath = stdout.trim().split('\n')[0].trim();
      if (javaPath && (await this.fileExists(javaPath))) return javaPath;
    } catch {}

    // 4. Common installation paths
    for (const candidate of this.getCommonJavaPaths(javaExe)) {
      if (await this.fileExists(candidate)) return candidate;
    }

    throw new Error(
      `Java ${requiredMajor}+ not found. Please install Java and ensure it is on your PATH, ` +
        `or set the JAVA_HOME environment variable.`
    );
  }

  private async findLauncherJava(
    launcher: string,
    javaExe: string,
    requiredMajor: number
  ): Promise<string | null> {
    const dataDir = this.getLauncherDataDir(launcher);
    const searchDirs: string[] = [];

    if (launcher === 'modrinth') {
      searchDirs.push(path.join(dataDir, 'meta', 'java_versions'));
    } else if (launcher === 'prism' || launcher === 'multimc') {
      searchDirs.push(path.join(dataDir, 'java'), path.join(dataDir, 'jre'));
    }

    for (const searchDir of searchDirs) {
      try {
        const entries = await fs.readdir(searchDir);
        for (const entry of entries) {
          const candidate = path.join(searchDir, entry, 'bin', javaExe);
          if (await this.fileExists(candidate)) {
            const major = await this.getJavaMajorVersion(path.join(searchDir, entry));
            if (major >= requiredMajor) return candidate;
          }
        }
      } catch {}
    }
    return null;
  }

  private async getJavaMajorVersion(jreRoot: string): Promise<number> {
    try {
      const content = await fs.readFile(path.join(jreRoot, 'release'), 'utf-8');
      const match = content.match(/JAVA_VERSION="(\d+)/);
      if (match) {
        const major = parseInt(match[1], 10);
        return major === 1 ? 8 : major; // Java 8 reports as "1.8"
      }
    } catch {}
    return 999; // Unknown — optimistically accept
  }

  private getCommonJavaPaths(javaExe: string): string[] {
    const platform = os.platform();
    if (platform === 'win32') {
      return [
        path.join('C:', 'Program Files', 'Java', 'jre-17', 'bin', javaExe),
        path.join(
          'C:',
          'Program Files',
          'Eclipse Adoptium',
          'jre-17',
          'bin',
          javaExe
        ),
        path.join(
          'C:',
          'Program Files',
          'Microsoft',
          'jdk-17',
          'bin',
          javaExe
        ),
      ];
    }
    if (platform === 'darwin') {
      return [
        '/usr/bin/java',
        '/Library/Java/JavaVirtualMachines/jdk-17.jdk/Contents/Home/bin/java',
      ];
    }
    return [
      '/usr/bin/java',
      '/usr/lib/jvm/java-17-openjdk-amd64/bin/java',
      '/usr/lib/jvm/java-17/bin/java',
      '/usr/lib/jvm/java-17-openjdk/bin/java',
    ];
  }

  private requiredJavaMajor(mcVersion: string): number {
    const minor = parseInt(mcVersion.split('.')[1] || '0', 10);
    if (minor >= 21) return 21;
    if (minor >= 17) return 17;
    return 8;
  }

  // ---------------------------------------------------------------------------
  // Version JSON resolution
  // ---------------------------------------------------------------------------

  private async resolveVersionData(
    launcher: string,
    instancePath: string,
    mcVersion: string,
    loaderVersion: string
  ): Promise<VersionData> {
    if (launcher === 'modrinth') {
      return this.resolveModrinthVersionData(mcVersion, loaderVersion);
    }
    if (launcher === 'prism' || launcher === 'multimc') {
      return this.resolvePrismVersionData(launcher, mcVersion, loaderVersion);
    }
    return this.resolveVanillaVersionData(mcVersion);
  }

  private async resolveModrinthVersionData(
    mcVersion: string,
    loaderVersion: string
  ): Promise<VersionData> {
    const dataDir = this.getLauncherDataDir('modrinth');
    const metaPath = path.join(dataDir, 'meta');
    const libsDir = path.join(metaPath, 'libraries');
    const assetsDir = path.join(metaPath, 'assets');
    const versionsDir = path.join(metaPath, 'versions');

    const versionKey = loaderVersion
      ? `${mcVersion}-${loaderVersion}`
      : mcVersion;
    const versionJsonPath = path.join(versionsDir, versionKey, `${versionKey}.json`);

    const versionJson = JSON.parse(await fs.readFile(versionJsonPath, 'utf-8'));
    const clientJar = path.join(versionsDir, versionKey, `${versionKey}.jar`);

    return { ...versionJson, assetsDir, clientJar, libsDir };
  }

  private async resolvePrismVersionData(
    launcher: string,
    mcVersion: string,
    loaderVersion: string
  ): Promise<VersionData> {
    const dataDir = this.getLauncherDataDir(launcher);
    const libsDir = path.join(dataDir, 'libraries');
    const assetsDir = path.join(dataDir, 'assets');
    const metaDir = path.join(dataDir, 'meta');

    const mcJsonPath = path.join(metaDir, 'net.minecraft', `${mcVersion}.json`);
    let versionJson: any = null;

    try {
      versionJson = JSON.parse(await fs.readFile(mcJsonPath, 'utf-8'));
    } catch {
      console.warn('[MCED Launch] Prism meta not found, falling back to ~/.minecraft');
      return this.resolveVanillaVersionData(mcVersion);
    }

    // Merge loader component
    if (loaderVersion) {
      const loaderCandidates = [
        path.join(metaDir, 'net.minecraftforge', `${loaderVersion}.json`),
        path.join(metaDir, 'net.fabricmc.fabric-loader', `${loaderVersion}.json`),
        path.join(metaDir, 'org.quiltmc.quilt-loader', `${loaderVersion}.json`),
        path.join(metaDir, 'net.neoforged', `${loaderVersion}.json`),
      ];
      for (const loaderJsonPath of loaderCandidates) {
        try {
          const loaderJson = JSON.parse(await fs.readFile(loaderJsonPath, 'utf-8'));
          if (loaderJson.mainClass) versionJson.mainClass = loaderJson.mainClass;
          if (loaderJson.libraries) {
            versionJson.libraries = [
              ...(loaderJson.libraries || []),
              ...(versionJson.libraries || []),
            ];
          }
          if (loaderJson.arguments) {
            versionJson.arguments = versionJson.arguments || {};
            versionJson.arguments.jvm = [
              ...(loaderJson.arguments.jvm || []),
              ...(versionJson.arguments?.jvm || []),
            ];
            versionJson.arguments.game = [
              ...(versionJson.arguments?.game || []),
              ...(loaderJson.arguments.game || []),
            ];
          }
          break;
        } catch {}
      }
    }

    const clientJar = path.join(
      libsDir,
      'com',
      'mojang',
      'minecraft',
      mcVersion,
      `minecraft-${mcVersion}-client.jar`
    );

    return { ...versionJson, assetsDir, clientJar, libsDir };
  }

  private async resolveVanillaVersionData(mcVersion: string): Promise<VersionData> {
    const dotMinecraft = this.getDotMinecraft();
    const libsDir = path.join(dotMinecraft, 'libraries');
    const assetsDir = path.join(dotMinecraft, 'assets');
    const versionDir = path.join(dotMinecraft, 'versions', mcVersion);
    const versionJsonPath = path.join(versionDir, `${mcVersion}.json`);

    try {
      const versionJson = JSON.parse(await fs.readFile(versionJsonPath, 'utf-8'));
      const clientJar = path.join(versionDir, `${mcVersion}.jar`);
      return { ...versionJson, assetsDir, clientJar, libsDir };
    } catch {
      throw new Error(
        `Version data for Minecraft ${mcVersion} not found in ${dotMinecraft}. ` +
          'Please launch the game from your launcher at least once to download the required files.'
      );
    }
  }

  // ---------------------------------------------------------------------------
  // Classpath building
  // ---------------------------------------------------------------------------

  private async buildClasspath(versionData: VersionData): Promise<string> {
    const jars: string[] = [];

    if (await this.fileExists(versionData.clientJar)) {
      jars.push(versionData.clientJar);
    }

    for (const lib of versionData.libraries || []) {
      if (lib.include_in_classpath === false) continue;
      if (lib.rules && !this.checkRules(lib.rules)) continue;
      if (lib.natives) continue; // Natives go to nativesDir, not classpath

      if (lib.downloads?.artifact?.path) {
        const libPath = path.join(versionData.libsDir, lib.downloads.artifact.path);
        if (await this.fileExists(libPath)) jars.push(libPath);
      } else if (lib.name) {
        const mavenPath = this.mavenToPath(lib.name);
        if (mavenPath) {
          const libPath = path.join(versionData.libsDir, mavenPath);
          if (await this.fileExists(libPath)) jars.push(libPath);
        }
      }
    }

    if (jars.length === 0) {
      throw new Error(
        'No library JARs found for this instance. ' +
          'Please launch the game from your launcher once to download the required files.'
      );
    }

    return jars.join(this.classpathSep());
  }

  private mavenToPath(mavenCoord: string): string | null {
    const parts = mavenCoord.split(':');
    if (parts.length < 3) return null;
    const [group, artifact, version] = parts;
    const groupPath = group.replace(/\./g, '/');
    return `${groupPath}/${artifact}/${version}/${artifact}-${version}.jar`;
  }

  // ---------------------------------------------------------------------------
  // Argument helpers (adapted from GameLauncherSimple.ts)
  // ---------------------------------------------------------------------------

  private parseArgs(args: any[]): string[] {
    const result: string[] = [];
    for (const arg of args) {
      if (typeof arg === 'string') {
        result.push(arg);
      } else if (arg.rules) {
        if (this.checkRules(arg.rules)) {
          if (Array.isArray(arg.value)) result.push(...arg.value);
          else if (arg.value) result.push(arg.value);
        }
      } else if (arg.value) {
        if (Array.isArray(arg.value)) result.push(...arg.value);
        else result.push(arg.value);
      }
    }
    return result;
  }

  private expandVars(args: string[], vars: Record<string, string>): string[] {
    return args.map((arg) => {
      let result = arg;
      for (const [key, value] of Object.entries(vars)) {
        result = result.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value);
      }
      return result;
    });
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
    const platform = os.platform();
    if (osRule.name === 'windows' && platform !== 'win32') return false;
    if (osRule.name === 'linux' && platform !== 'linux') return false;
    if (osRule.name === 'osx' && platform !== 'darwin') return false;
    return true;
  }

  private classpathSep(): string {
    return os.platform() === 'win32' ? ';' : ':';
  }

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
