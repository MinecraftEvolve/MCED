import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface AppSettings {
  // Appearance
  theme: "dark" | "light" | "auto";
  compactMode: boolean;
  accentColor: string;

  // Behavior
  autoSave: boolean;
  createBackupBeforeSave: boolean;
  showAdvancedOptions: boolean;

  // API Integration
  curseForgeApiKey?: string;
  cacheDuration: number; // in hours

  // Editor
  showLineNumbers: boolean;
  enableValidation: boolean;

  // Recent Instances
  recentInstances: string[];
  maxRecentInstances: number;

  // Mod List
  modsWithoutConfigsAtEnd: boolean;

  // Discord Rich Presence
  discordRpcEnabled: boolean;
}

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  addRecentInstance: (path: string) => void;
  clearRecentInstances: () => void;
  resetSettings: () => void;
}

const defaultSettings: AppSettings = {
  theme: "dark",
  compactMode: false,
  accentColor: "#3b82f6",
  autoSave: false,
  createBackupBeforeSave: true,
  showAdvancedOptions: false,
  cacheDuration: 24,
  showLineNumbers: true,
  enableValidation: true,
  recentInstances: [],
  maxRecentInstances: 10,
  modsWithoutConfigsAtEnd: true,
  discordRpcEnabled: true,
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,

      updateSettings: (updates) => {
        set((state) => ({
          settings: { ...state.settings, ...updates },
        }));

        // Apply theme
        if (updates.theme !== undefined) {
          applyTheme(updates.theme);
        }

        // Apply compact mode
        if (updates.compactMode !== undefined) {
          document.body.classList.toggle("compact-mode", updates.compactMode);
        }

        // Apply Discord RPC enabled/disabled
        if (updates.discordRpcEnabled !== undefined) {
          window.api?.discordSetEnabled?.(updates.discordRpcEnabled);
        }
      },

      addRecentInstance: (path) => {
        set((state) => {
          const recent = [path, ...state.settings.recentInstances.filter((p) => p !== path)];
          const trimmed = recent.slice(0, state.settings.maxRecentInstances);

          return {
            settings: {
              ...state.settings,
              recentInstances: trimmed,
            },
          };
        });
      },

      clearRecentInstances: () => {
        set((state) => ({
          settings: {
            ...state.settings,
            recentInstances: [],
          },
        }));
      },

      resetSettings: () => {
        set({ settings: defaultSettings });
        applyTheme(defaultSettings.theme);
        document.body.classList.toggle("compact-mode", defaultSettings.compactMode);
      },
    }),
    {
      name: "mced-settings",
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Apply settings on load
          applyTheme(state.settings.theme);
          document.body.classList.toggle("compact-mode", state.settings.compactMode);

          // Ensure discordRpcEnabled has a default value
          if (state.settings.discordRpcEnabled === undefined) {
            state.settings.discordRpcEnabled = true;
          }

          // Initialize Discord RPC state
          window.api?.discordSetEnabled?.(state.settings.discordRpcEnabled);
        }
      },
    }
  )
);

function applyTheme(theme: "dark" | "light" | "auto") {
  if (theme === "auto") {
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.setAttribute("data-theme", prefersDark ? "dark" : "light");
  } else {
    document.documentElement.setAttribute("data-theme", theme);
  }
}

// Listen for system theme changes when in auto mode
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  const settings = useSettingsStore.getState().settings;
  if (settings.theme === "auto") {
    document.documentElement.setAttribute("data-theme", e.matches ? "dark" : "light");
  }
});
