import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditStat {
  modId: string;
  modName: string;
  settingKey: string;
  editCount: number;
  lastEdited: Date;
}

interface SessionStats {
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  totalEdits: number;
  modsEdited: string[];
}

interface StatsState {
  editStats: Map<string, EditStat>;
  sessions: SessionStats[];
  currentSessionId: string | null;
  
  // Actions
  recordEdit: (modId: string, modName: string, settingKey: string) => void;
  startSession: () => void;
  endSession: () => void;
  getMostEditedMods: (limit?: number) => EditStat[];
  getMostEditedSettings: (limit?: number) => EditStat[];
  getTotalEdits: () => number;
  getSessionDuration: (sessionId: string) => number;
  getCurrentSessionDuration: () => number;
  clearStats: () => void;
}

export const useStatsStore = create<StatsState>()(
  persist(
    (set, get) => ({
      editStats: new Map(),
      sessions: [],
      currentSessionId: null,

      recordEdit: (modId: string, modName: string, settingKey: string) => {
        const key = `${modId}:${settingKey}`;
        const now = new Date();

        set((state) => {
          const newStats = new Map(state.editStats);
          const existing = newStats.get(key);

          if (existing) {
            newStats.set(key, {
              ...existing,
              editCount: existing.editCount + 1,
              lastEdited: now,
            });
          } else {
            newStats.set(key, {
              modId,
              modName,
              settingKey,
              editCount: 1,
              lastEdited: now,
            });
          }

          // Update current session
          const sessions = [...state.sessions];
          if (state.currentSessionId) {
            const currentSession = sessions.find(s => s.sessionId === state.currentSessionId);
            if (currentSession) {
              currentSession.totalEdits++;
              if (!currentSession.modsEdited.includes(modId)) {
                currentSession.modsEdited.push(modId);
              }
            }
          }

          return { editStats: newStats, sessions };
        });
      },

      startSession: () => {
        const sessionId = `session_${Date.now()}`;
        set((state) => ({
          currentSessionId: sessionId,
          sessions: [
            ...state.sessions,
            {
              sessionId,
              startTime: new Date(),
              totalEdits: 0,
              modsEdited: [],
            },
          ],
        }));
      },

      endSession: () => {
        set((state) => {
          if (!state.currentSessionId) return state;

          const sessions = state.sessions.map((s) =>
            s.sessionId === state.currentSessionId
              ? { ...s, endTime: new Date() }
              : s
          );

          return { sessions, currentSessionId: null };
        });
      },

      getMostEditedMods: (limit = 10) => {
        const stats = Array.from(get().editStats.values());
        const modStats = new Map<string, EditStat>();

        stats.forEach((stat) => {
          const existing = modStats.get(stat.modId);
          if (existing) {
            modStats.set(stat.modId, {
              ...existing,
              editCount: existing.editCount + stat.editCount,
              lastEdited: stat.lastEdited > existing.lastEdited ? stat.lastEdited : existing.lastEdited,
            });
          } else {
            modStats.set(stat.modId, stat);
          }
        });

        return Array.from(modStats.values())
          .sort((a, b) => b.editCount - a.editCount)
          .slice(0, limit);
      },

      getMostEditedSettings: (limit = 10) => {
        return Array.from(get().editStats.values())
          .sort((a, b) => b.editCount - a.editCount)
          .slice(0, limit);
      },

      getTotalEdits: () => {
        let total = 0;
        get().editStats.forEach((stat) => {
          total += stat.editCount;
        });
        return total;
      },

      getSessionDuration: (sessionId: string) => {
        const session = get().sessions.find((s) => s.sessionId === sessionId);
        if (!session) return 0;

        const endTime = session.endTime || new Date();
        return endTime.getTime() - session.startTime.getTime();
      },

      getCurrentSessionDuration: () => {
        const { currentSessionId } = get();
        if (!currentSessionId) return 0;
        return get().getSessionDuration(currentSessionId);
      },

      clearStats: () => {
        set({ editStats: new Map(), sessions: [], currentSessionId: null });
      },
    }),
    {
      name: 'mced-stats',
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const { state } = JSON.parse(str);
          return {
            state: {
              ...state,
              editStats: new Map(Object.entries(state.editStats || {})),
              sessions: (state.sessions || []).map((s: any) => ({
                ...s,
                startTime: new Date(s.startTime),
                endTime: s.endTime ? new Date(s.endTime) : undefined,
              })),
            },
          };
        },
        setItem: (name, value) => {
          const editStats = Object.fromEntries(value.state.editStats);
          localStorage.setItem(
            name,
            JSON.stringify({
              state: {
                ...value.state,
                editStats,
              },
            })
          );
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
);
