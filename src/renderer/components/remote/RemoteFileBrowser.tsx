import React, { useEffect, useState, useCallback, useRef } from "react";
import Editor from "@monaco-editor/react";
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
  Server,
} from "lucide-react";
import { RemoteFile } from "../../../shared/types/remote.types";
import { useRemoteConnectionStore } from "../../store/remoteConnectionStore";
import { ConfirmDialog } from "../common/Dialog";
import { useSettingsStore } from "../../store/settingsStore";

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
      return "ini"; // Monaco has no native TOML; ini is close
    case "yml":
    case "yaml":
      return "yaml";
    case "properties":
    case "cfg":
      return "ini";
    case "js":
    case "ts":
      return "javascript";
    default:
      return "plaintext";
  }
}

export const RemoteFileBrowser: React.FC = () => {
  const { activeConnectionId, connectionStatus } = useRemoteConnectionStore();
  const { settings } = useSettingsStore();
  const editorRef = useRef<any>(null);

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
  const editorTheme = settings.theme === "light" ? "vs-light" : "vs-dark";

  const loadRoot = useCallback(async () => {
    if (!isConnected) return;
    setLoadingRoot(true);
    setRootError(null);
    const result = await window.api.remoteListFiles(undefined, false);
    setLoadingRoot(false);
    if (result.success && result.data) {
      setRootFiles(
        result.data.map((f: RemoteFile) => ({
          ...f,
          children: f.isDirectory ? [] : undefined,
          loaded: false,
          expanded: false,
        }))
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

  const updateNodeInTree = (
    nodes: FileNode[],
    path: string,
    updater: (node: FileNode) => FileNode
  ): FileNode[] =>
    nodes.map((n) => {
      if (n.path === path) return updater(n);
      if (n.children) return { ...n, children: updateNodeInTree(n.children, path, updater) };
      return n;
    });

  const loadDirectory = async (node: FileNode) => {
    const result = await window.api.remoteListFiles(node.path, false);
    if (result.success && result.data) {
      const children: FileNode[] = result.data.map((f: RemoteFile) => ({
        ...f,
        children: f.isDirectory ? [] : undefined,
        loaded: false,
        expanded: false,
      }));
      setRootFiles((prev) =>
        updateNodeInTree(prev, node.path, (n) => ({ ...n, children, loaded: true, expanded: true }))
      );
    }
  };

  const toggleDirectory = async (node: FileNode) => {
    if (!node.expanded) {
      if (!node.loaded) {
        await loadDirectory(node);
      } else {
        setRootFiles((prev) => updateNodeInTree(prev, node.path, (n) => ({ ...n, expanded: true })));
      }
    } else {
      setRootFiles((prev) => updateNodeInTree(prev, node.path, (n) => ({ ...n, expanded: false })));
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

  const handleSave = useCallback(async () => {
    if (!selectedFile || !isDirty) return;
    setSaving(true);
    setSaveMessage(null);
    const contentToSave = editorRef.current?.getValue() ?? editedContent;
    const result = await window.api.remoteWriteFile(selectedFile.path, contentToSave);
    setSaving(false);
    if (result.success) {
      setFileContent(contentToSave);
      setEditedContent(contentToSave);
      setIsDirty(false);
      setSaveMessage("Saved");
      setTimeout(() => setSaveMessage(null), 2000);
    } else {
      setSaveMessage(`Error: ${result.error ?? "Failed to save"}`);
    }
  }, [selectedFile, isDirty, editedContent]);

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

  const handleEditorMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    editor.updateOptions({
      fontSize: 13,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: "off",
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      handleSave();
    });
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditedContent(value);
      setIsDirty(value !== fileContent);
    }
  };

  const FileNodeRow: React.FC<{ node: FileNode; depth: number }> = ({ node, depth }) => {
    const isSelected = selectedFile?.path === node.path;
    return (
      <>
        <button
          onClick={() => openFile(node)}
          className={`w-full flex items-center gap-1.5 py-1 rounded text-sm text-left transition-colors ${
            isSelected
              ? "bg-purple-500/20 text-purple-300"
              : "hover:bg-secondary text-foreground"
          }`}
          style={{ paddingLeft: `${8 + depth * 16}px`, paddingRight: "8px" }}
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
      <div className="w-60 flex-shrink-0 border-r border-primary/20 flex flex-col">
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
            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-primary/20 bg-card/50 flex-shrink-0">
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
                {isDirty && <span className="ml-1 text-yellow-400">●</span>}
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
              >
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            </div>

            {/* Monaco Editor or states */}
            <div className="flex-1 overflow-hidden relative">
              {loadingFile ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : fileError ? (
                <div className="flex items-center justify-center h-full">
                  <div className="flex items-center gap-2 text-destructive text-sm">
                    <AlertCircle className="w-5 h-5" />
                    {fileError}
                  </div>
                </div>
              ) : (
                <Editor
                  height="100%"
                  language={getLanguage(selectedFile.path)}
                  value={editedContent}
                  onChange={handleEditorChange}
                  onMount={handleEditorMount}
                  theme={editorTheme}
                  options={{
                    readOnly: false,
                    domReadOnly: false,
                  }}
                />
              )}
            </div>

            {/* Footer hint */}
            <div className="px-4 py-1 border-t border-primary/10 flex items-center text-xs text-muted-foreground bg-card/30 flex-shrink-0">
              <span>Ctrl+S to save</span>
              <span className="mx-2">·</span>
              <span>{getLanguage(selectedFile.path)}</span>
              {selectedFile.size > 0 && (
                <>
                  <span className="mx-2">·</span>
                  <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </>
              )}
            </div>
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
