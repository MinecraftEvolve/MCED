import { useEffect, useState } from "react";
import { useRemoteConnectionStore } from "../../store/remoteConnectionStore";
import { RemoteConnectDialog } from "./RemoteConnectDialog";
import { ConfirmDialog } from "../common/Dialog";
import { RemoteConnection } from "../../../shared/types/remote.types";
import {
  Plus,
  Pencil,
  Trash2,
  Server,
  Loader2,
  XCircle,
  Clock,
} from "lucide-react";

function formatLastConnected(ts?: number): string {
  if (!ts) return "Never";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function RemoteConnectionManager() {
  const {
    savedConnections,
    activeConnectionId,
    connectionStatus,
    connectionError,
    serverInfo,
    loadConnections,
    saveConnection,
    deleteConnection,
    connect,
    disconnect,
  } = useRemoteConnectionStore();

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<RemoteConnection | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  function statusDot(connId: string) {
    if (connId !== activeConnectionId) return null;
    if (connectionStatus === "connecting")
      return <Loader2 className="w-3 h-3 animate-spin text-yellow-400" />;
    if (connectionStatus === "connected")
      return <span className="w-2 h-2 rounded-full bg-green-400 shadow-[0_0_6px_2px_rgba(74,222,128,0.4)]" />;
    if (connectionStatus === "error")
      return <span className="w-2 h-2 rounded-full bg-red-400" />;
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold">Remote Servers</span>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="p-1.5 rounded-lg hover:bg-primary/10 border border-primary/20 hover:border-primary/40 transition-colors"
          title="Add connection"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Connection list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {savedConnections.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-sm">
            <Server className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>No saved connections</p>
            <p className="text-xs mt-1 opacity-60">Click + to add one</p>
          </div>
        )}

        {savedConnections.map((conn) => {
          const isActive = conn.id === activeConnectionId;
          return (
            <div
              key={conn.id}
              className={`rounded-lg border px-3 py-2 transition-colors ${
                isActive
                  ? "border-primary/40 bg-primary/10"
                  : "border-primary/10 hover:border-primary/20 hover:bg-primary/5"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  {statusDot(conn.id)}
                  <span className="text-sm font-medium truncate">{conn.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditing(conn)}
                    className="p-1 rounded hover:bg-primary/20 text-muted-foreground hover:text-foreground"
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirmDelete(conn.id)}
                    className="p-1 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="text-xs text-muted-foreground mt-0.5 truncate font-mono">
                {conn.host}:{conn.port}
              </div>

              <div className="flex items-center gap-2 mt-1.5">
                <div className="flex items-center gap-1 text-xs text-muted-foreground opacity-60">
                  <Clock className="w-3 h-3" />
                  {formatLastConnected(conn.lastConnected)}
                </div>
                <div className="flex-1" />
                {isActive ? (
                  <button
                    onClick={disconnect}
                    className="text-xs px-2 py-0.5 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10"
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    onClick={() => connect(conn.id)}
                    disabled={connectionStatus === "connecting"}
                    className="text-xs px-2 py-0.5 rounded border border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-40"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Server info badge when connected */}
              {isActive && serverInfo && (
                <div className="flex flex-wrap gap-1 mt-2">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary">
                    {serverInfo.modLoader}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">
                    {serverInfo.serverType}
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-card border border-primary/10 text-muted-foreground">
                    Java {serverInfo.javaVersion}
                  </span>
                </div>
              )}

              {/* Error message */}
              {isActive && connectionStatus === "error" && connectionError && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-red-400">
                  <XCircle className="w-3 h-3 shrink-0" />
                  {connectionError}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-2 border-t border-primary/20">
        <p className="text-[10px] text-muted-foreground opacity-60 font-mono">
          java -jar mced-remote.jar
        </p>
      </div>

      {/* Dialogs */}
      {showAdd && (
        <RemoteConnectDialog
          onSave={async (conn) => {
            await saveConnection(conn);
            await connect(conn.id);
          }}
          onClose={() => setShowAdd(false)}
        />
      )}

      {editing && (
        <RemoteConnectDialog
          existing={editing}
          onSave={async (conn) => {
            await saveConnection(conn);
            if (conn.id === activeConnectionId) await connect(conn.id);
          }}
          onClose={() => setEditing(null)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          isOpen={true}
          title="Delete Connection"
          message="Are you sure you want to delete this connection? This cannot be undone."
          onConfirm={() => {
            deleteConnection(confirmDelete).then(() => setConfirmDelete(null));
          }}
          onClose={() => setConfirmDelete(null)}
          variant="danger"
          confirmText="Delete"
        />
      )}
    </div>
  );
}
