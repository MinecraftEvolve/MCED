import { useState, useCallback, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useRemoteConnectionStore } from "../../store/remoteConnectionStore";
import { useSettingsStore } from "../../store/settingsStore";
import { RemoteFile } from "../../../shared/types/remote.types";
import {
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  Save,
  Trash2,
  ArrowLeft,
  Loader2,
  Server,
} from "lucide-react";

interface FileNode extends RemoteFile {
  name: string;
  children?: FileNode[];
  loaded?: boolean;
  expanded?: boolean;
}

function buildNode(file: RemoteFile): FileNode {
  return {
    ...file,
    name: file.path.split("/").pop() ?? file.path,
  };
}

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase();
  switch (ext) {
    case "json": return "json";
    case "toml": return "ini";
    case "yaml":
    case "yml": return "yaml";
    case "properties": return "ini";
    case "js":
    case "ts": return "javascript";
    case "xml": return "xml";
    case "cfg":
    case "conf":
    case "ini": return "ini";
    default: return "plaintext";
  }
}

interface FileNodeRowProps {
  node: FileNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (node: FileNode) => void;
  onToggle: (node: FileNode) => void;
}

function FileNodeRow({ node, depth, selectedPath, onSelect, onToggle }: FileNodeRowProps) {
  const isSelected = node.path === selectedPath;
  return (
    <div>
      <button
        className={`w-full flex items-center gap-1 px-2 py-1 text-xs text-left rounded hover:bg-primary/10 transition-colors ${
          isSelected ? "bg-primary/20 text-primary" : "text-foreground"
        }`}
        style={{ paddingLeft: `${8 + depth * 12}px` }}
        onClick={() => (node.isDirectory ? onToggle(node) : onSelect(node))}
      >
        {node.isDirectory ? (
          <>
            {node.expanded ? (
              <ChevronDown className="w-3 h-3 shrink-0 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 shrink-0 text-muted-foreground" />
            )}
            <FolderOpen className="w-3.5 h-3.5 shrink-0 text-yellow-400" />
          </>
        ) : (
          <>
            <span className="w-3 h-3 shrink-0" />
            <FileText className="w-3.5 h-3.5 shrink-0 text-blue-400" />
          </>
        )}
        <span className="truncate">{node.name}</span>
      </button>

      {node.isDirectory && node.expanded && node.children && (
        <div>
          {node.children.map((child) => (
            <FileNodeRow
              key={child.path}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function RemoteFileBrowser() {
  const { activeConnectionId, connectionStatus } = useRemoteConnectionStore();
  const { settings } = useSettingsStore();

  const [rootNodes, setRootNodes] = useState<FileNode[]>([]);
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [savedContent, setSavedContent] = useState<string>("");
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isDirty = fileContent !== savedContent;
  const [dragOver, setDragOver] = useState(false);

  // Keep a ref to handleSave so the Monaco onMount closure always calls the latest version
  const handleSaveRef = useRef<() => Promise<void>>(() => Promise.resolve());

  const loadRoot = useCallback(async () => {
    if (!activeConnectionId || connectionStatus !== "connected") return;
    setLoadingTree(true);
    setError(null);
    try {
      const files: RemoteFile[] = await window.api.remoteListFiles(undefined, false);
      setRootNodes(files.map(buildNode));
    } catch (e: any) {
      setError(e?.message ?? "Failed to load files");
    } finally {
      setLoadingTree(false);
    }
  }, [activeConnectionId, connectionStatus]);

  useEffect(() => {
    if (connectionStatus === "connected") loadRoot();
    else {
      setRootNodes([]);
      setSelectedPath(null);
      setFileContent("");
      setSavedContent("");
    }
  }, [connectionStatus, loadRoot]);

  async function handleToggle(node: FileNode) {
    if (!node.isDirectory) return;

    const toggle = (nodes: FileNode[]): FileNode[] =>
      nodes.map((n) => {
        if (n.path === node.path) {
          const expanding = !n.expanded;
          return { ...n, expanded: expanding };
        }
        if (n.children) return { ...n, children: toggle(n.children) };
        return n;
      });

    if (!node.loaded) {
      try {
        const children: RemoteFile[] = await window.api.remoteListFiles(node.path, false);
        const childNodes = children.map(buildNode);
        const patch = (nodes: FileNode[]): FileNode[] =>
          nodes.map((n) => {
            if (n.path === node.path) return { ...n, expanded: true, loaded: true, children: childNodes };
            if (n.children) return { ...n, children: patch(n.children) };
            return n;
          });
        setRootNodes(patch);
      } catch (e: any) {
        setError(e?.message ?? "Failed to load directory");
      }
    } else {
      setRootNodes(toggle);
    }
  }

  async function handleSelect(node: FileNode) {
    if (isDirty) {
      if (!confirm("You have unsaved changes. Discard them?")) return;
    }
    setLoadingFile(true);
    setError(null);
    try {
      const content = await window.api.remoteReadFile(node.path);
      setSelectedPath(node.path);
      setFileContent(content);
      setSavedContent(content);
    } catch (e: any) {
      setError(e?.message ?? "Failed to read file");
    } finally {
      setLoadingFile(false);
    }
  }

  async function handleSave() {
    if (!selectedPath || !isDirty) return;
    setSaving(true);
    try {
      await window.api.remoteWriteFile(selectedPath, fileContent);
      setSavedContent(fileContent);
    } catch (e: any) {
      setError(e?.message ?? "Failed to save file");
    } finally {
      setSaving(false);
    }
  }
  handleSaveRef.current = handleSave;

  async function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (!files.length) return;
    const targetDir = selectedPath
      ? selectedPath.substring(0, selectedPath.lastIndexOf("/")) || "/"
      : "/";
    for (const file of files) {
      const localPath = (file as any).path as string;
      if (!localPath) continue;
      const remotePath = targetDir === "/" ? `/${file.name}` : `${targetDir}/${file.name}`;
      try {
        await window.api.remoteUploadFile(localPath, remotePath);
      } catch (e: any) {
        setError(`Upload failed: ${e?.message}`);
      }
    }
    await loadRoot();
  }

  async function handleDelete() {
    if (!selectedPath) return;
    if (!confirm(`Delete ${selectedPath.split("/").pop()}? This cannot be undone.`)) return;
    try {
      await window.api.remoteDeleteFile(selectedPath);
      setSelectedPath(null);
      setFileContent("");
      setSavedContent("");
      await loadRoot();
    } catch (e: any) {
      setError(e?.message ?? "Failed to delete file");
    }
  }

  const editorTheme = settings.theme === "light" ? "vs-light" : "vs-dark";

  if (connectionStatus !== "connected") {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center space-y-3">
          <Server className="w-12 h-12 mx-auto opacity-20" />
          <p className="text-sm">No active remote connection</p>
          <p className="text-xs opacity-60">Select a server from the left panel to connect</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* File tree */}
      <div
        className={`w-64 flex-shrink-0 border-r border-primary/20 flex flex-col overflow-hidden transition-colors ${dragOver ? "bg-primary/10" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <div className="flex items-center justify-between px-3 py-2 border-b border-primary/20">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Files</span>
          {loadingTree && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
        </div>
        <div className="flex-1 overflow-y-auto py-1">
          {rootNodes.map((node) => (
            <FileNodeRow
              key={node.path}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              onSelect={handleSelect}
              onToggle={handleToggle}
            />
          ))}
          {rootNodes.length === 0 && !loadingTree && (
            <p className="text-xs text-muted-foreground text-center py-6 opacity-60">No files found</p>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-primary/20 bg-card/50">
          {selectedPath && (
            <button
              onClick={() => {
                if (isDirty && !confirm("Discard unsaved changes?")) return;
                setSelectedPath(null);
                setFileContent("");
                setSavedContent("");
              }}
              className="p-1 rounded hover:bg-primary/10 text-muted-foreground hover:text-foreground"
              title="Close file"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex-1 min-w-0">
            {selectedPath ? (
              <span className="text-xs font-mono text-foreground truncate">
                {isDirty && <span className="text-orange-400 mr-1">●</span>}
                {selectedPath}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">Select a file to edit</span>
            )}
          </div>

          {selectedPath && (
            <>
              <button
                onClick={handleDelete}
                className="p-1.5 rounded hover:bg-red-500/20 text-muted-foreground hover:text-red-400"
                title="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-primary text-primary-foreground text-xs font-medium disabled:opacity-40 hover:bg-primary/90"
                title="Save (Ctrl+S)"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </>
          )}
        </div>

        {error && (
          <div className="px-4 py-2 bg-red-500/10 border-b border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        {loadingFile ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : selectedPath ? (
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={getLanguage(selectedPath)}
              value={fileContent}
              theme={editorTheme}
              onChange={(val) => setFileContent(val ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                wordWrap: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
              }}
              onMount={(editor, monaco) => {
                editor.addCommand(
                  monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS,
                  () => { handleSaveRef.current(); }
                );
              }}
            />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a file from the tree to edit it</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
