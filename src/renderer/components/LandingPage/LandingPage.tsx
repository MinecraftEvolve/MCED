import { useState } from 'react';
import { FolderOpen, Clock, Star, Book, Github } from 'lucide-react';
import './LandingPage.css';

interface LandingPageProps {
  onSelectInstance: (path?: string) => void;
  recentInstances?: string[];
}

export function LandingPage({ onSelectInstance, recentInstances = [] }: LandingPageProps) {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleRecentInstance = (path: string) => {
    onSelectInstance(path);
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <div className="landing-hero">
        <div className="landing-logo-container">
          <img src="/icon.png" alt="MCED Logo" className="landing-logo" />
        </div>
        <h1 className="landing-title">
          Minecraft Config Editor
        </h1>
        <p className="landing-subtitle">
          Edit your modpack configurations with style and ease
        </p>
        
        {/* Primary CTA */}
        <button
          className="landing-cta-button"
          onClick={onSelectInstance}
        >
          <FolderOpen size={20} />
          Open Minecraft Instance
        </button>
      </div>

      {/* Features Grid */}
      <div className="landing-features">
        <div
          className={`landing-feature-card ${hoveredCard === 'intelligent' ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredCard('intelligent')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="feature-icon">🧠</div>
          <h3>Intelligent Detection</h3>
          <p>Automatically detects mods, versions, and config files</p>
        </div>

        <div
          className={`landing-feature-card ${hoveredCard === 'modern' ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredCard('modern')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="feature-icon">✨</div>
          <h3>Modern UI</h3>
          <p>Beautiful interface with sliders, toggles, and dark mode</p>
        </div>

        <div
          className={`landing-feature-card ${hoveredCard === 'safe' ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredCard('safe')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="feature-icon">🛡️</div>
          <h3>Safe Editing</h3>
          <p>Automatic backups and validation before saving</p>
        </div>

        <div
          className={`landing-feature-card ${hoveredCard === 'fast' ? 'hovered' : ''}`}
          onMouseEnter={() => setHoveredCard('fast')}
          onMouseLeave={() => setHoveredCard(null)}
        >
          <div className="feature-icon">⚡</div>
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
              const instanceName = instance.split(/[\\/]/).pop() || instance;
              return (
                <button
                  key={index}
                  className="recent-instance-card"
                  onClick={() => handleRecentInstance(instance)}
                >
                  <FolderOpen size={18} />
                  <span className="instance-name">{instanceName}</span>
                  <span className="instance-path">{instance}</span>
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
        <p>Made with 💜 for the Minecraft community</p>
        <p className="version">Version 1.0.0</p>
      </div>
    </div>
  );
}
