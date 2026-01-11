import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Dialog
  openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),

  // File System
  readFile: (path: string) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke('fs:writeFile', path, content),
  readdir: (path: string) => ipcRenderer.invoke('fs:readdir', path),
  stat: (path: string) => ipcRenderer.invoke('fs:stat', path),

  // Instance
  detectInstance: (path: string) => ipcRenderer.invoke('instance:detect', path),

  // Mods
  scanMods: (modsFolder: string) => ipcRenderer.invoke('mods:scan', modsFolder),
  extractIcon: (jarPath: string, iconPath: string) => ipcRenderer.invoke('jar:extractIcon', jarPath, iconPath),

  // App
  getAppPath: (name: string) => ipcRenderer.invoke('app:getPath', name),
  
  // Launch
  launchMinecraft: (instancePath: string, launcherType: string) => ipcRenderer.invoke('launch:minecraft', instancePath, launcherType),
});

declare global {
  interface Window {
    electronAPI: {
      openDirectory: () => Promise<string | null>;
      readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      readdir: (path: string) => Promise<{ success: boolean; files?: string[]; error?: string }>;
      stat: (path: string) => Promise<{ success: boolean; stats?: any; error?: string }>;
      detectInstance: (path: string) => Promise<{ success: boolean; instance?: any; error?: string }>;
      scanMods: (modsFolder: string) => Promise<{ success: boolean; mods?: any[]; error?: string }>;
      extractIcon: (jarPath: string, iconPath: string) => Promise<{ success: boolean; iconData?: string; error?: string }>;
      getAppPath: (name: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      launchMinecraft: (instancePath: string, launcherType: string) => Promise<{ success: boolean; error?: string }>;
    };
  }
}
