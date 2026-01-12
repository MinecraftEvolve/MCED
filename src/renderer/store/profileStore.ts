import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface ConfigProfile {
  id: string;
  name: string;
  description?: string;
  configs: Record<string, any>;
  createdAt: number;
  modifiedAt: number;
}

interface ProfileStore {
  profiles: ConfigProfile[];
  activeProfileId: string | null;

  addProfile: (
    profile: Omit<ConfigProfile, "id" | "createdAt" | "modifiedAt">,
  ) => void;
  updateProfile: (id: string, updates: Partial<ConfigProfile>) => void;
  deleteProfile: (id: string) => void;
  setActiveProfile: (id: string | null) => void;
  exportProfile: (id: string) => string;
  importProfile: (data: string) => void;
}

export const useProfileStore = create<ProfileStore>()(
  persist(
    (set, get) => ({
      profiles: [],
      activeProfileId: null,

      addProfile: (profile) => {
        const newProfile: ConfigProfile = {
          ...profile,
          id: `profile_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          createdAt: Date.now(),
          modifiedAt: Date.now(),
        };

        set((state) => ({
          profiles: [...state.profiles, newProfile],
        }));
      },

      updateProfile: (id, updates) => {
        set((state) => ({
          profiles: state.profiles.map((p) =>
            p.id === id ? { ...p, ...updates, modifiedAt: Date.now() } : p,
          ),
        }));
      },

      deleteProfile: (id) => {
        set((state) => ({
          profiles: state.profiles.filter((p) => p.id !== id),
          activeProfileId:
            state.activeProfileId === id ? null : state.activeProfileId,
        }));
      },

      setActiveProfile: (id) => {
        set({ activeProfileId: id });
      },

      exportProfile: (id) => {
        const profile = get().profiles.find((p) => p.id === id);
        if (!profile) throw new Error("Profile not found");
        return JSON.stringify(profile, null, 2);
      },

      importProfile: (data) => {
        try {
          const profile = JSON.parse(data);
          const newProfile: ConfigProfile = {
            ...profile,
            id: `profile_${Date.now()}_${Math.random().toString(36).substring(7)}`,
            createdAt: Date.now(),
            modifiedAt: Date.now(),
          };

          set((state) => ({
            profiles: [...state.profiles, newProfile],
          }));
        } catch (error) {
          throw new Error("Invalid profile data");
        }
      },
    }),
    {
      name: "mced-profiles",
    },
  ),
);
