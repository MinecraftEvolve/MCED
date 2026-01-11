import React, { useState } from 'react';
import { useAppStore } from '@/store';
import './ProfileManager.css';

interface Profile {
  id: string;
  name: string;
  description: string;
  configs: Record<string, any>;
  createdAt: string;
}

export function ProfileManager() {
  const { configData, setConfigData } = useAppStore();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [profileName, setProfileName] = useState('');
  const [profileDescription, setProfileDescription] = useState('');
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;

    const newProfile: Profile = {
      id: Date.now().toString(),
      name: profileName,
      description: profileDescription,
      configs: { ...configData },
      createdAt: new Date().toISOString(),
    };

    setProfiles([...profiles, newProfile]);
    
    // Save to localStorage
    const saved = JSON.parse(localStorage.getItem('config-profiles') || '[]');
    localStorage.setItem('config-profiles', JSON.stringify([...saved, newProfile]));

    setProfileName('');
    setProfileDescription('');
    setShowDialog(false);
  };

  const handleLoadProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      setConfigData(profile.configs);
      setSelectedProfile(profileId);
    }
  };

  const handleDeleteProfile = (profileId: string) => {
    const updated = profiles.filter(p => p.id !== profileId);
    setProfiles(updated);
    localStorage.setItem('config-profiles', JSON.stringify(updated));
    if (selectedProfile === profileId) {
      setSelectedProfile(null);
    }
  };

  const handleExportProfile = (profileId: string) => {
    const profile = profiles.find(p => p.id === profileId);
    if (profile) {
      const dataStr = JSON.stringify(profile, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${profile.name.replace(/\s+/g, '-')}.json`;
      link.click();
      URL.revokeObjectURL(url);
    }
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('config-profiles');
    if (saved) {
      setProfiles(JSON.parse(saved));
    }
  }, []);

  return (
    <div className="profile-manager">
      <div className="profile-header">
        <h3>Config Profiles</h3>
        <button className="btn-primary" onClick={() => setShowDialog(true)}>
          💾 Save Current Config
        </button>
      </div>

      {profiles.length === 0 ? (
        <div className="empty-state">
          <p>No saved profiles yet</p>
          <p className="hint">Save your current configuration to quickly switch between setups</p>
        </div>
      ) : (
        <div className="profiles-grid">
          {profiles.map(profile => (
            <div 
              key={profile.id} 
              className={`profile-card ${selectedProfile === profile.id ? 'active' : ''}`}
            >
              <div className="profile-info">
                <h4>{profile.name}</h4>
                <p>{profile.description}</p>
                <span className="profile-date">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="profile-actions">
                <button 
                  className="btn-load"
                  onClick={() => handleLoadProfile(profile.id)}
                  title="Load this profile"
                >
                  📂 Load
                </button>
                <button 
                  className="btn-export"
                  onClick={() => handleExportProfile(profile.id)}
                  title="Export as JSON"
                >
                  📤 Export
                </button>
                <button 
                  className="btn-delete"
                  onClick={() => handleDeleteProfile(profile.id)}
                  title="Delete this profile"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showDialog && (
        <div className="modal-overlay" onClick={() => setShowDialog(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Save Config Profile</h3>
            <div className="form-group">
              <label>Profile Name</label>
              <input
                type="text"
                value={profileName}
                onChange={e => setProfileName(e.target.value)}
                placeholder="e.g., Performance Build"
                autoFocus
              />
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                value={profileDescription}
                onChange={e => setProfileDescription(e.target.value)}
                placeholder="Describe this configuration..."
                rows={3}
              />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDialog(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                onClick={handleSaveProfile}
                disabled={!profileName.trim()}
              >
                Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
