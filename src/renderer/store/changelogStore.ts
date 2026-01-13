import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ChangeLogEntry {
  id: string;
  timestamp: Date;
  sessionId: string;
  modId: string;
  modName: string;
  settingKey: string;
  configFile: string;
  oldValue: unknown;
  newValue: unknown;
  valueType: string;
}

interface ChangelogState {
  entries: ChangeLogEntry[];
  currentSessionId: string | null;
  
  // Actions
  logChange: (
    modId: string,
    modName: string,
    settingKey: string,
    configFile: string,
    oldValue: unknown,
    newValue: unknown,
    valueType: string
  ) => void;
  startSession: (sessionId: string) => void;
  getSessionChanges: (sessionId: string) => ChangeLogEntry[];
  getAllSessions: () => string[];
  getChangesByMod: (modId: string) => ChangeLogEntry[];
  getRecentChanges: (limit?: number) => ChangeLogEntry[];
  undoSession: (sessionId: string) => ChangeLogEntry[];
  exportChangelog: () => string;
  clearChangelog: () => void;
}

const MAX_ENTRIES = 1000; // Keep last 1000 changes

export const useChangelogStore = create<ChangelogState>()(
  persist(
    (set, get) => ({
      entries: [],
      currentSessionId: null,

      logChange: (modId, modName, settingKey, configFile, oldValue, newValue, valueType) => {
        const entry: ChangeLogEntry = {
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date(),
          sessionId: get().currentSessionId || 'unknown',
          modId,
          modName,
          settingKey,
          configFile,
          oldValue,
          newValue,
          valueType,
        };

        set((state) => {
          const newEntries = [entry, ...state.entries].slice(0, MAX_ENTRIES);
          return { entries: newEntries };
        });
      },

      startSession: (sessionId: string) => {
        set({ currentSessionId: sessionId });
      },

      getSessionChanges: (sessionId: string) => {
        return get().entries.filter((e) => e.sessionId === sessionId);
      },

      getAllSessions: () => {
        const sessions = new Set<string>();
        get().entries.forEach((e) => sessions.add(e.sessionId));
        return Array.from(sessions).sort().reverse();
      },

      getChangesByMod: (modId: string) => {
        return get().entries.filter((e) => e.modId === modId);
      },

      getRecentChanges: (limit = 50) => {
        return get().entries.slice(0, limit);
      },

      undoSession: (sessionId: string) => {
        return get().entries.filter((e) => e.sessionId === sessionId);
      },

      exportChangelog: () => {
        const data = get().entries.map((entry) => ({
          ...entry,
          timestamp: entry.timestamp.toISOString(),
        }));
        return JSON.stringify(data, null, 2);
      },

      clearChangelog: () => {
        set({ entries: [], currentSessionId: null });
      },
    }),
    {
      name: 'mced-changelog',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              entries: (state.entries || []).map((e: any) => ({
                ...e,
                timestamp: new Date(e.timestamp),
              })),
            },
          };
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
