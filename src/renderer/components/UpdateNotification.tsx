import { useState, useEffect } from "react";
import { Download, X, CheckCircle } from "lucide-react";
import { UpdateInfo } from "../../shared/types/api.types";
import "./UpdateNotification.css";

type UpdateState = "available" | "downloading" | "downloaded" | "installing";

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [state, setState] = useState<UpdateState>("available");
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    // Listen for update notifications
    window.api?.onUpdateAvailable?.((info: UpdateInfo) => {
      if (info.available) {
        setUpdateInfo(info);
        setDismissed(false);
        setState("available");
      }
    });

    // Listen for download progress
    window.api?.onUpdateDownloadProgress?.((progress) => {
      setDownloadProgress(progress.percent);
    });

    // Listen for download complete
    window.api?.onUpdateDownloaded?.(() => {
      setState("downloaded");
    });
  }, []);

  if (!updateInfo || !updateInfo.available || dismissed) {
    return null;
  }

  const handleDownload = async () => {
    setState("downloading");
    try {
      const result = await window.api.downloadUpdate();
      if (!result.success) {
        console.error("Failed to download update:", result.error);
        setState("available");
      }
    } catch (error) {
      console.error("Failed to download update:", error);
      setState("available");
    }
  };

  const handleInstall = async () => {
    setState("installing");
    try {
      await window.api.installUpdate();
    } catch (error) {
      console.error("Failed to install update:", error);
      setState("downloaded");
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  const renderActions = () => {
    switch (state) {
      case "available":
        return (
          <>
            <button onClick={handleDownload} className="update-btn-primary">
              <Download size={16} />
              Download & Install
            </button>
            <button onClick={handleDismiss} className="update-btn-dismiss">
              <X size={16} />
            </button>
          </>
        );

      case "downloading":
        return (
          <div className="update-progress">
            <div className="update-progress-bar">
              <div className="update-progress-fill" style={{ width: `${downloadProgress}%` }} />
            </div>
            <span className="update-progress-text">{downloadProgress.toFixed(0)}%</span>
          </div>
        );

      case "downloaded":
        return (
          <>
            <button onClick={handleInstall} className="update-btn-primary">
              <CheckCircle size={16} />
              Restart & Install
            </button>
            <button onClick={handleDismiss} className="update-btn-dismiss">
              <X size={16} />
            </button>
          </>
        );

      case "installing":
        return <span className="update-installing">Installing...</span>;
    }
  };

  const getMessage = () => {
    switch (state) {
      case "available":
        return `You're currently on v${updateInfo.currentVersion}. A new version is available!`;
      case "downloading":
        return "Downloading update...";
      case "downloaded":
        return "Update downloaded! Restart to install.";
      case "installing":
        return "Installing update...";
    }
  };

  return (
    <div className="update-notification">
      <div className="update-icon">
        <Download size={24} />
      </div>
      <div className="update-content">
        <div className="update-title">Update Available: v{updateInfo.latestVersion}</div>
        <div className="update-message">{getMessage()}</div>
      </div>
      <div className="update-actions">{renderActions()}</div>
    </div>
  );
}
