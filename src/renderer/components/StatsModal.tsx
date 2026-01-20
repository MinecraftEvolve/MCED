import { createPortal } from "react-dom";
import { X, BarChart3, Clock, Edit, TrendingUp } from "lucide-react";
import { useStatsStore } from "@/store/statsStore";
import "./StatsModal.css";

interface StatsModalProps {
  onClose: () => void;
}

export function StatsModal({ onClose }: StatsModalProps) {
  const { getMostEditedMods, getMostEditedSettings, getTotalEdits, getCurrentSessionDuration } =
    useStatsStore();

  const mostEditedMods = getMostEditedMods(5);
  const mostEditedSettings = getMostEditedSettings(10);
  const totalEdits = getTotalEdits();
  const sessionDuration = getCurrentSessionDuration();

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  return createPortal(
    <div className="stats-overlay" onClick={onClose}>
      <div className="stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="stats-header">
          <h2>
            <BarChart3 size={24} />
            Config Statistics
          </h2>
          <button onClick={onClose} className="stats-close-btn">
            <X size={20} />
          </button>
        </div>

        <div className="stats-content">
          {/* Summary Cards */}
          <div className="stats-summary">
            <div className="stat-card">
              <Edit size={20} className="stat-icon" />
              <div className="stat-value">{totalEdits}</div>
              <div className="stat-label">Total Edits</div>
            </div>
            <div className="stat-card">
              <Clock size={20} className="stat-icon" />
              <div className="stat-value">{formatDuration(sessionDuration)}</div>
              <div className="stat-label">Session Time</div>
            </div>
            <div className="stat-card">
              <TrendingUp size={20} className="stat-icon" />
              <div className="stat-value">{mostEditedMods.length}</div>
              <div className="stat-label">Mods Edited</div>
            </div>
          </div>

          {/* Most Edited Mods */}
          <div className="stats-section">
            <h3>Most Edited Mods</h3>
            {mostEditedMods.length > 0 ? (
              <div className="stats-list">
                {mostEditedMods.map((stat, index) => (
                  <div key={stat.modId} className="stats-item">
                    <span className="stats-rank">#{index + 1}</span>
                    <span className="stats-name">{stat.modName}</span>
                    <span className="stats-count">{stat.editCount} edits</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="stats-empty">No data yet</div>
            )}
          </div>

          {/* Most Edited Settings */}
          <div className="stats-section">
            <h3>Most Edited Settings</h3>
            {mostEditedSettings.length > 0 ? (
              <div className="stats-list">
                {mostEditedSettings.map((stat, index) => (
                  <div key={`${stat.modId}:${stat.settingKey}`} className="stats-item">
                    <span className="stats-rank">#{index + 1}</span>
                    <div className="stats-setting">
                      <div className="stats-setting-key">{stat.settingKey}</div>
                      <div className="stats-setting-mod">{stat.modName}</div>
                    </div>
                    <span className="stats-count">{stat.editCount} edits</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="stats-empty">No data yet</div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
