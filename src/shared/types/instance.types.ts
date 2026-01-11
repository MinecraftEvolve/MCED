export interface MinecraftInstance {
  path: string;
  name: string;
  minecraftVersion: string;
  loader: LoaderInfo;
  modpack?: ModpackInfo;
  modsFolder: string;
  configFolder: string;
  totalMods: number;
  lastAccessed?: Date;
}

export interface LoaderInfo {
  type: 'forge' | 'fabric' | 'neoforge' | 'quilt' | 'vanilla';
  version: string;
}

export interface ModpackInfo {
  source: ModpackSource;
  name: string;
  version?: string;
  author?: string;
  projectId?: string | number;
}

export type ModpackSource = 
  | 'curseforge' 
  | 'modrinth' 
  | 'atlauncher' 
  | 'multimc' 
  | 'prism' 
  | 'ftb'
  | 'technic'
  | 'custom';

export interface InstanceMetadata {
  instanceType: 'multimc' | 'prism' | 'curseforge' | 'atlauncher' | 'vanilla' | 'custom';
  configPath?: string;
  hasInstanceJson: boolean;
  hasMMCPack: boolean;
  hasManifest: boolean;
}

export interface LauncherInfo {
  type: 'multimc' | 'prism' | 'curseforge' | 'atlauncher' | 'vanilla';
  path: string;
  executable: string;
  version?: string;
}

export interface GameStats {
  memory: number;
  isRunning: boolean;
  fps?: number;
  uptime?: number;
}

export interface RecentInstance {
  path: string;
  name: string;
  lastOpened: Date;
  thumbnail?: string;
}
