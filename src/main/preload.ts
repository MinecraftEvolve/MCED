import { contextBridge, ipcRenderer } from "electron";
import { UpdateInfo } from "../shared/types/api.types";

contextBridge.exposeInMainWorld("electron", {
  openDirectory: () => ipcRenderer.invoke("dialog:openDirectory"),
});

contextBridge.exposeInMainWorld("api", {
  // File System
  readFile: (path: string) => ipcRenderer.invoke("fs:readFile", path),
  writeFile: (path: string, content: string) => ipcRenderer.invoke("fs:writeFile", path, content),
  readdir: (path: string) => ipcRenderer.invoke("fs:readdir", path),
  readdirRecursive: (path: string, options?: { extensions?: string[]; maxDepth?: number }) =>
    ipcRenderer.invoke("fs:readdirRecursive", path, options),
  stat: (path: string) => ipcRenderer.invoke("fs:stat", path),
  deleteFile: (path: string) => ipcRenderer.invoke("fs:deleteFile", path),
  joinPath: (...paths: string[]) => ipcRenderer.invoke("fs:joinPath", ...paths),
  fileExists: (path: string) => ipcRenderer.invoke("fs:fileExists", path),
  listDirectory: (path: string) => ipcRenderer.invoke("fs:listDirectory", path),

  // Instance
  detectInstance: (path: string) => ipcRenderer.invoke("instance:detect", path),
  detectLauncher: (instancePath: string) => ipcRenderer.invoke("detect-launcher", instancePath),
  getServerConfigFolder: (instancePath: string) =>
    ipcRenderer.invoke("get-server-config-folder", instancePath),
  migrateAllServerConfigs: (instancePath: string) =>
    ipcRenderer.invoke("instance:migrateAllServerConfigs", instancePath),

  // Mods
  scanMods: (modsFolder: string) => ipcRenderer.invoke("mods:scan", modsFolder),
  extractIcon: (jarPath: string, iconPath: string) =>
    ipcRenderer.invoke("jar:extractIcon", jarPath, iconPath),

  // App
  getAppPath: (name: string) => ipcRenderer.invoke("app:getPath", name),
  getAppVersion: () => ipcRenderer.invoke("app:getVersion"),

  // Modrinth API
  modrinthSearch: (query: string) => ipcRenderer.invoke("modrinth:search", query),
  modrinthGetProject: (idOrSlug: string) => ipcRenderer.invoke("modrinth:getProject", idOrSlug),

  // Backups
  listBackups: (instancePath: string) => ipcRenderer.invoke("backup:list", instancePath),
  createBackup: (instancePath: string, name?: string) =>
    ipcRenderer.invoke("backup:create", instancePath, name),
  restoreBackup: (instancePath: string, backupId: string) =>
    ipcRenderer.invoke("backup:restore", instancePath, backupId),
  deleteBackup: (instancePath: string, backupId: string) =>
    ipcRenderer.invoke("backup:delete", instancePath, backupId),
  renameBackup: (instancePath: string, backupId: string, newName: string) =>
    ipcRenderer.invoke("backup:rename", instancePath, backupId, newName),

  // External Editor
  openInEditor: (filePath: string, editorCommand?: string) =>
    ipcRenderer.invoke("open-in-editor", filePath, editorCommand),

  // Cache
  clearApiCache: () => ipcRenderer.invoke("clear-api-cache"),

  // Discord RPC
  discordSetEnabled: (enabled: boolean) => ipcRenderer.invoke("discord:set-enabled", enabled),
  discordSetInstance: (instanceName: string) =>
    ipcRenderer.invoke("discord:set-instance", instanceName),
  discordSetMod: (modName: string, modCount: number, configFileName?: string) =>
    ipcRenderer.invoke("discord:set-mod", modName, modCount, configFileName),
  discordClearMod: () => ipcRenderer.invoke("discord:clear-mod"),
  discordClearInstance: () => ipcRenderer.invoke("discord:clear-instance"),

  // Game Launcher
  // Launch game APIs removed due to Java compatibility issues
  // TODO: Re-implement in future when stable solution is found

  // Update Checker
  checkForUpdates: () => ipcRenderer.invoke("check-for-updates"),
  downloadUpdate: () => ipcRenderer.invoke("download-update"),
  installUpdate: () => ipcRenderer.invoke("install-update"),
  onUpdateAvailable: (callback: (updateInfo: UpdateInfo) => void) => {
    ipcRenderer.on("update-available", (_event, updateInfo: UpdateInfo) => callback(updateInfo));
  },
  onUpdateDownloadProgress: (
    callback: (progress: { percent: number; transferred: number; total: number }) => void
  ) => {
    ipcRenderer.on("update-download-progress", (_event, progress) => callback(progress));
  },
  onUpdateDownloaded: (callback: () => void) => {
    ipcRenderer.on("update-downloaded", () => callback());
  },

  // External Links
  openExternal: (url: string) => ipcRenderer.invoke("shell:openExternal", url),

  // KubeJS
  kubeJSDetect: (instancePath: string) => ipcRenderer.invoke("kubejs:detect", instancePath),
  kubeJSGetScriptFiles: (instancePath: string) =>
    ipcRenderer.invoke("kubejs:getScriptFiles", instancePath),
  kubeJSListScripts: (instancePath: string) =>
    ipcRenderer.invoke("kubejs:listScripts", instancePath),
  kubeJSReadScript: (filePath: string) => ipcRenderer.invoke("kubejs:readScript", filePath),
  kubeJSWriteScript: (filePath: string, content: string) =>
    ipcRenderer.invoke("kubejs:writeScript", filePath, content),
  kubeJSCreateScript: (instancePath: string, relativePath: string, content: string) =>
    ipcRenderer.invoke("kubejs:createScript", instancePath, relativePath, content),
  kubeJSDeleteScript: (filePath: string) => ipcRenderer.invoke("kubejs:deleteScript", filePath),
  kubeJSSaveRecipe: (instancePath: string, recipe: any) =>
    ipcRenderer.invoke("kubejs:saveRecipe", instancePath, recipe),
  kubeJSGetRecipeTemplates: (instancePath: string) =>
    ipcRenderer.invoke("kubejs:getRecipeTemplates", instancePath),
  kubeJSOrganizeScripts: (
    instancePath: string,
    options?: {
      strategy?: "hybrid" | "flat" | "mod-only" | "type-only";
      kubejsVersion?: "1.19.2" | "1.20.1" | "auto";
      preserveComments?: boolean;
    }
  ) => ipcRenderer.invoke("kubejs:organizeScripts", instancePath, options),
  kubeJSBackupScripts: (instancePath: string) =>
    ipcRenderer.invoke("kubejs:backupScripts", instancePath),
  kubeJSExportScripts: (instancePath: string) =>
    ipcRenderer.invoke("kubejs:exportScripts", instancePath),
  kubeJSImportScripts: (instancePath: string) =>
    ipcRenderer.invoke("kubejs:importScripts", instancePath),
  kubeJSSaveTag: (instancePath: string, tagData: any) =>
    ipcRenderer.invoke("kubejs:saveTag", instancePath, tagData),
  kubeJSLoadTags: (instancePath: string) => ipcRenderer.invoke("kubejs:loadTags", instancePath),
  kubeJSLookupItem: (instancePath: string, itemId: string) =>
    ipcRenderer.invoke("kubejs:lookupItem", instancePath, itemId),
  kubeJSLoadItems: (instancePath: string) => ipcRenderer.invoke("kubejs:loadItems", instancePath),
  kubeJSGetTagItems: (instancePath: string, tag: string) =>
    ipcRenderer.invoke("kubejs:getTagItems", instancePath, tag),
  kubeJSSaveEventHandler: (instancePath: string, eventHandler: any) =>
    ipcRenderer.invoke("kubejs:saveEventHandler", instancePath, eventHandler),
  kubeJSSaveItemMod: (instancePath: string, itemMod: any) =>
    ipcRenderer.invoke("kubejs:saveItemMod", instancePath, itemMod),
  kubeJSSaveLootTable: (instancePath: string, lootTable: any) =>
    ipcRenderer.invoke("kubejs:saveLootTable", instancePath, lootTable),
  kubeJSSaveWorldgen: (instancePath: string, worldgen: any) =>
    ipcRenderer.invoke("kubejs:saveWorldgen", instancePath, worldgen),
  kubeJSSaveDimension: (instancePath: string, dimension: any) =>
    ipcRenderer.invoke("kubejs:saveDimension", instancePath, dimension),
  kubeJSValidateScript: (code: string) => ipcRenderer.invoke("kubejs:validateScript", code),

  // Item Registry
  itemRegistryInitialize: (instancePath: string, modsFolder: string) =>
    ipcRenderer.invoke("itemRegistry:initialize", instancePath, modsFolder),
  itemRegistryGetAllItems: (instancePath: string) =>
    ipcRenderer.invoke("itemRegistry:getAllItems", instancePath),
  itemRegistrySearchItems: (instancePath: string, query: string) =>
    ipcRenderer.invoke("itemRegistry:searchItems", instancePath, query),
  itemRegistryGetItemById: (instancePath: string, itemId: string) =>
    ipcRenderer.invoke("itemRegistry:getItemById", instancePath, itemId),
  itemRegistryRebuildCache: (instancePath: string, modsFolder: string) =>
    ipcRenderer.invoke("itemRegistry:rebuildCache", instancePath, modsFolder),

  // Fluid Registry
  fluidRegistryInitialize: (instancePath: string, modsFolder: string) =>
    ipcRenderer.invoke("fluidRegistry:initialize", instancePath, modsFolder),
  fluidRegistryGetAllFluids: (instancePath: string) =>
    ipcRenderer.invoke("fluidRegistry:getAllFluids", instancePath),
  fluidRegistrySearchFluids: (instancePath: string, query: string) =>
    ipcRenderer.invoke("fluidRegistry:searchFluids", instancePath, query),
  fluidRegistryGetFluidById: (instancePath: string, fluidId: string) =>
    ipcRenderer.invoke("fluidRegistry:getFluidById", instancePath, fluidId),
  fluidRegistryRebuildCache: (instancePath: string, modsFolder: string) =>
    ipcRenderer.invoke("fluidRegistry:rebuildCache", instancePath, modsFolder),

  // Recipe Service
  recipeParseFile: (instancePath: string, filePath: string) =>
    ipcRenderer.invoke("recipe:parseFile", instancePath, filePath),
  recipeGetTemplates: (instancePath: string) =>
    ipcRenderer.invoke("recipe:getTemplates", instancePath),
  recipeCreate: (instancePath: string, scriptPath: string, recipe: string) =>
    ipcRenderer.invoke("recipe:create", instancePath, scriptPath, recipe),
  recipeDelete: (instancePath: string, scriptPath: string, recipeId: string) =>
    ipcRenderer.invoke("recipe:delete", instancePath, scriptPath, recipeId),
  recipeSearch: (instancePath: string, query: string) =>
    ipcRenderer.invoke("recipe:search", instancePath, query),
});

