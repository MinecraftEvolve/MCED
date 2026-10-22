import { create } from "zustand";
import {
  RemoteConnection,
  RemoteConnectionStatus,
  RemoteServerInfo,
} from "../../shared/types/remote.types";

interface RemoteConnectionState {
  savedConnections: RemoteConnection[];
  activeConnectionId: string | null;
  connectionStatus: RemoteConnectionStatus;
  connectionError: string | null;
  serverInfo: RemoteServerInfo | null;

  loadConnections: () => Promise<void>;
  saveConnection: (conn: RemoteConnection) => Promise<void>;
  deleteConnection: (id: string) => Promise<void>;
  connect: (id: string) => Promise<void>;
  disconnect: () => Promise<void>;
  setConnectionStatus: (status: RemoteConnectionStatus, error?: string) => void;
}

let pollingInterval: ReturnType<typeof setInterval> | null = null;

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }
}

function startPolling(activeId: string) {
  stopPolling();
  pollingInterval = setInterval(async () => {
    const state = useRemoteConnectionStore.getState();
    const id = state.activeConnectionId;
    if (!id) {
      stopPolling();
      return;
    }
    try {
      await window.api.remoteGetInfo();
    } catch {
      // Attempt one reconnect before marking as error
      try {
        await window.api.remoteConnect(id);
        const info = await window.api.remoteGetInfo();
        state.setConnectionStatus("connected");
        useRemoteConnectionStore.setState({ serverInfo: info });
      } catch {
        state.setConnectionStatus("error", "Lost connection to server");
        stopPolling();
      }
    }
  }, 30_000);
}

export const useRemoteConnectionStore = create<RemoteConnectionState>((set, get) => ({
  savedConnections: [],
  activeConnectionId: null,
  connectionStatus: "idle",
  connectionError: null,
  serverInfo: null,

  loadConnections: async () => {
    try {
      const connections = await window.api.remoteGetSavedConnections();
      set({ savedConnections: connections });
    } catch {
      set({ savedConnections: [] });
    }
  },

  saveConnection: async (conn) => {
    await window.api.remoteSaveConnection(conn);
    await get().loadConnections();
  },

  deleteConnection: async (id) => {
    if (get().activeConnectionId === id) {
      await get().disconnect();
    }
    await window.api.remoteDeleteConnection(id);
    await get().loadConnections();
  },

  connect: async (id) => {
    set({ connectionStatus: "connecting", connectionError: null });
    try {
      await window.api.remoteConnect(id);
      const info = await window.api.remoteGetInfo();
      set({
        activeConnectionId: id,
        connectionStatus: "connected",
        serverInfo: info,
        connectionError: null,
        savedConnections: get().savedConnections.map((c) =>
          c.id === id ? { ...c, lastConnected: Date.now() } : c
        ),
      });
      startPolling(id);
    } catch (err: any) {
      set({
        connectionStatus: "error",
        connectionError: err?.message || "Connection failed",
        activeConnectionId: null,
      });
    }
  },

  disconnect: async () => {
    stopPolling();
    try {
      await window.api.remoteDisconnect();
    } catch {}
    set({
      activeConnectionId: null,
      connectionStatus: "idle",
      connectionError: null,
      serverInfo: null,
    });
  },

  setConnectionStatus: (status, error) => {
    set({ connectionStatus: status, connectionError: error ?? null });
  },
}));
