import React, { useEffect, useState } from "react";
import {
  Plus,
  Plug,
  PlugZap,
  Trash2,
  Edit2,
  Loader2,
  Server,
  Clock,
  AlertCircle,
} from "lucide-react";
import { useRemoteConnectionStore } from "../../store/remoteConnectionStore";
import { RemoteConnectDialog } from "./RemoteConnectDialog";
import { ConfirmDialog } from "../common/Dialog";
import { RemoteConnection } from "../../../shared/types/remote.types";

export const RemoteConnectionManager: React.FC = () => {
  const {
    savedConnections,
    activeConnectionId,
    connectionStatus,
    connectionError,
    serverInfo,
    loadConnections,
    connect,
    disconnect,
    deleteConnection,
  } = useRemoteConnectionStore();

  const [showAddDialog, setShowAddDialog] = useState(false);
  const [editingConnection, setEditingConnection] = useState<Omit<RemoteConnection, "apiKey"> | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [connectingId, setConnectingId] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  const handleConnect = async (id: string) => {
    setConnectingId(id);
    await connect(id);
    setConnectingId(null);
  };

  const handleDisconnect = async () => {
    await disconnect();
  };

  const handleDelete = async (id: string) => {
    await deleteConnection(id);
    setDeletingId(null);
  };

  const formatLastConnected = (ts?: number) => {
    if (!ts) return "Never";
    const diff = Date.now() - ts;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-primary/20">
        <div className="flex items-center gap-3">
          <Server className="w-5 h-5 text-purple-400" />
          <div>
            <h2 className="text-base font-semibold text-foreground">Remote Connections</h2>
            {activeConnectionId && connectionStatus === "connected" && (
              <p className="text-xs text-green-400">
                Connected{serverInfo?.serverName ? ` to "${serverInfo.serverName}"` : ""}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => { setEditingConnection(null); setShowAddDialog(true); }}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-all hover:scale-105 shadow-lg shadow-purple-500/20"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </div>

      {/* Connection error banner */}
      {connectionStatus === "error" && connectionError && (
        <div className="mx-4 mt-3 flex items-start gap-2 px-3 py-2 bg-destructive/10 text-destructive border border-destructive/20 rounded-lg text-sm">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{connectionError}</span>
        </div>
      )}

      {/* Server info */}
      {connectionStatus === "connected" && serverInfo && (
        <div className="mx-4 mt-3 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-green-400">
            {serverInfo.modLoader && serverInfo.modLoader !== "unknown" && (
              <span>
                <span className="text-green-300/70">Loader:</span>{" "}
                {serverInfo.modLoader.charAt(0).toUpperCase() + serverInfo.modLoader.slice(1)}
              </span>
            )}
            {serverInfo.serverType && serverInfo.serverType !== "unknown" && (
              <span>
                <span className="text-green-300/70">Type:</span>{" "}
                {serverInfo.serverType.charAt(0).toUpperCase() + serverInfo.serverType.slice(1)}
              </span>
            )}
            {serverInfo.javaVersion && (
              <span>
                <span className="text-green-300/70">Java:</span> {serverInfo.javaVersion}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Connection list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {savedConnections.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <Server className="w-10 h-10 mb-3 opacity-30" />
            <p className="text-sm">No connections saved yet</p>
            <p className="text-xs mt-1">Add a connection to manage remote server configs</p>
          </div>
        ) : (
          savedConnections.map((conn) => {
            const isActive = conn.id === activeConnectionId;
            const isConnecting = connectingId === conn.id;

            return (
              <div
                key={conn.id}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  isActive
                    ? "bg-green-500/5 border-green-500/30"
                    : "bg-secondary/50 border-primary/10 hover:border-primary/20"
                }`}
              >
                {/* Status dot */}
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isActive && connectionStatus === "connected"
                      ? "bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.4)]"
                      : isConnecting
                      ? "bg-yellow-400 animate-pulse"
                      : "bg-muted-foreground/30"
                  }`}
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm text-foreground truncate">{conn.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {conn.host}:{conn.port}
                  </div>
                </div>

                {/* Last connected */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Clock className="w-3 h-3" />
                  {formatLastConnected(conn.lastConnected)}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {isActive ? (
                    <button
                      onClick={handleDisconnect}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-medium transition-all"
                      title="Disconnect"
                    >
                      <PlugZap className="w-3.5 h-3.5" />
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => handleConnect(conn.id)}
                      disabled={isConnecting || connectionStatus === "connecting"}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 border border-purple-500/20 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                      title="Connect"
                    >
                      {isConnecting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Plug className="w-3.5 h-3.5" />
                      )}
                      Connect
                    </button>
                  )}

                  <button
                    onClick={() => { setEditingConnection(conn); setShowAddDialog(true); }}
                    className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-all"
                    title="Edit connection"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setDeletingId(conn.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-all"
                    title="Delete connection"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Setup hint */}
      <div className="px-4 pb-4">
        <div className="px-3 py-2 bg-blue-500/5 border border-blue-500/20 rounded-lg text-xs text-blue-400/80">
          Run <code className="bg-background/60 px-1 rounded">java -jar mced-remote.jar</code> on your server to get the API key
        </div>
      </div>

      {/* Dialogs */}
      <RemoteConnectDialog
        isOpen={showAddDialog}
        onClose={() => { setShowAddDialog(false); setEditingConnection(null); }}
        existingConnection={editingConnection}
      />

      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={() => deletingId && handleDelete(deletingId)}
        title="Delete Connection"
        message={`Delete "${savedConnections.find((c) => c.id === deletingId)?.name ?? "this connection"}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};
