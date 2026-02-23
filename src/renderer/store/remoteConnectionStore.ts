import { create } from "zustand";
import { RemoteConnection, RemoteConnectionStatus, RemoteServerInfo } from "../../shared/types/remote.types";

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
      // If we deleted the active connection, clear state
      if (get().activeConnectionId === id) {
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
      // Fetch server info
      const infoResult = await window.api.remoteGetInfo();
      if (infoResult.success && infoResult.data) {
        set({ serverInfo: infoResult.data as RemoteServerInfo });
      }
      // Reload connections to get updated lastConnected
      await get().loadConnections();
    } else {
      set({ connectionStatus: "error", connectionError: result.error ?? "Connection failed" });
    }
    return result;
  },

  disconnect: async () => {
    await window.api.remoteDisconnect();
    set({ activeConnectionId: null, connectionStatus: "idle", connectionError: null, serverInfo: null });
  },

  setConnectionStatus: (status, error) => {
    set({ connectionStatus: status, connectionError: error ?? null });
  },
}));
