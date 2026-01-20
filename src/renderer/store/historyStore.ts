import { create } from "zustand";
import { ConfigFile } from "@/types/config.types";

interface HistoryState {
  past: ConfigFile[][];
  present: ConfigFile[];
  future: ConfigFile[][];
  canUndo: boolean;
  canRedo: boolean;

  init: (configs: ConfigFile[]) => void;
  pushState: (configs: ConfigFile[]) => void;
  undo: () => ConfigFile[] | null;
  redo: () => ConfigFile[] | null;
  clear: () => void;
}

const MAX_HISTORY = 50;

export const useHistoryStore = create<HistoryState>((set, get) => ({
  past: [],
  present: [],
  future: [],
  canUndo: false,
  canRedo: false,

  init: (configs: ConfigFile[]) => {
    set({
      past: [],
      present: JSON.parse(JSON.stringify(configs)),
      future: [],
      canUndo: false,
      canRedo: false,
    });
  },

  pushState: (configs: ConfigFile[]) => {
    const { present, past } = get();

    const newPast = [...past, present].slice(-MAX_HISTORY);

    set({
      past: newPast,
      present: JSON.parse(JSON.stringify(configs)),
      future: [],
      canUndo: true,
      canRedo: false,
    });
  },

  undo: () => {
    const { past, present, future } = get();

    if (past.length === 0) return null;

    const previous = past[past.length - 1];
    const newPast = past.slice(0, -1);

    set({
      past: newPast,
      present: previous,
      future: [present, ...future],
      canUndo: newPast.length > 0,
      canRedo: true,
    });

    return JSON.parse(JSON.stringify(previous));
  },

  redo: () => {
    const { past, present, future } = get();

    if (future.length === 0) return null;

    const next = future[0];
    const newFuture = future.slice(1);

    set({
      past: [...past, present],
      present: next,
      future: newFuture,
      canUndo: true,
      canRedo: newFuture.length > 0,
    });

    return JSON.parse(JSON.stringify(next));
  },

  clear: () => {
    set({
      past: [],
      present: [],
      future: [],
      canUndo: false,
      canRedo: false,
    });
  },
}));
