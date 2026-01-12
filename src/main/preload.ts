import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
});

contextBridge.exposeInMainWorld("api", {
  // File System
  readFile: (path: string) => ipcRenderer.invoke("fs:readFile", path),
  writeFile: (path: string, content: string) =>
    ipcRenderer.invoke("fs:writeFile", path, content),
  readdir: (path: string) => ipcRenderer.invoke("fs:readdir", path),
  stat: (path: string) => ipcRenderer.invoke("fs:stat", path),

  // Instance
  detectInstance: (path: string) => ipcRenderer.invoke("instance:detect", path),

  // Mods
  scanMods: (modsFolder: string) => ipcRenderer.invoke("mods:scan", modsFolder),
  extractIcon: (jarPath: string, iconPath: string) =>
    ipcRenderer.invoke("jar:extractIcon", jarPath, iconPath),

  // App
  getAppPath: (name: string) => ipcRenderer.invoke("app:getPath", name),
  getAppVersion: () => ipcRenderer.invoke("app:getVersion"),

  // Modrinth API
  modrinthSearch: (query: string) =>
    ipcRenderer.invoke("modrinth:search", query),
  modrinthGetProject: (idOrSlug: string) =>
    ipcRenderer.invoke("modrinth:getProject", idOrSlug),

  // Backups
  listBackups: (instancePath: string) =>
    ipcRenderer.invoke("backup:list", instancePath),
  createBackup: (instancePath: string) =>
    ipcRenderer.invoke("backup:create", instancePath),
  restoreBackup: (instancePath: string, backupId: string) =>
    ipcRenderer.invoke("backup:restore", instancePath, backupId),
  deleteBackup: (instancePath: string, backupId: string) =>
    ipcRenderer.invoke("backup:delete", instancePath, backupId),

  // External Editor
  openInEditor: (filePath: string, editorCommand?: string) =>
    ipcRenderer.invoke("open-in-editor", filePath, editorCommand),

  // Cache
  clearApiCache: () => ipcRenderer.invoke("clear-api-cache"),
});

declare global {
  interface Window {
    electron: {
      openDirectory: () => Promise<string | null>;
    };
    api: {
      readFile: (
        path: string,
      ) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (
        path: string,
        content: string,
      ) => Promise<{ success: boolean; error?: string }>;
      readdir: (
        path: string,
      ) => Promise<{ success: boolean; files?: string[]; error?: string }>;
      stat: (
        path: string,
      ) => Promise<{ success: boolean; stats?: any; error?: string }>;
      detectInstance: (
        path: string,
      ) => Promise<{ success: boolean; instance?: any; error?: string }>;
      scanMods: (
        modsFolder: string,
      ) => Promise<{ success: boolean; mods?: any[]; error?: string }>;
      extractIcon: (
        jarPath: string,
        iconPath: string,
      ) => Promise<{ success: boolean; iconData?: string; error?: string }>;
      getAppPath: (
        name: string,
      ) => Promise<{ success: boolean; path?: string; error?: string }>;
      modrinthSearch: (
        query: string,
      ) => Promise<{ success: boolean; mod?: any; error?: string }>;
      modrinthGetProject: (
        idOrSlug: string,
      ) => Promise<{ success: boolean; project?: any; error?: string }>;
      listBackups: (instancePath: string) => Promise<any[]>;
      createBackup: (
        instancePath: string,
      ) => Promise<{ success: boolean; error?: string }>;
      restoreBackup: (
        instancePath: string,
        backupId: string,
      ) => Promise<{ success: boolean; error?: string }>;
      deleteBackup: (
        instancePath: string,
        backupId: string,
      ) => Promise<{ success: boolean; error?: string }>;
      openInEditor: (
        filePath: string,
        editorCommand?: string,
      ) => Promise<{ success: boolean; error?: string }>;
      clearApiCache: () => Promise<void>;
    };
  }
}
