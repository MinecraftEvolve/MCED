import { app, BrowserWindow, ipcMain, dialog, shell } from "electron";
import path from "path";
import { promises as fs } from "fs";
import { exec } from "child_process";
import { promisify } from "util";
import { JarScanner } from "./jar-scanner";
import { InstanceDetector } from "./instance-detector";
import { discordRPC } from "./DiscordRPC";
import { updateChecker } from "./UpdateChecker";

const execAsync = promisify(exec);

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    title: "Minecraft Config Editor",
    icon: path.join(__dirname, "../../assets/icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    backgroundColor: "#1a1a1a",
    show: false,
  });

  // Remove the menu bar completely
  mainWindow.setMenu(null);

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
  });

  mainWindow.on("closed", () => {
    mainWindow = null;
    discordRPC.disconnect();
  });
};

// IPC Handlers
ipcMain.handle("open-directory", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openDirectory"],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("detect-instance", async (_event, instancePath) => {
  try {
    const detector = new InstanceDetector();
    const instance = await detector.detectInstance(instancePath);

    // Return minimal serializable object
    return {
      success: true,
      instance: {
        path: String(instance.path || ""),
        name: String(instance.name || ""),
        minecraftVersion: String(instance.minecraftVersion || "Unknown"),
        loader: {
          type: String(instance.loader?.type || "vanilla"),
          version: String(instance.loader?.version || "Unknown"),
        },
        modpack: instance.modpack
          ? {
              source: String(instance.modpack.source || "custom"),
              name: String(instance.modpack.name || ""),
              version: String(instance.modpack.version || ""),
              author: instance.modpack.author
                ? String(instance.modpack.author)
                : undefined,
              projectId: instance.modpack.projectId
                ? String(instance.modpack.projectId)
                : undefined,
            }
          : undefined,
        modsFolder: String(instance.modsFolder || ""),
        configFolder: String(instance.configFolder || ""),
        defaultConfigsFolder: instance.defaultConfigsFolder ? String(instance.defaultConfigsFolder) : undefined,
        serverConfigFolder: instance.serverConfigFolder ? String(instance.serverConfigFolder) : undefined,
        totalMods: Number(instance.totalMods || 0),
        lastAccessed: Number(instance.lastAccessed || Date.now()),
      },
    };
  } catch (error) {
    return {
      success: false,
      error: String((error as Error)?.message || "Unknown error"),
    };
  }
});

ipcMain.handle("scan-mods", async (_event, instancePath) => {
  try {
    const scanner = new JarScanner();
    const modsPath = path.join(instancePath, "mods");
    const mods = await scanner.scanModsFolder(modsPath);

    const configPath = path.join(instancePath, "config");
    const defaultConfigsPath = path.join(instancePath, "defaultconfigs");
    
    // Get server config folder (first world's serverconfig)
    let serverConfigPath = null;
    try {
      const savesPath = path.join(instancePath, "saves");
      const saves = await fs.readdir(savesPath);
      if (saves.length > 0) {
        const firstWorld = saves[0];
        const potentialServerConfigPath = path.join(savesPath, firstWorld, "serverconfig");
        try {
          await fs.access(potentialServerConfigPath);
          serverConfigPath = potentialServerConfigPath;
        } catch {}
      }
    } catch {}

    // Helper to check if file matches mod
    const matchesModId = (fileName: string, modId: string): boolean => {
      const baseName = fileName.replace(/\.(toml|json5?|txt)$/, "");
      const patterns = [
        baseName === modId,
        baseName === `${modId}-client`,
        baseName === `${modId}-common`,
        baseName === `${modId}-server`,
        baseName.startsWith(`${modId}-`),
        baseName.startsWith(modId) && /^[_-]/.test(baseName.slice(modId.length)),
      ];
      return patterns.some((match) => match);
    };

    // Scan for config files for each mod
    const serializedMods = await Promise.all(
      mods.map(async (mod) => {
        const configFiles: { path: string; filename: string; format: string }[] = [];
        const modId = String(mod.modId || "");

        // Check main config folder
        try {
          const files = await fs.readdir(configPath);
          for (const file of files) {
            if ((file.endsWith(".toml") || file.endsWith(".json") || file.endsWith(".json5")) && matchesModId(file, modId)) {
              configFiles.push({
                path: path.join(configPath, file),
                filename: file,
                format: file.split(".").pop() || "toml",
              });
            }
          }
        } catch {}

        // Check defaultconfigs folder
        try {
          const files = await fs.readdir(defaultConfigsPath);
          for (const file of files) {
            if ((file.endsWith(".toml") || file.endsWith(".json") || file.endsWith(".json5")) && matchesModId(file, modId)) {
              configFiles.push({
                path: path.join(defaultConfigsPath, file),
                filename: file,
                format: file.split(".").pop() || "toml",
              });
            }
          }
        } catch {}

        // Check serverconfig folder
        if (serverConfigPath) {
          try {
            const files = await fs.readdir(serverConfigPath);
            for (const file of files) {
              const matches = matchesModId(file, modId);
              if ((file.endsWith(".toml") || file.endsWith(".json") || file.endsWith(".json5")) && matches) {
                configFiles.push({
                  path: path.join(serverConfigPath, file),
                  filename: file,
                  format: file.split(".").pop() || "toml",
                });
              }
            }
          } catch (err) {

          }
        }


        return {
          modId,
          name: String(mod.name || ""),
          version: String(mod.version || ""),
          description: mod.description ? String(mod.description) : undefined,
          authors: Array.isArray(mod.authors)
            ? mod.authors.map((a: string | { name: string }) => 
                typeof a === 'string' ? a : String(a))
            : undefined,
          homepage: mod.homepage ? String(mod.homepage) : undefined,
          sources: mod.sources ? String(mod.sources) : undefined,
          license: mod.license ? String(mod.license) : undefined,
          icon: mod.icon ? String(mod.icon) : undefined,
          jarPath: String(mod.jarPath || ""),
          loader: String(mod.loader || "forge"),
          configFiles,
          isFavorite: false,
        };
      })
    );

    return {
      success: true,
      mods: serializedMods,
    };
  } catch (error) {
    return {
      success: false,
      error: (error instanceof Error ? error.message : String(error)),
      mods: [],
    };
  }
});

