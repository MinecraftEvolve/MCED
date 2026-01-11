import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'path';
import { promises as fs } from 'fs';
import { JarScanner } from './jar-scanner';
import { InstanceDetector } from './instance-detector';

let mainWindow: BrowserWindow | null = null;

const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1000,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    frame: true,
    titleBarStyle: 'default',
    backgroundColor: '#1a1a1a',
    show: false,
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC Handlers
ipcMain.handle('dialog:openDirectory', async () => {
  if (!mainWindow) return null;
  
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Minecraft Instance Folder',
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
});

ipcMain.handle('fs:readFile', async (_event, filePath: string) => {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, content };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:writeFile', async (_event, filePath: string, content: string) => {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:readdir', async (_event, dirPath: string) => {
  try {
    const files = await fs.readdir(dirPath);
    return { success: true, files };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('fs:stat', async (_event, filePath: string) => {
  try {
    const stats = await fs.stat(filePath);
    return { 
      success: true, 
      stats: {
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        size: stats.size,
        mtime: stats.mtime,
      }
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('instance:detect', async (_event, instancePath: string) => {
  try {
    const detector = new InstanceDetector();
    const instance = await detector.detectInstance(instancePath);
    return { success: true, instance };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('mods:scan', async (_event, modsFolder: string) => {
  try {
    const scanner = new JarScanner();
    const mods = await scanner.scanModsFolder(modsFolder);
    return { success: true, mods };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('jar:extractIcon', async (_event, jarPath: string, iconPath: string) => {
  try {
    const scanner = new JarScanner();
    const iconData = await scanner.extractIcon(jarPath, iconPath);
    return { success: true, iconData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('app:getPath', async (_event, name: string) => {
  try {
    const appPath = app.getPath(name as any);
    return { success: true, path: appPath };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('launch:minecraft', async (_event, instancePath: string, launcherType: string) => {
  try {
    const { exec, spawn } = require('child_process');
    const path = require('path');
    const os = require('os');
    
    const instanceName = path.basename(instancePath);
    
    // Detect Modrinth launcher
    if (instancePath.includes('ModrinthApp')) {
      // Open the Modrinth App directly - let user launch from there
      // The Modrinth protocol doesn't support direct profile launching reliably
      
      console.log('Opening Modrinth App...');
      
      try {
        return new Promise((resolve, reject) => {
          const modrinthUrl = 'modrinth://';
          
          if (process.platform === 'win32') {
            // Try to launch the Modrinth App executable directly
            const modrinthExe = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'ModrinthApp', 'Modrinth App.exe');
            
            // First try to launch the executable
            exec(`"${modrinthExe}"`, (error: any) => {
              if (error) {
                // Fallback to protocol
                exec(`start "" "${modrinthUrl}"`, (error2: any) => {
                  if (error2) {
                    resolve({ success: false, error: 'Could not open Modrinth App. Please launch manually.' });
                  } else {
                    resolve({ success: true, message: 'Modrinth App opened. Please launch your profile from there.' });
                  }
                });
              } else {
                resolve({ success: true, message: 'Modrinth App opened. Please launch your profile from there.' });
              }
            });
          } else if (process.platform === 'darwin') {
            exec(`open -a "Modrinth App"`, (error: any) => {
              if (error) {
                resolve({ success: false, error: 'Could not open Modrinth App. Please launch manually.' });
              } else {
                resolve({ success: true, message: 'Modrinth App opened. Please launch your profile from there.' });
              }
            });
          } else {
            exec(`xdg-open "${modrinthUrl}"`, (error: any) => {
              if (error) {
                resolve({ success: false, error: 'Could not open Modrinth App. Please launch manually.' });
              } else {
                resolve({ success: true, message: 'Modrinth App opened. Please launch your profile from there.' });
              }
            });
          }
        });
      } catch (err) {
        console.error('Modrinth launch error:', err);
        return { success: false, error: 'Could not open Modrinth App. Please launch manually.' };
      }
    }
    
    // MultiMC/Prism Launcher
    if (launcherType === 'multimc' || launcherType === 'prism') {
      const basePath = instancePath.split('instances')[0];
      let exe = '';
      
      if (process.platform === 'win32') {
        exe = launcherType === 'prism' 
          ? path.join(basePath, 'prismlauncher.exe')
          : path.join(basePath, 'MultiMC.exe');
      } else if (process.platform === 'darwin') {
        exe = launcherType === 'prism'
          ? '/Applications/Prism Launcher.app/Contents/MacOS/prismlauncher'
          : '/Applications/MultiMC.app/Contents/MacOS/MultiMC';
      } else {
        exe = launcherType === 'prism' ? 'prismlauncher' : 'multimc';
      }
      
      spawn(exe, ['-l', instanceName], {
        detached: true,
        stdio: 'ignore'
      });
      
      return { success: true };
    }
    
    // CurseForge
    if (launcherType === 'curseforge') {
      if (process.platform === 'win32') {
        exec(`start curseforge://launch/${instanceName}`);
      }
      return { success: true };
    }
    
    return { success: false, error: 'Unsupported launcher type' };
  } catch (error: any) {
    console.error('Launch error:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('modrinth:search', async (_event, query: string) => {
  try {
    const response = await fetch(`https://api.modrinth.com/v2/search?query=${encodeURIComponent(query)}&limit=1`);
    if (!response.ok) {
      return { success: false, error: 'Search failed' };
    }
    const data: any = await response.json();
    if (data.hits && data.hits.length > 0) {
      return { success: true, mod: data.hits[0] };
    }
    return { success: false, error: 'No results' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('modrinth:getProject', async (_event, idOrSlug: string) => {
  try {
    const response = await fetch(`https://api.modrinth.com/v2/project/${idOrSlug}`);
    if (!response.ok) {
      return { success: false, error: 'Project not found' };
    }
    const data = await response.json();
    return { success: true, project: data };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

