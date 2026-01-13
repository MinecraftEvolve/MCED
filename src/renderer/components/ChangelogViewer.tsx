import { createPortal } from 'react-dom';
import { X, History, Download, RotateCcw } from 'lucide-react';
import { useChangelogStore, ChangeLogEntry } from '@/store/changelogStore';
import './ChangelogViewer.css';

interface ChangelogViewerProps {
  onClose: () => void;
}

export function ChangelogViewer({ onClose }: ChangelogViewerProps) {
  const { getRecentChanges, getAllSessions, getSessionChanges, exportChangelog } = useChangelogStore();

  const recentChanges = getRecentChanges(50);
  const sessions = getAllSessions();

  const handleExport = () => {
    const data = exportChangelog();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mced-changelog-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return 'null';
    if (typeof value === 'boolean') return value ? 'true' : 'false';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const groupBySession = (entries: ChangeLogEntry[]) => {
    const grouped = new Map<string, ChangeLogEntry[]>();
    entries.forEach((entry) => {
      const existing = grouped.get(entry.sessionId) || [];
      grouped.set(entry.sessionId, [...existing, entry]);
    });
    return grouped;
  };

  const sessionGroups = groupBySession(recentChanges);

  return createPortal(
    <div className="changelog-overlay" onClick={onClose}>
      <div className="changelog-modal" onClick={(e) => e.stopPropagation()}>
        <div className="changelog-header">
          <h2>
            <History size={24} />
            Change History
          </h2>
          <div className="changelog-actions">
            <button onClick={handleExport} className="changelog-btn">
              <Download size={16} />
              Export
            </button>
            <button onClick={onClose} className="changelog-close-btn">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="changelog-content">
          {recentChanges.length === 0 ? (
            <div className="changelog-empty">
              <History size={48} />
              <p>No changes recorded yet</p>
            </div>
          ) : (
            <div className="changelog-sessions">
              {Array.from(sessionGroups.entries()).map(([sessionId, entries]) => (
                <div key={sessionId} className="changelog-session">
                  <div className="changelog-session-header">
                    <span className="changelog-session-id">
                      Session {new Date(entries[0].timestamp).toLocaleString()}
                    </span>
                    <span className="changelog-session-count">
                      {entries.length} changes
                    </span>
                  </div>
                  <div className="changelog-entries">
                    {entries.map((entry) => (
                      <div key={entry.id} className="changelog-entry">
                        <div className="changelog-entry-header">
                          <span className="changelog-mod">{entry.modName}</span>
                          <span className="changelog-time">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="changelog-setting">{entry.settingKey}</div>
                        <div className="changelog-change">
                          <span className="changelog-old">{formatValue(entry.oldValue)}</span>
                          <span className="changelog-arrow">→</span>
                          <span className="changelog-new">{formatValue(entry.newValue)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
