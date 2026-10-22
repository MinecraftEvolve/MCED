import { useState } from "react";
import { Dialog } from "../common/Dialog";
import { RemoteConnection } from "../../../shared/types/remote.types";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Server, Key, Info } from "lucide-react";

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

  const valid =
    name.trim().length > 0 &&
    host.trim().length > 0 &&
    (!isEdit || apiKey.length > 0 || existing?.apiKey);

  return (
    <Dialog
      isOpen={true}
      onClose={onClose}
      title={isEdit ? "Edit Connection" : "Add Remote Connection"}
      size="sm"
    >
      <div className="p-6 space-y-5">
        {/* Setup hint (new connections only) */}
        {!isEdit && (
          <div className="flex gap-3 p-3 rounded-xl bg-primary/5 border border-primary/20">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="text-xs text-muted-foreground leading-relaxed">
              Run{" "}
              <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px]">
                java -jar mced-remote.jar
              </code>{" "}
              on your server, then copy the API key from{" "}
              <code className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px]">
                mced-remote.properties
              </code>
            </div>
          </div>
        )}

        {/* Connection name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            Connection Name
          </label>
          <div className="relative">
            <Server className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-background/60 border border-primary/20 hover:border-primary/40 focus:border-primary outline-none text-sm transition-colors"
              placeholder="My Minecraft Server"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        {/* Host + Port */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            Address
          </label>
          <div className="flex gap-2">
            <input
              className="flex-1 px-3 py-2.5 rounded-xl bg-background/60 border border-primary/20 hover:border-primary/40 focus:border-primary outline-none text-sm transition-colors"
              placeholder="192.168.1.100  or  play.example.com"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
            <div className="flex flex-col gap-0.5">
              <input
                className="w-24 px-3 py-2.5 rounded-xl bg-background/60 border border-primary/20 hover:border-primary/40 focus:border-primary outline-none text-sm text-center transition-colors"
                type="number"
                min={1}
                max={65535}
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
              />
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground opacity-60 pl-1">
            Default port: 25580
          </p>
        </div>

        {/* API Key */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-foreground/70 uppercase tracking-wider">
            API Key{" "}
            {isEdit && (
              <span className="normal-case font-normal text-muted-foreground">(leave blank to keep existing)</span>
            )}
          </label>
          <div className="relative">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-background/60 border border-primary/20 hover:border-primary/40 focus:border-primary outline-none text-sm font-mono transition-colors"
              type={showKey ? "text" : "password"}
              placeholder={isEdit ? "•••••••• (unchanged)" : "Paste key from mced-remote.properties"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              onClick={() => setShowKey(!showKey)}
            >
              {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Test result */}
        {testResult && (
          <div
            className={`flex items-center gap-2.5 text-xs px-4 py-2.5 rounded-xl border ${
              testResult.ok
                ? "bg-green-500/10 text-green-400 border-green-500/30"
                : "bg-red-500/10 text-red-400 border-red-500/30"
            }`}
          >
            {testResult.ok ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <XCircle className="w-4 h-4 shrink-0" />
            )}
            <span className="font-medium">{testResult.msg}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-1 gap-3 border-t border-primary/10">
          <button
            onClick={handleTest}
            disabled={testing || !host.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-primary/30 hover:bg-primary/10 text-sm disabled:opacity-40 transition-colors"
          >
            {testing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CheckCircle className="w-3.5 h-3.5" />
            )}
            Test Connection
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-primary/20 hover:bg-primary/10 text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !valid}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-semibold disabled:opacity-40 transition-colors shadow-lg shadow-primary/20"
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
