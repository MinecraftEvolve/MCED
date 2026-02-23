import { create } from "zustand";

export interface ModUpdateInfo {
  modId: string;
  currentVersion: string;
  latestVersion: string;
  latestVersionId: string;
  changelog?: string;
  downloadUrl?: string;
  source: "modrinth" | "curseforge";
}

interface UpdateStore {
  updates: Map<string, ModUpdateInfo>;
  isChecking: boolean;
  lastChecked: Date | null;
  setUpdates: (updates: Map<string, ModUpdateInfo>) => void;
  setIsChecking: (v: boolean) => void;
  setLastChecked: (d: Date) => void;
  getUpdate: (modId: string) => ModUpdateInfo | undefined;
  clearUpdates: () => void;
}

export const useUpdateStore = create<UpdateStore>((set, get) => ({
  updates: new Map(),
  isChecking: false,
  lastChecked: null,
  setUpdates: (updates) => set({ updates }),
  setIsChecking: (v) => set({ isChecking: v }),
  setLastChecked: (d) => set({ lastChecked: d }),
  getUpdate: (modId) => get().updates.get(modId),
  clearUpdates: () => set({ updates: new Map() }),
}));
