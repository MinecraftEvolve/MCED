import React, { useState, useEffect } from "react";
import { Dialog } from "../common/Dialog";
import { RemoteConnection } from "../../../shared/types/remote.types";
import { useRemoteConnectionStore } from "../../store/remoteConnectionStore";
import { CheckCircle, XCircle, Loader2, Server, Eye, EyeOff } from "lucide-react";

interface RemoteConnectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingConnection?: Omit<RemoteConnection, "apiKey"> | null;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export const RemoteConnectDialog: React.FC<RemoteConnectDialogProps> = ({
  isOpen,
  onClose,
  existingConnection,
}) => {
  const { saveConnection, connect } = useRemoteConnectionStore();

  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("25580");
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  const [testStatus, setTestStatus] = useState<"idle" | "testing" | "ok" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (existingConnection) {
        setName(existingConnection.name);
        setHost(existingConnection.host);
        setPort(String(existingConnection.port));
        setApiKey(""); // User must re-enter API key when editing
      } else {
        setName("");
        setHost("");
        setPort("25580");
        setApiKey("");
      }
      setTestStatus("idle");
      setTestMessage("");
      setShowApiKey(false);
    }
  }, [isOpen, existingConnection]);

  const buildTempConnection = (): RemoteConnection => ({
    id: existingConnection?.id ?? generateId(),
    name: name.trim(),
    host: host.trim(),
    port: parseInt(port, 10) || 25580,
    apiKey,
    lastConnected: existingConnection?.lastConnected,
  });

  const handleTest = async () => {
    if (!host.trim() || !apiKey.trim()) {
      setTestStatus("error");
      setTestMessage("Host and API key are required to test");
      return;
    }
    setTestStatus("testing");
    setTestMessage("");
    const conn = buildTempConnection();
    const result = await window.api.remoteTestConnection(conn);
    if (result.success) {
      const status = result.data as { status: string; version?: string; serverName?: string } | undefined;
      setTestStatus("ok");
      setTestMessage(
        status?.serverName
          ? `Connected to "${status.serverName}" (v${status.version ?? "?"})`
          : `Connected successfully (v${status?.version ?? "?"})`
      );
    } else {
      setTestStatus("error");
      setTestMessage(result.error ?? "Connection failed");
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !host.trim() || !apiKey.trim()) {
      setTestStatus("error");
      setTestMessage("Name, host, and API key are required");
      return;
    }
    setSaving(true);
    const conn = buildTempConnection();
    const result = await saveConnection(conn);
    setSaving(false);
    if (!result.success) {
      setTestStatus("error");
      setTestMessage(result.error ?? "Failed to save connection");
      return;
    }
    // Auto-connect after saving
    await connect(conn.id);
    onClose();
  };

  const inputClass =
    "w-full px-3 py-2 bg-background border border-primary/20 rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-colors";

  const isEditing = !!existingConnection;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Connection" : "Add Remote Connection"}
      size="sm"
    >
      <div className="p-6 space-y-4">
        {/* Name */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Connection Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Survival Server"
            className={inputClass}
          />
        </div>

        {/* Host + Port */}
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Host</label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="192.168.1.100 or server.example.com"
              className={inputClass}
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Port</label>
            <input
              type="number"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              min={1}
              max={65535}
              className={inputClass}
            />
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            API Key{isEditing && <span className="text-muted-foreground/60"> (leave blank to keep existing)</span>}
          </label>
          <div className="relative">
            <input
              type={showApiKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={isEditing ? "Enter new key or leave blank" : "Paste API key from mced-remote.properties"}
              className={`${inputClass} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowApiKey((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground transition-colors"
              title={showApiKey ? "Hide API key" : "Show API key"}
            >
              {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Found in <code className="bg-background/80 px-1 rounded">mced-remote.properties</code> on the server
          </p>
        </div>

        {/* Test result */}
        {testStatus !== "idle" && (
          <div
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
              testStatus === "ok"
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : testStatus === "error"
                ? "bg-destructive/10 text-destructive border border-destructive/20"
                : "bg-secondary text-muted-foreground border border-primary/10"
            }`}
          >
            {testStatus === "testing" && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
            {testStatus === "ok" && <CheckCircle className="w-4 h-4 shrink-0" />}
            {testStatus === "error" && <XCircle className="w-4 h-4 shrink-0" />}
            <span>{testStatus === "testing" ? "Testing connection..." : testMessage}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleTest}
            disabled={testStatus === "testing" || saving}
            className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 border border-primary/20 rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {testStatus === "testing" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Server className="w-4 h-4" />
            )}
            Test
          </button>

          <div className="flex-1" />

          <button
            onClick={onClose}
            className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-primary/20 rounded-lg text-sm font-medium transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || testStatus === "testing"}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/20"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Connecting..." : isEditing ? "Save & Reconnect" : "Save & Connect"}
          </button>
        </div>
      </div>
    </Dialog>
  );
};
