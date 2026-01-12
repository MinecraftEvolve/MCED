import React, { useState, useEffect } from "react";
import { useAppStore } from "@/store";
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

  useEffect(() => {
    loadBackups();
  }, [instancePath]);

  const loadBackups = async () => {
    if (!instancePath) return;

    try {
      const result = await window.api.listBackups(instancePath);
      setBackups(result);
    } catch (error) {}
  };

  const createBackup = async () => {
    if (!instancePath) return;

    setIsCreating(true);
    try {
      await window.api.createBackup(instancePath);
      await loadBackups();
    } catch (error) {
      alert("Failed to create backup: " + error);
    } finally {
      setIsCreating(false);
    }
  };

  const restoreBackup = async (backupId: string) => {
    if (
      !confirm(
        "Are you sure you want to restore this backup? Current configs will be overwritten.",
      )
    ) {
      return;
    }

    try {
      if (!instancePath) return;
      await window.api.restoreBackup(instancePath, backupId);
      alert("Backup restored successfully! The page will reload.");
      window.location.reload();
    } catch (error) {
      alert("Failed to restore backup: " + error);
    }
  };

  const deleteBackup = async (backupId: string) => {
    if (!confirm("Are you sure you want to delete this backup?")) {
      return;
    }

    try {
      if (!instancePath) return;
      await window.api.deleteBackup(instancePath, backupId);
      await loadBackups();
    } catch (error) {
      alert("Failed to delete backup: " + error);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + " KB";
    return (bytes / (1024 * 1024)).toFixed(2) + " MB";
  };

  return (
    <div className="backup-manager">
      <div className="backup-header">
        <h2>Backup Manager</h2>
        <button
          onClick={createBackup}
          disabled={isCreating}
          className="btn-create-backup"
        >
          {isCreating ? "Creating..." : "+ Create Backup"}
        </button>
      </div>

      {backups.length === 0 ? (
        <div className="no-backups">
          <p>No backups yet</p>
          <p className="hint">Create a backup before making major changes</p>
        </div>
      ) : (
        <div className="backup-list">
          {backups.map((backup) => (
            <div key={backup.id} className="backup-item">
              <div className="backup-info">
                <div className="backup-name">{backup.name}</div>
                <div className="backup-meta">
                  {formatDate(backup.timestamp)} • {backup.configCount} configs
                  • {formatSize(backup.size)}
                </div>
              </div>
              <div className="backup-actions">
                <button
                  onClick={() => restoreBackup(backup.id)}
                  className="btn-restore"
                >
                  Restore
                </button>
                <button
                  onClick={() => deleteBackup(backup.id)}
                  className="btn-delete"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