ipcMain.handle("get-server-config-folder", async (_event, instancePath: string) => {
  try {
    const savesPath = path.join(instancePath, "saves");
    const saves = await fs.readdir(savesPath);
    
    if (saves.length === 0) {
      return null;
    }
    
    // Get the first world's serverconfig folder
    const firstWorld = saves[0];
    const serverConfigPath = path.join(savesPath, firstWorld, "serverconfig");
    
    // Check if serverconfig exists
    try {
      await fs.access(serverConfigPath);
      return serverConfigPath;
    } catch {
      return null;
    }
  } catch (error) {
    console.error("Error getting server config folder:", error);
    return null;
  }
});

ipcMain.handle("instance:migrateAllServerConfigs", async (_event, instancePath: string) => {
  try {
    const savesPath = path.join(instancePath, "saves");
    const defaultConfigsPath = path.join(instancePath, "defaultconfigs");
    
    // Ensure defaultconfigs folder exists
    await fs.mkdir(defaultConfigsPath, { recursive: true });
    
    // Get all worlds
    const saves = await fs.readdir(savesPath);
    
    let migratedCount = 0;
    const errors: string[] = [];
    
    for (const worldName of saves) {
      const serverConfigPath = path.join(savesPath, worldName, "serverconfig");
      
      // Check if serverconfig exists
      try {
        await fs.access(serverConfigPath);
      } catch {
        continue; // No serverconfig in this world
      }
      
      // Read all files in serverconfig
      const configFiles = await fs.readdir(serverConfigPath);
      
      for (const fileName of configFiles) {
        const sourcePath = path.join(serverConfigPath, fileName);
        const destPath = path.join(defaultConfigsPath, fileName);
        
        // Check if it's a file
        const stats = await fs.stat(sourcePath);
        if (!stats.isFile()) continue;
        
        try {
          // Copy file to defaultconfigs
          await fs.copyFile(sourcePath, destPath);
          
          // Delete original file
          await fs.unlink(sourcePath);
          
          migratedCount++;
        } catch (error) {
          errors.push(`Failed to migrate ${fileName}: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
    }
    
    return { 
      success: true, 
      migratedCount,
      errors: errors.length > 0 ? errors : undefined
    };
  } catch (error) {
    console.error("Error migrating server configs:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : String(error)
    };
  }
});

ipcMain.handle("read-config", async (_event, configPath: string) => {
  try {
    const content = await fs.readFile(configPath, "utf-8");
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle(
  "write-config",
  async (_event, configPath: string, content: string) => {
    try {
      await fs.writeFile(configPath, content, "utf-8");
      return { success: true };
    } catch (error) {
      return { success: false, error: (error instanceof Error ? error.message : String(error)) };
    }
  },
);

app.whenReady().then(() => {
  createWindow();
  discordRPC.initialize();
  
  // Initialize auto-updater
  if (mainWindow) {
    updateChecker.initialize(mainWindow);
    // Check for updates on startup
    updateChecker.checkForUpdates();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  discordRPC.disconnect();
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle("dialog:openDirectory", async () => {
  if (!mainWindow) return null;

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ["openDirectory"],
    title: "Select Minecraft Instance Folder",
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle("fs:readFile", async (_event, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, "utf-8");
    return { success: true, content };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle(
  "fs:writeFile",
  async (_event, filePath: string, content: string) => {
    try {
      await fs.writeFile(filePath, content, "utf-8");
      return { success: true };
    } catch (error) {
      return { success: false, error: (error instanceof Error ? error.message : String(error)) };
    }
  },
);

ipcMain.handle("fs:readdir", async (_event, dirPath: string) => {
  try {
    const files = await fs.readdir(dirPath);
    return { success: true, files };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

// Recursive directory reader for config files
ipcMain.handle("fs:readdirRecursive", async (_event, dirPath: string, options?: { extensions?: string[], maxDepth?: number }) => {
  const extensions = options?.extensions || ['.toml', '.json', '.json5', '.yml', '.yaml', '.cfg', '.properties'];
  const maxDepth = options?.maxDepth || 5;
  
  const files: { path: string, relativePath: string }[] = [];
  
  async function scan(currentPath: string, depth: number, relativePath: string = '') {
    if (depth > maxDepth) return;
    
    try {
      const entries = await fs.readdir(currentPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(currentPath, entry.name);
        const relPath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
        
        if (entry.isDirectory()) {
          // Recursively scan subdirectories
          await scan(fullPath, depth + 1, relPath);
        } else if (entry.isFile()) {
          // Check if file has one of the target extensions
          const hasValidExtension = extensions.some(ext => entry.name.toLowerCase().endsWith(ext));
          if (hasValidExtension) {
            files.push({
              path: fullPath,
              relativePath: relPath
            });
          }
        }
      }
    } catch (error) {
      // Skip directories we can't read
      console.error(`Error scanning ${currentPath}:`, error);
    }
  }
  
  try {
    await scan(dirPath, 0);
    return { success: true, files };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)), files: [] };
  }
});

ipcMain.handle("fs:stat", async (_event, filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return {
      success: true,
      stats: {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        mtime: stats.mtime.getTime(), // Convert Date to timestamp
      },
    };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle("fs:deleteFile", async (_event, filePath: string) => {
  try {
    await fs.unlink(filePath);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle("instance:detect", async (_event, instancePath: string) => {
  try {
    const detector = new InstanceDetector();
    const instance = await detector.detectInstance(instancePath);

    // Create completely new plain object with strict serialization
    const plainInstance = {
      path: String(instance.path || ""),
      name: String(instance.name || ""),
      minecraftVersion: String(instance.minecraftVersion || "Unknown"),
      loader: {
        type: String(instance.loader?.type || "vanilla"),
        version: String(instance.loader?.version || "Unknown"),
      },
      modpack: instance.modpack
        ? {
            source: String(instance.modpack.source || "custom"),
            name: String(instance.modpack.name || ""),
            version: String(instance.modpack.version || ""),
            author: instance.modpack.author
              ? String(instance.modpack.author)
              : undefined,
            projectId: instance.modpack.projectId
              ? String(instance.modpack.projectId)
              : undefined,
          }
        : undefined,
      modsFolder: String(instance.modsFolder || ""),
      configFolder: String(instance.configFolder || ""),
      defaultConfigsFolder: String(instance.defaultConfigsFolder || ""),
      serverConfigFolder: String(instance.serverConfigFolder || ""),
      totalMods: Number(instance.totalMods || 0),
      lastAccessed: Number(instance.lastAccessed || Date.now()),
    };

    // Test serialization before returning
    try {
      JSON.stringify(plainInstance);
    } catch (e) {
      throw new Error("Instance data contains non-serializable objects");
    }

    return { success: true, instance: plainInstance };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
});

ipcMain.handle("mods:scan", async (_event, modsFolder: string) => {
  try {
    const scanner = new JarScanner();
    const mods = await scanner.scanModsFolder(modsFolder);

    // Create minimal objects with strict type checking
    const serializedMods = mods.map((mod) => {
      // Extract only safe, serializable properties
      const safeMod = {
        modId: String(mod.modId || ""),
        name: String(mod.name || ""),
        version: String(mod.version || ""),
        description: mod.description ? String(mod.description) : undefined,
        authors: Array.isArray(mod.authors)
          ? mod.authors.map((a: string | { name: string }) => 
              typeof a === 'string' ? a : String(a))
          : undefined,
        homepage: mod.homepage ? String(mod.homepage) : undefined,
        sources: mod.sources ? String(mod.sources) : undefined,
        license: mod.license ? String(mod.license) : undefined,
        icon:
          mod.icon && typeof mod.icon === "string"
            ? String(mod.icon)
            : undefined,
        jarPath: String(mod.jarPath || ""),
        loader: String(mod.loader || "forge"),
        configFiles: [],
        isFavorite: false,
      };

      // Test JSON serialization
      try {
        JSON.stringify(safeMod);
        return safeMod;
      } catch (e) {
        return {
          modId: String(mod.modId || ""),
          name: String(mod.name || ""),
          version: String(mod.version || ""),
          jarPath: String(mod.jarPath || ""),
          loader: "forge",
          configFiles: [],
          isFavorite: false,
        };
      }
    });

    return { success: true, mods: serializedMods };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      mods: [],
    };
  }
});

ipcMain.handle(
  "jar:extractIcon",
  async (_event, jarPath: string, iconPath: string) => {
    try {
      const scanner = new JarScanner();
      const iconData = await scanner.extractIcon(jarPath, iconPath);
      return { success: true, iconData };
    } catch (error) {
      return { success: false, error: (error instanceof Error ? error.message : String(error)) };
    }
  },
);

ipcMain.handle("app:getPath", async (_event, name: string) => {
  try {
    const appPath = app.getPath(name as any);
    return { success: true, path: appPath };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle("app:getVersion", async () => {
  return app.getVersion();
});

interface ModrinthSearchResult {
  hits: Array<{
    project_id: string;
    slug: string;
    title: string;
    description: string;
    icon_url?: string;
    downloads: number;
    follows: number;
    categories?: string[];
    versions?: string[];
    date_created: string;
    date_modified: string;
    license?: { name: string };
  }>;
}

interface ModrinthProject {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_url?: string;
  downloads: number;
  followers: number;
  categories?: string[];
  versions?: string[];
  published: string;
  updated: string;
  license?: { name: string };
  source_url?: string;
  wiki_url?: string;
  issues_url?: string;
  discord_url?: string;
}

ipcMain.handle("modrinth:search", async (_event, query: string) => {
  try {
    const response = await fetch(
      `https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&limit=1`,
    );
    if (!response.ok) {
      return { success: false, error: `Search failed: ${response.status}` };
    }
    const data = await response.json() as ModrinthSearchResult;
    if (data.hits && data.hits.length > 0) {
      return { success: true, mod: data.hits[0] };
    }
    return { success: false, error: "No results" };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
});

ipcMain.handle("modrinth:getProject", async (_event, idOrSlug: string) => {
  try {
    const response = await fetch(
      `https://api.modrinth.com/v2/project/${idOrSlug}`,
    );
    if (!response.ok) {
      return { success: false, error: `Project not found: ${response.status}` };
    }
    const data = await response.json() as ModrinthProject;
    // Return only serializable data
    return { success: true, project: JSON.parse(JSON.stringify(data)) };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
});

// Backup management
ipcMain.handle("backup:list", async (_event, instancePath: string) => {
  try {
    const backupDir = path.join(instancePath, ".mced-backups");

    try {
      await fs.access(backupDir);
    } catch {
      return [];
    }

    const files = await fs.readdir(backupDir);
    const backups = [];

    for (const file of files) {
      if (file.endsWith(".zip")) {
        const filePath = path.join(backupDir, file);
        const stats = await fs.stat(filePath);
        const match = file.match(/backup-(\d+)-(.+)\.zip/);

        if (match) {
          backups.push({
            id: file,
            timestamp: parseInt(match[1]),
            name: match[2].replace(/-/g, " "),
            size: stats.size,
            configCount: 0, // Will be calculated if needed
          });
        }
      }
    }

    return backups.sort((a, b) => b.timestamp - a.timestamp);
  } catch (error) {
    return [];
  }
});

ipcMain.handle("backup:create", async (_event, instancePath: string) => {
  try {
    const AdmZip = require("adm-zip");
    const zip = new AdmZip();

    const configDir = path.join(instancePath, "config");
    const backupDir = path.join(instancePath, ".mced-backups");

    await fs.mkdir(backupDir, { recursive: true });

    const timestamp = Date.now();
    const name = `Backup-${new Date(timestamp).toISOString().split("T")[0]}`;
    const backupFile = path.join(
      backupDir,
      `backup-${timestamp}-${name.replace(/ /g, "-")}.zip`,
    );

    zip.addLocalFolder(configDir);
    zip.writeZip(backupFile);

    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle("clear-api-cache", async () => {
  try {
    const cacheDir = path.join(app.getPath("userData"), "api-cache");
    await fs.rm(cacheDir, { recursive: true, force: true });
    await fs.mkdir(cacheDir, { recursive: true });
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle(
  "backup:restore",
  async (_event, instancePath: string, backupId: string) => {
    try {
      const AdmZip = require("adm-zip");
      const backupFile = path.join(instancePath, ".mced-backups", backupId);
      const configDir = path.join(instancePath, "config");

      const zip = new AdmZip(backupFile);
      zip.extractAllTo(configDir, true);

      return { success: true };
    } catch (error) {
      return { success: false, error: (error instanceof Error ? error.message : String(error)) };
    }
  },
);

ipcMain.handle("load-config-profile", async (_event, profileId: string) => {
  try {
    const profilesPath = path.join(app.getPath("userData"), "profiles.json");
    const profilesData = await fs.readFile(profilesPath, "utf-8");
    const profiles = JSON.parse(profilesData);
    const profile = profiles.find((p: { id: string }) => p.id === profileId);

    if (!profile) {
      throw new Error("Profile not found");
    }

    // Apply profile configs
    for (const [configPath, configData] of Object.entries(profile.configs)) {
      await fs.writeFile(configPath, JSON.stringify(configData, null, 2));
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle(
  "backup:delete",
  async (_event, instancePath: string, backupId: string) => {
    try {
      const backupFile = path.join(instancePath, ".mced-backups", backupId);
      await fs.unlink(backupFile);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error instanceof Error ? error.message : String(error)) };
    }
  },
);

// Open file in external editor
ipcMain.handle(
  "open-in-editor",
  async (_event, filePath: string, editorCommand?: string) => {
    try {
      if (editorCommand) {
        // Use custom editor command
        await execAsync(` ""`);
      } else {
        // Try to open with default editor or VS Code
        const editors = [
          "code",
          "code-insiders",
          "cursor",
          "subl",
          "atom",
          "notepad++",
        ];
        let opened = false;

        for (const editor of editors) {
          try {
            await execAsync(` ""`);
            opened = true;
            break;
          } catch {
            continue;
          }
        }

        if (!opened) {
          // Fallback to system default
          await shell.openPath(filePath);
        }
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: (error instanceof Error ? error.message : String(error)) };
    }
  },
);

// Discord RPC Handlers
ipcMain.handle("discord:set-enabled", async (_event, enabled: boolean) => {
  try {
    discordRPC.setEnabled(enabled);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle("discord:set-instance", async (_event, instanceName: string) => {
  try {
    discordRPC.setInstanceName(instanceName);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle("discord:set-mod", async (_event, modName: string, modCount: number, configFileName?: string) => {
  try {
    discordRPC.setModInfo(modName, modCount, configFileName);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle("discord:clear-mod", async () => {
  try {
    discordRPC.clearModInfo();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle("discord:clear-instance", async () => {
  try {
    discordRPC.clearInstance();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

// External Links
ipcMain.handle("shell:openExternal", async (_event, url: string) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

// Update Checker Handler
ipcMain.handle("check-for-updates", async () => {
  try {
    const updateInfo = await updateChecker.checkForUpdates();
    return { success: true, updateInfo };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle("download-update", async () => {
  try {
    await updateChecker.downloadUpdate();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});

ipcMain.handle("install-update", async () => {
  try {
    updateChecker.quitAndInstall();
    return { success: true };
  } catch (error) {
    return { success: false, error: (error instanceof Error ? error.message : String(error)) };
  }
});
