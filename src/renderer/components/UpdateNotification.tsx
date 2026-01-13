import { useState, useEffect } from 'react';
import { Download, X, ExternalLink } from 'lucide-react';
import { UpdateInfo } from '../../shared/types/api.types';
import './UpdateNotification.css';

export function UpdateNotification() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Listen for update notifications
    window.api?.onUpdateAvailable?.((info: UpdateInfo) => {
      if (info.available) {
        setUpdateInfo(info);
        setDismissed(false);
      }
    });
  }, []);

  if (!updateInfo || !updateInfo.available || dismissed) {
    return null;
  }

  const handleDownload = () => {
    if (updateInfo.downloadUrl) {
      window.open(updateInfo.downloadUrl, '_blank');
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
  };

  return (
    <div className="update-notification">
      <div className="update-icon">
        <Download size={24} />
      </div>
      <div className="update-content">
        <div className="update-title">
          Update Available: v{updateInfo.latestVersion}
        </div>
        <div className="update-message">
          You're currently on v{updateInfo.currentVersion}. A new version is available!
        </div>
      </div>
      <div className="update-actions">
        <button onClick={handleDownload} className="update-btn-primary">
          <ExternalLink size={16} />
          Download
        </button>
        <button onClick={handleDismiss} className="update-btn-dismiss">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
