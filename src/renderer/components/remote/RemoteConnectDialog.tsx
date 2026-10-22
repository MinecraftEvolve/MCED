import { useState } from "react";
import { Dialog } from "../common/Dialog";
import { RemoteConnection } from "../../../shared/types/remote.types";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

interface Props {
  existing?: RemoteConnection;
  onSave: (conn: RemoteConnection) => Promise<void>;
  onClose: () => void;
}

function generateId(): string {
  return `conn_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export function RemoteConnectDialog({ existing, onSave, onClose }: Props) {
  const [name, setName] = useState(existing?.name ?? "");
  const [host, setHost] = useState(existing?.host ?? "");
  const [port, setPort] = useState(existing?.port ?? 25580);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; msg: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const isEdit = !!existing;

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const conn: RemoteConnection = {
        id: existing?.id ?? generateId(),
        name,
        host,
        port,
        apiKey: apiKey || (existing?.apiKey ?? ""),
      };
      const result = await window.api.remoteTestConnection(conn);
      setTestResult({ ok: result.success, msg: result.error ?? "Connected successfully" });
    } catch (e: any) {
      setTestResult({ ok: false, msg: e?.message ?? "Test failed" });
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    if (!name.trim() || !host.trim()) return;
    setSaving(true);
    try {
      const conn: RemoteConnection = {
        id: existing?.id ?? generateId(),
        name: name.trim(),
        host: host.trim(),
        port,
        apiKey: apiKey || (existing?.apiKey ?? ""),
        lastConnected: existing?.lastConnected,
      };
      await onSave(conn);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  const valid = name.trim().length > 0 && host.trim().length > 0 && (!isEdit || apiKey.length > 0 || existing?.apiKey);

  return (
    <Dialog isOpen={true} onClose={onClose} title={isEdit ? "Edit Connection" : "Add Remote Connection"}>
      <div className="space-y-4 w-full min-w-[360px]">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Name</label>
          <input
            className="w-full px-3 py-2 rounded-lg bg-background border border-primary/20 focus:border-primary/60 outline-none text-sm"
            placeholder="My Server"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Host</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-background border border-primary/20 focus:border-primary/60 outline-none text-sm"
              placeholder="192.168.1.100"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          <div className="w-24">
            <label className="block text-xs font-medium text-muted-foreground mb-1">Port</label>
            <input
              className="w-full px-3 py-2 rounded-lg bg-background border border-primary/20 focus:border-primary/60 outline-none text-sm"
              type="number"
              min={1}
              max={65535}
              value={port}
              onChange={(e) => setPort(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            API Key {isEdit && <span className="opacity-60">(leave blank to keep existing)</span>}
          </label>
          <div className="relative">
            <input
              className="w-full px-3 py-2 pr-10 rounded-lg bg-background border border-primary/20 focus:border-primary/60 outline-none text-sm font-mono"
              type={showKey ? "text" : "password"}
              placeholder={isEdit ? "•••••••••••••• (unchanged)" : "Enter API key from mced-remote.properties"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {testResult && (
          <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
            testResult.ok
              ? "bg-green-500/10 text-green-400 border border-green-500/20"
              : "bg-red-500/10 text-red-400 border border-red-500/20"
          }`}>
            {testResult.ok
              ? <CheckCircle className="w-4 h-4 shrink-0" />
              : <XCircle className="w-4 h-4 shrink-0" />}
            {testResult.msg}
          </div>
        )}

        <div className="flex items-center justify-between pt-2 gap-2">
          <button
            onClick={handleTest}
            disabled={testing || !host.trim()}
            className="px-4 py-2 rounded-lg border border-primary/30 hover:bg-primary/10 text-sm disabled:opacity-40 flex items-center gap-2"
          >
            {testing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            Test Connection
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-primary/20 hover:bg-primary/10 text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !valid}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium disabled:opacity-40 flex items-center gap-2"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEdit ? "Save & Reconnect" : "Save & Connect"}
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
