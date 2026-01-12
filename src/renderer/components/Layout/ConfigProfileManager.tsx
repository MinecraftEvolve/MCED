import React, { useState } from "react";
import { Download, Upload, Save, Trash2 } from "lucide-react";
import { useAppStore } from "@/store";
import "./ConfigProfileManager.css";

interface ConfigProfile {
  name: string;
  description: string;
  configs: Record<string, any>;
  createdAt: string;
}

export function ConfigProfileManager() {
  const [showDialog, setShowDialog] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [profileDescription, setProfileDescription] = useState("");
  const [savedProfiles, setSavedProfiles] = useState<ConfigProfile[]>([]);
  const currentInstance = useAppStore((state) => state.currentInstance);
  const configFiles = useAppStore((state) => state.configFiles);

  const handleSaveProfile = () => {
    if (!profileName.trim()) return;

    const profile: ConfigProfile = {
      name: profileName,
      description: profileDescription,
      configs: {}, // TODO: Extract config content from configFiles
      createdAt: new Date().toISOString(),
    };

    setSavedProfiles([...savedProfiles, profile]);
    setProfileName("");
    setProfileDescription("");
    setShowDialog(false);

    // Save to localStorage
    localStorage.setItem(
      `config-profiles-${currentInstance?.name}`,
      JSON.stringify([...savedProfiles, profile]),
    );
  };

  const handleLoadProfile = (profile: ConfigProfile) => {
    if (
      confirm(
        `Load profile "${profile.name}"? This will replace current configs.`,
      )
    ) {
      // TODO: Load profile configs back into configFiles
      // useAppStore.setState({ configFiles: ... });
    }
  };

  const handleExportProfile = (profile: ConfigProfile) => {
    const dataStr = JSON.stringify(profile, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${profile.name.replace(/\s+/g, "-")}-profile.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const handleImportProfile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const profile = JSON.parse(event.target?.result as string);
          setSavedProfiles([...savedProfiles, profile]);
          localStorage.setItem(
            `config-profiles-${currentInstance?.name}`,
            JSON.stringify([...savedProfiles, profile]),
          );
        } catch (error) {
          alert("Failed to import profile: Invalid file format");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleDeleteProfile = (index: number) => {
    if (confirm("Delete this profile?")) {
      const newProfiles = savedProfiles.filter((_, i) => i !== index);
      setSavedProfiles(newProfiles);
      localStorage.setItem(
        `config-profiles-${currentInstance?.name}`,
        JSON.stringify(newProfiles),
      );
    }
  };

  return (
    <div className="config-profile-manager">
      <div className="profile-actions">
        <button onClick={() => setShowDialog(true)} className="btn-profile">
          <Save size={16} />
          Save Profile
        </button>
        <button onClick={handleImportProfile} className="btn-profile">
          <Upload size={16} />
          Import
        </button>
      </div>

      {showDialog && (
        <div
          className="profile-dialog-overlay"
          onClick={() => setShowDialog(false)}
        >
          <div className="profile-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>Save Configuration Profile</h3>
            <input
              type="text"
              placeholder="Profile name"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="profile-input"
            />
            <textarea
              placeholder="Description (optional)"
              value={profileDescription}
              onChange={(e) => setProfileDescription(e.target.value)}
              className="profile-textarea"
              rows={3}
            />
            <div className="profile-dialog-actions">
              <button
                onClick={() => setShowDialog(false)}
                className="btn-cancel"
              >
                Cancel
              </button>
              <button onClick={handleSaveProfile} className="btn-save">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {savedProfiles.length > 0 && (
        <div className="saved-profiles">
          <h4>Saved Profiles</h4>
          {savedProfiles.map((profile, index) => (
            <div key={index} className="profile-card">
              <div className="profile-info">
                <div className="profile-name">{profile.name}</div>
                {profile.description && (
                  <div className="profile-description">
                    {profile.description}
                  </div>
                )}
                <div className="profile-date">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>
              <div className="profile-actions">
                <button
                  onClick={() => handleLoadProfile(profile)}
                  className="btn-icon"
                  title="Load profile"
                >
                  <Download size={16} />
                </button>
                <button
                  onClick={() => handleExportProfile(profile)}
                  className="btn-icon"
                  title="Export profile"
                >
                  <Upload size={16} />
                </button>
                <button
                  onClick={() => handleDeleteProfile(index)}
                  className="btn-icon btn-danger"
                  title="Delete profile"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
