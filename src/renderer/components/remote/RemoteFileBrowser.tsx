import React, { useEffect, useState, useCallback } from "react";
import {
  Folder,
  FolderOpen,
  FileText,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { RemoteFile } from "../../../shared/types/remote.types";
import { useRemoteConnectionStore } from "../../store/remoteConnectionStore";
import { ConfirmDialog } from "../common/Dialog";

interface FileNode extends RemoteFile {
  children?: FileNode[];
  loaded?: boolean;
  expanded?: boolean;
}

function getLanguage(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  switch (ext) {
    case "json":
    case "json5":
      return "json";
    case "toml":
      return "toml";
    case "yml":
    case "yaml":
      return "yaml";
    case "properties":
    case "cfg":
      return "properties";
    default:
      return "plaintext";
  }
}

export const RemoteFileBrowser: React.FC = () => {
  const { activeConnectionId, connectionStatus } = useRemoteConnectionStore();

  const [rootFiles, setRootFiles] = useState<FileNode[]>([]);
  const [loadingRoot, setLoadingRoot] = useState(false);
  const [rootError, setRootError] = useState<string | null>(null);

  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [loadingFile, setLoadingFile] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);

  const [editedContent, setEditedContent] = useState<string>("");
  const [isDirty, setIsDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const [confirmDelete, setConfirmDelete] = useState(false);

  const isConnected = connectionStatus === "connected" && !!activeConnectionId;

  const loadRoot = useCallback(async () => {
    if (!isConnected) return;
    setLoadingRoot(true);
    setRootError(null);
    const result = await window.api.remoteListFiles(undefined, false);
    setLoadingRoot(false);
    if (result.success && result.data) {
      setRootFiles(
        result.data.map((f: RemoteFile) => ({ ...f, children: f.isDirectory ? [] : undefined, loaded: false, expanded: false }))
      );
    } else {
      setRootError(result.error ?? "Failed to load files");
    }
  }, [isConnected]);

  useEffect(() => {
    if (isConnected) {
      loadRoot();
      setSelectedFile(null);
      setFileContent("");
      setEditedContent("");
      setIsDirty(false);
    } else {
      setRootFiles([]);
      setSelectedFile(null);
    }
  }, [isConnected, activeConnectionId]);

  const loadDirectory = async (node: FileNode, updateTree: (updater: (nodes: FileNode[]) => FileNode[]) => void) => {
    if (!isConnected || !node.isDirectory) return;
    const result = await window.api.remoteListFiles(node.path, false);
    if (result.success && result.data) {
      const children: FileNode[] = result.data.map((f: RemoteFile) => ({
        ...f,
        children: f.isDirectory ? [] : undefined,
        loaded: false,
        expanded: false,
      }));
      updateTree((prev) => updateNodeInTree(prev, node.path, (n) => ({ ...n, children, loaded: true, expanded: true })));
    }
  };

  function updateNodeInTree(
    nodes: FileNode[],
    path: string,
    updater: (node: FileNode) => FileNode
  ): FileNode[] {
    return nodes.map((n) => {
      if (n.path === path) return updater(n);
      if (n.children) return { ...n, children: updateNodeInTree(n.children, path, updater) };
      return n;
    });
  }

  const toggleDirectory = async (node: FileNode) => {
    if (!node.isDirectory) return;
    if (!node.expanded) {
      if (!node.loaded) {
        await loadDirectory(node, (updater) => setRootFiles(updater));
      } else {
        setRootFiles((prev) =>
          updateNodeInTree(prev, node.path, (n) => ({ ...n, expanded: true }))
        );
      }
    } else {
      setRootFiles((prev) =>
        updateNodeInTree(prev, node.path, (n) => ({ ...n, expanded: false }))
      );
    }
  };

  const openFile = async (node: FileNode) => {
    if (node.isDirectory) {
      await toggleDirectory(node);
      return;
    }
    if (isDirty && selectedFile) {
      const ok = window.confirm("You have unsaved changes. Discard them?");
      if (!ok) return;
    }
    setSelectedFile(node);
    setLoadingFile(true);
    setFileError(null);
    setIsDirty(false);
    setSaveMessage(null);
    const result = await window.api.remoteReadFile(node.path);
    setLoadingFile(false);
    if (result.success && result.data !== undefined) {
      setFileContent(result.data);
      setEditedContent(result.data);
    } else {
      setFileError(result.error ?? "Failed to read file");
    }
  };

  const handleSave = async () => {
    if (!selectedFile || !isDirty) return;
    setSaving(true);
    setSaveMessage(null);
    const result = await window.api.remoteWriteFile(selectedFile.path, editedContent);
    setSaving(false);
    if (result.success) {
      setFileContent(editedContent);
      setIsDirty(false);
      setSaveMessage("Saved");
      setTimeout(() => setSaveMessage(null), 2000);
    } else {
      setSaveMessage(`Error: ${result.error ?? "Failed to save"}`);
    }
  };

  const handleDelete = async () => {
    if (!selectedFile) return;
    const result = await window.api.remoteDeleteFile(selectedFile.path);
    setConfirmDelete(false);
    if (result.success) {
      setSelectedFile(null);
      setFileContent("");
      setEditedContent("");
      setIsDirty(false);
      await loadRoot();
    }
  };

  const handleEditorChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedContent(e.target.value);
    setIsDirty(e.target.value !== fileContent);
  };

  const FileNodeRow: React.FC<{ node: FileNode; depth: number }> = ({ node, depth }) => {
    const isSelected = selectedFile?.path === node.path;
    const indent = depth * 16;

    return (
      <>
        <button
          onClick={() => openFile(node)}
          className={`w-full flex items-center gap-1.5 px-2 py-1 rounded text-sm text-left transition-colors ${
            isSelected
              ? "bg-purple-500/20 text-purple-300"
              : "hover:bg-secondary text-foreground"
          }`}
          style={{ paddingLeft: `${8 + indent}px` }}
        >
          {node.isDirectory ? (
            node.expanded ? (
              <>
                <ChevronDown className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                <FolderOpen className="w-4 h-4 shrink-0 text-yellow-400" />
              </>
            ) : (
              <>
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                <Folder className="w-4 h-4 shrink-0 text-yellow-400" />
              </>
            )
          ) : (
            <>
              <span className="w-3.5 h-3.5 shrink-0" />
              <FileText className="w-4 h-4 shrink-0 text-blue-400" />
            </>
          )}
          <span className="truncate">{node.name}</span>
        </button>
        {node.isDirectory && node.expanded && node.children && (
          <>
            {node.children.map((child) => (
              <FileNodeRow key={child.path} node={child} depth={depth + 1} />
            ))}
          </>
        )}
      </>
    );
  };

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center p-8">
        <Server className="w-16 h-16 mb-4 opacity-20" />
        <p className="text-lg font-medium text-foreground">Not connected</p>
        <p className="text-sm mt-1">Connect to a remote server to browse and edit its config files</p>
      </div>
    );
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* File Tree */}
      <div className="w-64 flex-shrink-0 border-r border-primary/20 flex flex-col">
        <div className="flex items-center justify-between px-3 py-2 border-b border-primary/20">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Files</span>
          <button
            onClick={loadRoot}
            disabled={loadingRoot}
            className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingRoot ? "animate-spin" : ""}`} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-1">
          {loadingRoot ? (
            <div className="flex items-center justify-center h-20 text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : rootError ? (
            <div className="flex items-center gap-2 p-3 text-destructive text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {rootError}
            </div>
          ) : rootFiles.length === 0 ? (
            <p className="text-xs text-muted-foreground text-center p-4">No files found</p>
          ) : (
            rootFiles.map((node) => <FileNodeRow key={node.path} node={node} depth={0} />)
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {selectedFile ? (
          <>
            {/* File toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/20 bg-card/50">
              <button
                onClick={() => {
                  if (isDirty && !window.confirm("Discard unsaved changes?")) return;
                  setSelectedFile(null);
                  setIsDirty(false);
                }}
                className="p-1 hover:bg-secondary rounded transition-colors text-muted-foreground hover:text-foreground"
                title="Close file"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-mono text-foreground flex-1 truncate">
                {selectedFile.path}
                {isDirty && <span className="ml-1 text-yellow-400">*</span>}
              </span>

              {saveMessage && (
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    saveMessage.startsWith("Error")
                      ? "text-destructive bg-destructive/10"
                      : "text-green-400 bg-green-500/10"
                  }`}
                >
                  {saveMessage}
                </span>
              )}

              <button
                onClick={() => setConfirmDelete(true)}
                className="p-1.5 hover:bg-destructive/10 rounded transition-colors text-muted-foreground hover:text-destructive"
                title="Delete file"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty || saving}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save (Ctrl+S)"
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>

            {/* Editor */}
            {loadingFile ? (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : fileError ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-5 h-5" />
                  {fileError}
                </div>
              </div>
            ) : (
              <textarea
                value={editedContent}
                onChange={handleEditorChange}
                onKeyDown={(e) => {
                  if ((e.ctrlKey || e.metaKey) && e.key === "s") {
                    e.preventDefault();
                    handleSave();
                  }
                }}
                spellCheck={false}
                className="flex-1 w-full p-4 bg-background font-mono text-sm text-foreground resize-none focus:outline-none border-none"
                style={{ tabSize: 2 }}
                placeholder="File is empty"
              />
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-center">
            <div>
              <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm">Select a file from the tree to edit</p>
            </div>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDelete}
        title="Delete File"
        message={`Delete "${selectedFile?.name}"? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
};

// Fix missing import
function Server(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" />
      <line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  );
}
