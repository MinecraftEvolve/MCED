import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store";
import { FolderArchive, Download, Trash2, Clock, Edit2, AlertTriangle } from "lucide-react";
import { Toast } from "../ConfirmDialog";
import "./BackupManager.css";

interface Backup {
  id: string;
  timestamp: number;
  name: string;
  size: number;
  configCount: number;
}

export function BackupManager() {
  const { currentInstance } = useAppStore();
  const instancePath = currentInstance?.path;
  const [backups, setBackups] = useState<Backup[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [backupName, setBackupName] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<string | null>(null);
  const [showRestoreDialog, setShowRestoreDialog] = useState(false);
  const [backupToRestore, setBackupToRestore] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    isOpen: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    message: "",
    type: "info",
  });

  useEffect(() => {
    loadBackups();
  }, [instancePath]);

  const loadBackups = async () => {
    if (!instancePath) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const result = await window.api.listBackups(instancePath);
      setBackups(result);
    } catch (error) {
      console.error("Failed to load backups:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = () => {
    setShowNameDialog(true);
    setBackupName("");
    (window as any)._renamingBackupId = null;
  };

  const createBackup = async () => {
    if (!instancePath) return;

    const renamingId = (window as any)._renamingBackupId;

    setIsCreating(true);
    setShowNameDialog(false);

    try {
      if (renamingId) {
        // Rename existing backup
        await window.api.renameBackup(instancePath, renamingId, backupName.trim());
      } else {
        // Create new backup
        await window.api.createBackup(instancePath, backupName.trim() || undefined);
      }
      await loadBackups();
      (window as any)._renamingBackupId = null;
    } catch (error) {
      setToast({
        isOpen: true,
        message: `Failed to ${renamingId ? "rename" : "create"} backup: ` + error,
        type: "error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    setBackupToRestore(backupId);
    setShowRestoreDialog(true);
  };

  const confirmRestore = async () => {
    if (!backupToRestore || !instancePath) return;

    try {
      await window.api.restoreBackup(instancePath, backupToRestore);
      setShowRestoreDialog(false);
      setBackupToRestore(null);
      // Show success and reload
      setTimeout(() => {
        window.location.reload();
      }, 100);
    } catch (error) {
      console.error("Failed to restore backup:", error);
      setShowRestoreDialog(false);
      setBackupToRestore(null);
    }
  };

  const deleteBackup = async (backupId: string) => {
    setBackupToDelete(backupId);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!backupToDelete || !instancePath) return;

    try {
      await window.api.deleteBackup(instancePath, backupToDelete);
      await loadBackups();
      setShowDeleteDialog(false);
      setBackupToDelete(null);
    } catch (error) {
      setToast({
        isOpen: true,
        message: "Failed to delete backup: " + error,
        type: "error",
      });
    }
  };

  const handleRenameBackup = (backup: Backup) => {
    setBackupName(backup.name);
    setShowNameDialog(true);
    // Store which backup we're renaming
    (window as any)._renamingBackupId = backup.id;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  if (!currentInstance) {
    return (
      <div className="backup-empty-state">
        <FolderArchive size={48} className="empty-icon" />
        <p>No instance loaded</p>
        <p className="hint">Open a Minecraft instance to manage backups</p>
      </div>
    );
  }

  return (
    <div className="backup-manager">
      <div className="backup-header">
        <button
          onClick={handleCreateBackup}
          disabled={isCreating || isLoading}
          className="btn-create-backup"
        >
          <FolderArchive size={16} />
          {isCreating ? "Creating..." : "Create Backup"}
        </button>
      </div>

      {isLoading ? (
        <div className="backup-loading">
          <div className="spinner" />
          <p>Loading backups...</p>
        </div>
      ) : backups.length === 0 ? (
        <div className="backup-empty-state">
          <Clock size={40} className="empty-icon" />
          <p>No backups yet</p>
          <p className="hint">Create a backup before making major changes</p>
        </div>
      ) : (
        <div className="backup-list">
          {backups.map((backup) => (
            <div key={backup.id} className="backup-item">
              <div className="backup-info">
                <div className="backup-name">
                  <FolderArchive size={16} />
                  {backup.name}
                </div>
                <div className="backup-meta">
                  <Clock size={12} />
                  {formatDate(backup.timestamp)} • {backup.configCount} configs •{" "}
                  {formatSize(backup.size)}
                </div>
              </div>
              <div className="backup-actions">
                <button
                  onClick={() => handleRenameBackup(backup)}
                  className="btn-rename"
                  title="Rename this backup"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => restoreBackup(backup.id)}
                  className="btn-restore"
                  title="Restore this backup"
                >
                  <Download size={14} />
                  Restore
                </button>
                <button
                  onClick={() => deleteBackup(backup.id)}
                  className="btn-delete"
                  title="Delete this backup"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showNameDialog && (
        <div className="backup-dialog-overlay">
          <div className="backup-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>{(window as any)._renamingBackupId ? "Rename Backup" : "Create Backup"}</h3>
            <p className="dialog-description">
              {(window as any)._renamingBackupId
                ? "Give your backup a new name"
                : "Give your backup a memorable name (optional)"}
            </p>
            <input
              type="text"
              value={backupName}
              onChange={(e) => setBackupName(e.target.value)}
              placeholder="e.g., Before Mod Update, Working Config"
              className="backup-name-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") createBackup();
                if (e.key === "Escape") {
                  setShowNameDialog(false);
                  (window as any)._renamingBackupId = null;
                }
              }}
            />
            <div className="dialog-actions">
              <button
                onClick={() => {
                  setShowNameDialog(false);
                  (window as any)._renamingBackupId = null;
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button onClick={createBackup} className="btn-confirm">
                <FolderArchive size={14} />
                {(window as any)._renamingBackupId ? "Save" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteDialog && (
        <div className="backup-dialog-overlay">
          <div className="backup-dialog delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="delete-dialog-icon">
              <Trash2 size={32} />
            </div>
            <h3>Delete Backup?</h3>
            <p className="dialog-description">
              Are you sure you want to delete this backup? This action cannot be undone.
            </p>
            <div className="dialog-actions">
              <button
                onClick={() => {
                  setShowDeleteDialog(false);
                  setBackupToDelete(null);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button onClick={confirmDelete} className="btn-delete-confirm">
                <Trash2 size={14} />
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {showRestoreDialog && (
        <div className="backup-dialog-overlay">
          <div className="backup-dialog delete-dialog" onClick={(e) => e.stopPropagation()}>
            <div
              className="delete-dialog-icon"
              style={{
                background:
                  "linear-gradient(135deg, hsl(var(--primary) / 0.1) 0%, hsl(var(--primary) / 0.05) 100%)",
                borderColor: "hsl(var(--primary) / 0.2)",
              }}
            >
              <Download size={32} style={{ color: "hsl(var(--primary))" }} />
            </div>
            <h3 style={{ color: "hsl(var(--primary))" }}>Restore Backup?</h3>
            <p className="dialog-description">
              This will overwrite all current config files. Any unsaved changes will be lost. The
              app will reload after restoration.
            </p>
            <div className="dialog-actions">
              <button
                onClick={() => {
                  setShowRestoreDialog(false);
                  setBackupToRestore(null);
                }}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button
                onClick={confirmRestore}
                className="btn-delete-confirm"
                style={{
                  background:
                    "linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.85) 100%)",
                  boxShadow: "0 2px 8px hsl(var(--primary) / 0.3)",
                }}
              >
                <Download size={14} />
                Restore Backup
              </button>
            </div>
          </div>
        </div>
      )}

      <Toast
        isOpen={toast.isOpen}
        onClose={() => setToast({ ...toast, isOpen: false })}
        message={toast.message}
        type={toast.type}
      />
    </div>
  );
}
