import { create } from 'zustand';
import { MinecraftInstance } from '../shared/types/instance.types';
import { ModInfo } from '../shared/types/mod.types';
import { ConfigFile } from '../shared/types/config.types';

interface AppState {
  // Instance
  currentInstance: MinecraftInstance | null;
  setCurrentInstance: (instance: MinecraftInstance | null) => void;

  // Mods
  mods: ModInfo[];
  setMods: (mods: ModInfo[]) => void;
  selectedMod: ModInfo | null;
  setSelectedMod: (mod: ModInfo | null) => void;

  // Configs
  configFiles: ConfigFile[];
  setConfigFiles: (files: ConfigFile[]) => void;

  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;

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
}

export const useAppStore = create<AppState>((set) => ({
  // Instance
  currentInstance: null,
  setCurrentInstance: (instance) => set({ currentInstance: instance }),

  // Mods
  mods: [],
  setMods: (mods) => set({ mods }),
  selectedMod: null,
  setSelectedMod: (mod) => set({ selectedMod: mod }),

  // Configs
  configFiles: [],
  setConfigFiles: (files) => set({ configFiles: files }),

  // UI State
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
  isDarkMode: true,
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),

  // Filters
  showOnlyConfigured: false,
  setShowOnlyConfigured: (show) => set({ showOnlyConfigured: show }),
  showOnlyFavorites: false,
  setShowOnlyFavorites: (show) => set({ showOnlyFavorites: show }),

  // Save state
  hasUnsavedChanges: false,
  setHasUnsavedChanges: (hasChanges) => set({ hasUnsavedChanges: hasChanges }),
  
  saveConfigs: async () => {
    const state = useAppStore.getState();
    if (!state.hasUnsavedChanges || !state.selectedMod) return;
    
    try {
      // Save via IPC will be handled by StatusBar component
      // This is just a placeholder for the hook
      console.log('Saving configs...');
    } catch (error) {
      console.error('Failed to save configs:', error);
    }
  },
  
  discardChanges: () => {
    // Discard will be handled by StatusBar component
    // This is just a placeholder for the hook
    console.log('Discarding changes...');
  },
}));
