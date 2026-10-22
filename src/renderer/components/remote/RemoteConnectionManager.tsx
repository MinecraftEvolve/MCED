import { useEffect, useState } from "react";
import { useRemoteConnectionStore } from "../../store/remoteConnectionStore";
import { useAppStore } from "../../store";
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
  X,
  Download,
  Wifi,
  WifiOff,
  ChevronRight,
} from "lucide-react";

const COMPAT_LOADERS = ["Fabric", "Forge", "NeoForge", "Paper", "Spigot", "Vanilla"];

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

  const setViewMode = useAppStore((s) => s.setViewMode);

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<RemoteConnection | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    loadConnections();
  }, []);

  function statusIcon(connId: string) {
    if (connId !== activeConnectionId) return null;
    if (connectionStatus === "connecting")
      return <Loader2 className="w-3.5 h-3.5 animate-spin text-yellow-400" />;
    if (connectionStatus === "connected")
      return (
        <span className="flex items-center gap-1 text-green-400">
          <Wifi className="w-3.5 h-3.5" />
        </span>
      );
    if (connectionStatus === "error")
      return <WifiOff className="w-3.5 h-3.5 text-red-400" />;
    return null;
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-primary/10 border border-primary/20">
            <Server className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-sm font-semibold">Remote Servers</span>
          {connectionStatus === "connected" && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/15 border border-green-500/30 text-green-400 font-medium">
              live
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowAdd(true)}
            className="p-1.5 rounded-lg hover:bg-primary/15 border border-primary/20 hover:border-primary/40 transition-colors"
            title="Add connection"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode("mods")}
            className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-red-400 transition-colors"
            title="Close remote panel"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Connection list */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {savedConnections.length === 0 ? (
          /* Empty state with setup guide */
          <div className="py-4 space-y-4">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Server className="w-7 h-7 text-primary/60" />
              </div>
              <p className="text-sm font-semibold text-foreground">No servers yet</p>
              <p className="text-xs text-muted-foreground mt-1 opacity-70">
                Add a server running mced-remote.jar
              </p>
            </div>

            {/* Quick setup steps */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 divide-y divide-primary/10">
              {[
                { n: "1", text: "Download and copy jar to server" },
                { n: "2", text: "Run java -jar mced-remote.jar" },
                { n: "3", text: "Copy API key from .properties file" },
                { n: "4", text: "Click + and paste key here" },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] font-bold flex items-center justify-center shrink-0">
                    {n}
                  </span>
                  <span className="text-xs text-muted-foreground">{text}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold transition-colors shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Add Server
            </button>
          </div>
        ) : (
          savedConnections.map((conn) => {
            const isActive = conn.id === activeConnectionId;
            const isConnected = isActive && connectionStatus === "connected";
            return (
              <div
                key={conn.id}
                className={`rounded-xl border transition-all ${
                  isActive
                    ? isConnected
                      ? "border-green-500/40 bg-green-500/5 shadow-sm shadow-green-500/10"
                      : "border-primary/40 bg-primary/10"
                    : "border-primary/15 hover:border-primary/30 hover:bg-primary/5 bg-card/30"
                }`}
              >
                <div className="px-3 pt-3 pb-2">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      {statusIcon(conn.id)}
                      <span className="text-sm font-semibold truncate">{conn.name}</span>
                    </div>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <button
                        onClick={() => setEditing(conn)}
                        className="p-1 rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => setConfirmDelete(conn.id)}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-muted-foreground font-mono opacity-60 truncate">
                    {conn.host}:{conn.port}
                  </p>

                  {/* Server info badges */}
                  {isConnected && serverInfo && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary font-medium capitalize">
                        {serverInfo.modLoader}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-green-500/10 border border-green-500/20 text-green-400 font-medium capitalize">
                        {serverInfo.serverType}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-card border border-border text-muted-foreground">
                        Java {serverInfo.javaVersion}
                      </span>
                    </div>
                  )}

                  {/* Error */}
                  {isActive && connectionStatus === "error" && connectionError && (
                    <div className="flex items-center gap-1.5 mt-2 text-[10px] text-red-400">
                      <XCircle className="w-3 h-3 shrink-0" />
                      <span className="truncate">{connectionError}</span>
                    </div>
                  )}
                </div>

                {/* Footer row */}
                <div className="flex items-center justify-between px-3 pb-2.5 gap-2">
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground opacity-50">
                    <Clock className="w-2.5 h-2.5" />
                    {formatLastConnected(conn.lastConnected)}
                  </div>
                  {isActive ? (
                    <button
                      onClick={disconnect}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors font-medium"
                    >
                      Disconnect
                    </button>
                  ) : (
                    <button
                      onClick={() => connect(conn.id)}
                      disabled={connectionStatus === "connecting"}
                      className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 disabled:opacity-40 transition-colors font-medium"
                    >
                      Connect
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Compatibility footer */}
      <div className="border-t border-primary/15 bg-card/30 px-4 py-3 space-y-2">
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Compatible with
          </p>
          <div className="flex flex-wrap gap-1">
            {COMPAT_LOADERS.map((l) => (
              <span
                key={l}
                className="text-[10px] px-1.5 py-0.5 rounded-md bg-primary/8 border border-primary/15 text-muted-foreground"
              >
                {l}
              </span>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-muted-foreground opacity-50 font-mono">
            any MC version · Java 17+
          </span>
          <button
            onClick={() =>
              window.api.openExternal(
                "https://github.com/MinecraftEvolve/MCED/releases/latest/download/mced-remote.jar"
              )
            }
            className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors"
          >
            <Download className="w-2.5 h-2.5" />
            Download jar
          </button>
        </div>
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
