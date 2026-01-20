import { useState } from "react";
import { FolderOpen, Clock, Shield, Zap, Book, Github, Heart } from "lucide-react";
import { RecentInstance } from "../../../shared/types/instance.types";
import { LauncherIcon } from "../LauncherIcon";
import "./LandingPage.css";

interface LandingPageProps {
  onSelectInstance: () => void;
  recentInstances?: RecentInstance[];
}

export function LandingPage({ onSelectInstance, recentInstances = [] }: LandingPageProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  console.log("LandingPage recentInstances:", recentInstances);

  const handleRecentInstance = (instance: RecentInstance) => {
    // Pass path via event or some other method if needed
    // For now, just call without argument
    onSelectInstance();
  };

  const getLauncherIcon = (launcher?: string) => {
    return <LauncherIcon launcher={launcher || "generic"} className="w-4 h-4" />;
  };

  const getLauncherName = (launcher?: string) => {
    switch (launcher) {
      case "modrinth":
        return "Modrinth App";
      case "curseforge":
        return "CurseForge";
      case "prism":
        return "Prism Launcher";
      case "multimc":
        return "MultiMC";
      case "atlauncher":
        return "ATLauncher";
      case "packwiz":
        return "Packwiz";
      default:
        return "Generic Launcher";
    }
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="landing-hero">
        <div className="landing-logo-container">
          <img src="./icon.png" alt="MCED Logo" className="landing-logo" />
        </div>
        <h1 className="landing-title">Minecraft Config Editor</h1>
        <p className="landing-subtitle">Edit your modpack configurations with style and ease</p>

        {/* Primary CTA */}
        <button className="landing-cta-button" onClick={onSelectInstance}>
          <FolderOpen size={20} />
          Open Minecraft Instance
        </button>
      </div>

      {/* Features Grid */}
      <div className="landing-features">
        <div
          className={`landing-feature-card ${hoveredCard === "intelligent" ? "hovered" : ""}`}
          onMouseEnter={() => setHoveredCard("intelligent")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <Zap className="feature-icon" size={48} />
          <h3>Intelligent Detection</h3>
          <p>Automatically detects mods, versions, and config files</p>
        </div>

        <div
          className={`landing-feature-card ${hoveredCard === "modern" ? "hovered" : ""}`}
          onMouseEnter={() => setHoveredCard("modern")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <Shield className="feature-icon" size={48} />
          <h3>Modern UI</h3>
          <p>Beautiful interface with sliders, toggles, and dark mode</p>
        </div>

        <div
          className={`landing-feature-card ${hoveredCard === "safe" ? "hovered" : ""}`}
          onMouseEnter={() => setHoveredCard("safe")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <Shield className="feature-icon" size={48} />
          <h3>Safe Editing</h3>
          <p>Automatic backups and validation before saving</p>
        </div>

        <div
          className={`landing-feature-card ${hoveredCard === "fast" ? "hovered" : ""}`}
          onMouseEnter={() => setHoveredCard("fast")}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <Zap className="feature-icon" size={48} />
          <h3>Lightning Fast</h3>
          <p>Quick search and instant config updates</p>
        </div>
      </div>

      {/* Recent Instances */}
      {recentInstances.length > 0 && (
        <div className="landing-recent">
          <div className="recent-header">
            <Clock size={20} />
            <h2>Recent Instances</h2>
          </div>
          <div className="recent-instances">
            {recentInstances.slice(0, 5).map((instance, index) => {
              const instanceName =
                instance.name || instance.path.split(/[\\/]/).pop() || instance.path;
              return (
                <button
                  key={index}
                  className="recent-instance-card"
                  onClick={() => handleRecentInstance(instance)}
                >
                  <div className="instance-header">
                    {instance.launcher && (
                      <LauncherIcon launcher={instance.launcher} className="w-5 h-5" />
                    )}
                    <span className="instance-name">{instanceName}</span>
                  </div>
                  <div className="instance-info">
                    {instance.minecraftVersion && (
                      <span className="instance-version px-2 py-0.5 bg-green-500/10 text-green-400 rounded text-xs font-medium">
                        MC {instance.minecraftVersion}
                      </span>
                    )}
                    {instance.loader && (
                      <span className="instance-loader px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs font-medium">
                        {instance.loader
                          .split(" ")
                          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")}
                      </span>
                    )}
                  </div>
                  <span className="instance-path">{instance.path}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="landing-quick-actions">
        <h3>Quick Actions</h3>
        <div className="quick-actions-grid">
          <button className="quick-action-btn">
            <Book size={18} />
            View Documentation
          </button>
          <button className="quick-action-btn">
            <Github size={18} />
            Report Issue
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="landing-footer">
        <p>
          Made with <Heart className="heart-icon" size={16} fill="currentColor" /> for the Minecraft
          community
        </p>
        <p className="version">Version 1.0.6</p>
      </div>
    </div>
  );
}
