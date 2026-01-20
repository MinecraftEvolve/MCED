import { create } from "zustand";
import { persist } from "zustand/middleware";

interface ConfigChange {
  key: string;
  originalValue: unknown;
  currentValue: unknown;
  isModified: boolean;
  modifiedAt?: Date;
}

interface ChangeTrackingState {
  changes: Map<string, ConfigChange>;
  trackChange: (
    modId: string,
    settingKey: string,
    originalValue: unknown,
    currentValue: unknown
  ) => void;
  resetToDefault: (modId: string, settingKey: string) => unknown | null;
  isModified: (modId: string, settingKey: string) => boolean;
  getOriginalValue: (modId: string, settingKey: string) => unknown | null;
  clearChanges: () => void;
  getModifiedCount: () => number;
}

export const useChangeTrackingStore = create<ChangeTrackingState>()(
  persist(
    (set, get) => ({
      changes: new Map(),

      trackChange: (
        modId: string,
        settingKey: string,
        originalValue: unknown,
        currentValue: unknown
      ) => {
        const key = `${modId}:${settingKey}`;
        const isModified = JSON.stringify(originalValue) !== JSON.stringify(currentValue);

        set((state) => {
          const newChanges = new Map(state.changes);
          newChanges.set(key, {
            key,
            originalValue,
            currentValue,
            isModified,
            modifiedAt: isModified ? new Date() : undefined,
          });
          return { changes: newChanges };
        });
      },

      resetToDefault: (modId: string, settingKey: string) => {
        const key = `${modId}:${settingKey}`;
        const change = get().changes.get(key);

        if (change) {
          set((state) => {
            const newChanges = new Map(state.changes);
            newChanges.delete(key);
            return { changes: newChanges };
          });
          return change.originalValue;
        }
        return null;
      },

      isModified: (modId: string, settingKey: string) => {
        const key = `${modId}:${settingKey}`;
        return get().changes.get(key)?.isModified || false;
      },

      getOriginalValue: (modId: string, settingKey: string) => {
        const key = `${modId}:${settingKey}`;
        return get().changes.get(key)?.originalValue || null;
      },

      clearChanges: () => {
        set({ changes: new Map() });
      },

      getModifiedCount: () => {
        let count = 0;
        get().changes.forEach((change) => {
          if (change.isModified) count++;
        });
        return count;
      },
    }),
    {
      name: "mced-change-tracking",
      // Custom storage to handle Map serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              changes: new Map(Object.entries(state.changes || {})),
            },
          };
        },
        setItem: (name, value) => {
          const changes = Object.fromEntries(value.state.changes);
          localStorage.setItem(
            name,
            JSON.stringify({
              state: {
                ...value.state,
                changes,
              },
            })
          );
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
