import React from "react";
import { createPortal } from "react-dom";
import { X, Database } from "lucide-react";
import { BackupManager } from "./BackupManager";
import "./BackupModal.css";

interface BackupModalProps {
  onClose: () => void;
}

export function BackupModal({ onClose }: BackupModalProps) {
  return createPortal(
    <div className="backup-modal-overlay" onClick={onClose}>
      <div className="backup-modal" onClick={(e) => e.stopPropagation()}>
        <div className="backup-modal-header">
          <h2>
            <Database className="icon" size={24} />
            Backup Manager
          </h2>
          <button onClick={onClose} className="close-btn">
            <X size={24} />
          </button>
        </div>
        <div className="backup-modal-content">
          <BackupManager />
        </div>
      </div>
    </div>,
    document.body,
  );
}