declare global {
  interface Window {
    electron: {
      openDirectory: () => Promise<string | null>;
    };
    api: {
      readFile: (path: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      writeFile: (path: string, content: string) => Promise<{ success: boolean; error?: string }>;
      readdir: (path: string) => Promise<{ success: boolean; files?: string[]; error?: string }>;
      readdirRecursive: (
        path: string,
        options?: { extensions?: string[]; maxDepth?: number }
      ) => Promise<{
        success: boolean;
        files?: { path: string; relativePath: string }[];
        error?: string;
      }>;
      stat: (path: string) => Promise<{ success: boolean; stats?: any; error?: string }>;
      deleteFile: (path: string) => Promise<{ success: boolean; error?: string }>;
      joinPath: (...paths: string[]) => Promise<string>;
      fileExists: (path: string) => Promise<boolean>;
      listDirectory: (path: string) => Promise<string[]>;
      detectInstance: (
        path: string
      ) => Promise<{ success: boolean; instance?: any; error?: string }>;
      getServerConfigFolder: (instancePath: string) => Promise<string | null>;
      scanMods: (modsFolder: string) => Promise<{ success: boolean; mods?: any[]; error?: string }>;
      extractIcon: (
        jarPath: string,
        iconPath: string
      ) => Promise<{ success: boolean; iconData?: string; error?: string }>;
      getAppPath: (name: string) => Promise<{ success: boolean; path?: string; error?: string }>;
      modrinthSearch: (query: string) => Promise<{ success: boolean; mod?: any; error?: string }>;
      modrinthGetProject: (
        idOrSlug: string
      ) => Promise<{ success: boolean; project?: any; error?: string }>;
      listBackups: (instancePath: string) => Promise<any[]>;
      createBackup: (
        instancePath: string,
        name?: string
      ) => Promise<{ success: boolean; error?: string }>;
      restoreBackup: (
        instancePath: string,
        backupId: string
      ) => Promise<{ success: boolean; error?: string }>;
      deleteBackup: (
        instancePath: string,
        backupId: string
      ) => Promise<{ success: boolean; error?: string }>;
      renameBackup: (
        instancePath: string,
        backupId: string,
        newName: string
      ) => Promise<{ success: boolean; error?: string }>;
      openInEditor: (
        filePath: string,
        editorCommand?: string
      ) => Promise<{ success: boolean; error?: string }>;
      clearApiCache: () => Promise<void>;
      discordSetEnabled: (enabled: boolean) => Promise<{ success: boolean; error?: string }>;
      discordSetInstance: (instanceName: string) => Promise<{ success: boolean; error?: string }>;
      discordSetMod: (
        modName: string,
        modCount: number,
        configFileName?: string
      ) => Promise<{ success: boolean; error?: string }>;
      discordClearMod: () => Promise<{ success: boolean; error?: string }>;
      discordClearInstance: () => Promise<{ success: boolean; error?: string }>;

      // Game Launcher APIs removed due to Java compatibility issues
      // TODO: Re-implement in future when stable solution is found

      checkForUpdates: () => Promise<{ success: boolean; updateInfo?: UpdateInfo; error?: string }>;
      downloadUpdate: () => Promise<{ success: boolean; error?: string }>;
      installUpdate: () => Promise<{ success: boolean; error?: string }>;
      onUpdateAvailable: (callback: (updateInfo: UpdateInfo) => void) => void;
      onUpdateDownloadProgress: (
        callback: (progress: { percent: number; transferred: number; total: number }) => void
      ) => void;
      onUpdateDownloaded: (callback: () => void) => void;
      openExternal: (url: string) => Promise<{ success: boolean; error?: string }>;
      getAppVersion: () => Promise<string>;
      detectLauncher: (instancePath: string) => Promise<{
        success: boolean;
        launcher: "modrinth" | "curseforge" | "generic" | "packwiz" | "unknown";
      }>;
      migrateAllServerConfigs: (
        instancePath: string
      ) => Promise<{ success: boolean; migratedCount?: number; errors?: string[]; error?: string }>;

      // KubeJS
      kubeJSDetect: (
        instancePath: string
      ) => Promise<{ success: boolean; data?: any; error?: string }>;
      kubeJSGetScriptFiles: (
        instancePath: string
      ) => Promise<{ success: boolean; data?: string[]; error?: string }>;
      kubeJSListScripts: (instancePath: string) => Promise<{
        success: boolean;
        data?: Array<{
          name: string;
          path: string;
          type: "server" | "client" | "startup";
          size: number;
          modified: Date;
        }>;
        error?: string;
      }>;
      kubeJSReadScript: (
        filePath: string
      ) => Promise<{ success: boolean; data?: string; error?: string }>;
      kubeJSWriteScript: (
        filePath: string,
        content: string
      ) => Promise<{ success: boolean; error?: string }>;
      kubeJSCreateScript: (
        instancePath: string,
        relativePath: string,
        content: string
      ) => Promise<{ success: boolean; data?: string; error?: string }>;
      kubeJSDeleteScript: (filePath: string) => Promise<{ success: boolean; error?: string }>;
      kubeJSSaveRecipe: (
        instancePath: string,
        recipe: any
      ) => Promise<{ success: boolean; error?: string }>;
      kubeJSGetRecipeTemplates: (
        instancePath: string
      ) => Promise<{ success: boolean; data: any[]; error?: string }>;
      kubeJSOrganizeScripts: (
        instancePath: string,
        options?: {
          strategy?: "hybrid" | "flat" | "mod-only" | "type-only";
          kubejsVersion?: "1.19.2" | "1.20.1" | "auto";
          preserveComments?: boolean;
        }
      ) => Promise<{ success: boolean; data?: { backupPath: string }; error?: string }>;
      kubeJSBackupScripts: (instancePath: string) => Promise<{
        success: boolean;
        data?: { backupPath: string; backupName: string };
        error?: string;
      }>;
      kubeJSExportScripts: (
        instancePath: string
      ) => Promise<{ success: boolean; data?: { exportPath: string }; error?: string }>;
      kubeJSImportScripts: (
        instancePath: string
      ) => Promise<{ success: boolean; data?: { imported: boolean }; error?: string }>;
      kubeJSSaveTag: (
        instancePath: string,
        tagData: any
      ) => Promise<{ success: boolean; data?: string; error?: string }>;
      kubeJSLoadTags: (
        instancePath: string
      ) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      kubeJSLookupItem: (
        instancePath: string,
        itemId: string
      ) => Promise<{ success: boolean; data?: any; error?: string }>;
      kubeJSLoadItems: (
        instancePath: string
      ) => Promise<{ success: boolean; data?: any[]; error?: string }>;
      kubeJSGetTagItems: (
        instancePath: string,
        tag: string
      ) => Promise<{ success: boolean; items?: any[]; error?: string }>;
      kubeJSSaveEventHandler: (
        instancePath: string,
        eventHandler: any
      ) => Promise<{ success: boolean; data?: string; error?: string }>;
      kubeJSSaveItemMod: (
        instancePath: string,
        itemMod: any
      ) => Promise<{ success: boolean; data?: string; error?: string }>;
      kubeJSSaveLootTable: (
        instancePath: string,
        lootTable: any
      ) => Promise<{ success: boolean; data?: string; error?: string }>;
      kubeJSSaveWorldgen: (
        instancePath: string,
        worldgen: any
      ) => Promise<{ success: boolean; data?: string; error?: string }>;
      kubeJSSaveDimension: (
        instancePath: string,
        dimension: any
      ) => Promise<{ success: boolean; data?: string; error?: string }>;
      kubeJSValidateScript: (code: string) => Promise<{
        success: boolean;
        data?: {
          isValid: boolean;
          errors: Array<{
            line: number;
            column: number;
            message: string;
            severity: "error" | "warning";
          }>;
        };
        error?: string;
      }>;

      // Item Registry
      itemRegistryInitialize: (
        instancePath: string,
        modsFolder: string
      ) => Promise<{ success: boolean; error?: string }>;
      itemRegistryGetAllItems: (
        instancePath: string
      ) => Promise<{ success: boolean; data: any[]; error?: string }>;
      itemRegistrySearchItems: (
        instancePath: string,
        query: string
      ) => Promise<{ success: boolean; data: any[]; error?: string }>;
      itemRegistryGetItemById: (
        instancePath: string,
        itemId: string
      ) => Promise<{ success: boolean; data: any | null; error?: string }>;
      itemRegistryRebuildCache: (
        instancePath: string,
        modsFolder: string
      ) => Promise<{ success: boolean; error?: string }>;

      // Fluid Registry
      fluidRegistryInitialize: (
        instancePath: string,
        modsFolder: string
      ) => Promise<{ success: boolean; error?: string }>;
      fluidRegistryGetAllFluids: (
        instancePath: string
      ) => Promise<{ success: boolean; data: any[]; error?: string }>;
      fluidRegistrySearchFluids: (
        instancePath: string,
        query: string
      ) => Promise<{ success: boolean; data: any[]; error?: string }>;
      fluidRegistryGetFluidById: (
        instancePath: string,
        fluidId: string
      ) => Promise<{ success: boolean; data: any | null; error?: string }>;
      fluidRegistryRebuildCache: (
        instancePath: string,
        modsFolder: string
      ) => Promise<{ success: boolean; error?: string }>;

      // Recipe Service
      recipeParseFile: (
        instancePath: string,
        filePath: string
      ) => Promise<{ success: boolean; data: any[]; error?: string }>;
      recipeGetTemplates: (
        instancePath: string
      ) => Promise<{ success: boolean; data: any[]; error?: string }>;
      recipeCreate: (
        instancePath: string,
        scriptPath: string,
        recipe: string
      ) => Promise<{ success: boolean; error?: string }>;
      recipeDelete: (
        instancePath: string,
        scriptPath: string,
        recipeId: string
      ) => Promise<{ success: boolean; error?: string }>;
      recipeSearch: (
        instancePath: string,
        query: string
      ) => Promise<{ success: boolean; data: any[]; error?: string }>;
    };
  }
}
