import { create } from "zustand";
import { RemoteConnection, RemoteConnectionStatus, RemoteServerInfo } from "../../shared/types/remote.types";

const POLL_INTERVAL_MS = 30_000;

interface RemoteConnectionStore {
  // Cached from main process (no API keys)
  savedConnections: Omit<RemoteConnection, "apiKey">[];

  // Session state
  activeConnectionId: string | null;
  connectionStatus: RemoteConnectionStatus;
  connectionError: string | null;
  serverInfo: RemoteServerInfo | null;

  // Actions
  loadConnections: () => Promise<void>;
  saveConnection: (connection: RemoteConnection) => Promise<{ success: boolean; error?: string }>;
  deleteConnection: (id: string) => Promise<{ success: boolean; error?: string }>;
  connect: (connectionId: string) => Promise<{ success: boolean; error?: string }>;
  disconnect: () => Promise<void>;
  setConnectionStatus: (status: RemoteConnectionStatus, error?: string) => void;
}

let pollTimer: ReturnType<typeof setInterval> | null = null;

function stopPolling() {
  if (pollTimer !== null) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

function startPolling(store: RemoteConnectionStore) {
  stopPolling();
  pollTimer = setInterval(async () => {
    // Only poll if still connected
    const state = useRemoteConnectionStore.getState();
    if (state.connectionStatus !== "connected" || !state.activeConnectionId) {
      stopPolling();
      return;
    }
    const result = await window.api.remoteGetInfo();
    if (!result.success) {
      useRemoteConnectionStore.setState({
        connectionStatus: "error",
        connectionError: "Connection lost: " + (result.error ?? "server unreachable"),
      });
      stopPolling();
    }
  }, POLL_INTERVAL_MS);
}

export const useRemoteConnectionStore = create<RemoteConnectionStore>((set, get) => ({
  savedConnections: [],
  activeConnectionId: null,
  connectionStatus: "idle",
  connectionError: null,
  serverInfo: null,

  loadConnections: async () => {
    const result = await window.api.remoteGetSavedConnections();
    if (result.success && result.data) {
      set({ savedConnections: result.data as Omit<RemoteConnection, "apiKey">[] });
    }
  },

  saveConnection: async (connection) => {
    const result = await window.api.remoteSaveConnection(connection);
    if (result.success) {
      await get().loadConnections();
    }
    return result;
  },

  deleteConnection: async (id) => {
    const result = await window.api.remoteDeleteConnection(id);
    if (result.success) {
      await get().loadConnections();
      if (get().activeConnectionId === id) {
        stopPolling();
        set({ activeConnectionId: null, connectionStatus: "idle", connectionError: null, serverInfo: null });
      }
    }
    return result;
  },

  connect: async (connectionId) => {
    set({ connectionStatus: "connecting", connectionError: null });
    const result = await window.api.remoteConnect(connectionId);
    if (result.success) {
      set({ activeConnectionId: connectionId, connectionStatus: "connected" });
      const infoResult = await window.api.remoteGetInfo();
      if (infoResult.success && infoResult.data) {
        set({ serverInfo: infoResult.data as RemoteServerInfo });
      }
      await get().loadConnections();
      startPolling(get());
    } else {
      set({ connectionStatus: "error", connectionError: result.error ?? "Connection failed" });
    }
    return result;
  },

  disconnect: async () => {
    stopPolling();
    await window.api.remoteDisconnect();
    set({ activeConnectionId: null, connectionStatus: "idle", connectionError: null, serverInfo: null });
  },

  setConnectionStatus: (status, error) => {
    set({ connectionStatus: status, connectionError: error ?? null });
  },
}));
