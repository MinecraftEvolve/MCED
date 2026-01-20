import { create } from "zustand";
import { MinecraftInstance, RecentInstance } from "../shared/types/instance.types";
import { ModInfo } from "../shared/types/mod.types";
import { ConfigFile } from "../shared/types/config.types";

interface AppSettings {
  theme: "dark" | "light";
  accentColor: string;
  autoSave: boolean;
  backupBeforeSave: boolean;
  showTooltips: boolean;
  compactView: boolean;
  showAnimations: boolean;
  autoBackup: boolean;
  cacheDuration: number;
  apiRateLimit: number;
}

interface AppState {
  // Instance
  currentInstance: MinecraftInstance | null;
  setCurrentInstance: (instance: MinecraftInstance | null) => void;
  launcherType: "modrinth" | "curseforge" | "generic" | "packwiz" | "unknown" | null;
  setLauncherType: (
    type: "modrinth" | "curseforge" | "generic" | "packwiz" | "unknown" | null
  ) => void;

  // Mods
  mods: ModInfo[];
  setMods: (mods: ModInfo[]) => void;
  selectedMod: ModInfo | null;
  setSelectedMod: (mod: ModInfo | null) => void;

  // Configs
  configFiles: ConfigFile[];
  setConfigFiles: (files: ConfigFile[]) => void;

  // KubeJS
  viewMode: "mods" | "kubejs";
  setViewMode: (mode: "mods" | "kubejs") => void;
  kubeJSDetected: boolean;
  setKubeJSDetected: (detected: boolean) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

  // Settings
  settings: AppSettings;
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Recent Instances
  recentInstances: RecentInstance[];
  addRecentInstance: (instance: string | RecentInstance) => void;

  // Filters
  showOnlyConfigured: boolean;
  setShowOnlyConfigured: (show: boolean) => void;
  showOnlyFavorites: boolean;
  setShowOnlyFavorites: (show: boolean) => void;

  // Save state
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  saveConfigs: () => Promise<void>;
  discardChanges: () => void;

  // Reload mods
  reloadMods: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Instance
  currentInstance: null,
  setCurrentInstance: (instance) => set({ currentInstance: instance }),
  launcherType: null,
  setLauncherType: (type) => set({ launcherType: type }),

  // Mods
  mods: [],
  setMods: (mods) => set({ mods }),
  selectedMod: null,
  setSelectedMod: (mod) => {
    set({ selectedMod: mod });

    // Update Discord RPC when a mod is selected
    if (mod) {
      const totalMods = get().mods.length;
      window.api?.discordSetMod?.(`Configuring ${mod.name}`, totalMods);
    } else {
      // No mod selected, show total count
      const totalMods = get().mods.length;
      window.api?.discordSetMod?.(`${totalMods} mods installed`, totalMods);
    }
  },

  // Configs
  configFiles: [],
  setConfigFiles: (files) => set({ configFiles: files }),

  // KubeJS
  viewMode: "mods",
  setViewMode: (mode) => set({ viewMode: mode }),
  kubeJSDetected: false,
  setKubeJSDetected: (detected) => set({ kubeJSDetected: detected }),

  // UI State
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  isDarkMode: true,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // Settings
  settings: {
    theme: "dark",
    accentColor: "#3b82f6",
    autoSave: false,
    backupBeforeSave: true,
    showTooltips: true,
    compactView: false,
    showAnimations: true,
    autoBackup: false,
    cacheDuration: 3600,
    apiRateLimit: 10,
  },
  updateSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  // Recent Instances - migrate old string format to new object format
  recentInstances: (() => {
    const stored = JSON.parse(localStorage.getItem("recentInstances") || "[]");
    const migrated = stored.map((inst: any) =>
      typeof inst === "string"
        ? { path: inst, name: inst.split(/[/\\]/).pop() || "Unknown", lastOpened: Date.now() }
        : inst
    );
    // Save migrated format back
    if (migrated.length > 0) {
      localStorage.setItem("recentInstances", JSON.stringify(migrated));
    }
    return migrated;
  })(),
  addRecentInstance: (instance) =>
    set((state) => {
      const instanceObj: RecentInstance =
        typeof instance === "string"
          ? {
              path: instance,
              name: instance.split(/[/\\]/).pop() || "Unknown",
              lastOpened: Date.now(),
            }
          : { ...instance, lastOpened: Date.now() };

      console.log("[Store] Adding recent instance:", instanceObj);

      const updated = [
        instanceObj,
        ...state.recentInstances.filter((inst) => inst.path !== instanceObj.path),
      ].slice(0, 5);

      console.log("[Store] Updated recent instances:", updated);
      localStorage.setItem("recentInstances", JSON.stringify(updated));
      return { recentInstances: updated };
    }),

  // Filters
  showOnlyConfigured: false,
  setShowOnlyConfigured: (show) => set({ showOnlyConfigured: show }),
  showOnlyFavorites: false,
  setShowOnlyFavorites: (show) => set({ showOnlyFavorites: show }),

  // Save state
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),

  saveConfigs: async () => {
    const state = get();
    if (!state.hasUnsavedChanges || !state.selectedMod) return;

    try {
      // Save via IPC will be handled by StatusBar component
      // This is just a placeholder for the hook
    } catch (error) {}
  },

  discardChanges: () => {
    // Discard will be handled by StatusBar component
    // This is just a placeholder for the hook
  },

  reloadMods: async () => {
    // This will be set by App.tsx
  },
}));
