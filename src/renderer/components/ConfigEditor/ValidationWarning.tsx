import React from 'react';
import './ValidationWarning.css';

interface ValidationError {
  setting: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationWarningProps {
  errors: ValidationError[];
  onDismiss: () => void;
  onFixIssues: () => void;
}

export function ValidationWarning({ errors, onDismiss, onFixIssues }: ValidationWarningProps) {
  if (errors.length === 0) return null;

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  return (
    <div className="validation-warning">
      <div className="validation-header">
        <div className="validation-icon">
          {errorCount > 0 ? '⚠️' : '⚡'}
        </div>
        <div className="validation-content">
          <h3>
            {errorCount > 0 ? 'Configuration Issues Detected' : 'Configuration Warnings'}
          </h3>
          <p>
            {errorCount > 0 && `${errorCount} error${errorCount !== 1 ? 's' : ''}`}
            {errorCount > 0 && warningCount > 0 && ' and '}
            {warningCount > 0 && `${warningCount} warning${warningCount !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button onClick={onDismiss} className="dismiss-btn">✕</button>
      </div>

      <div className="validation-list">
        {errors.map((error, index) => (
          <div key={index} className={`validation-item ${error.severity}`}>
            <span className="validation-setting">{error.setting}</span>
            <span className="validation-message">{error.message}</span>
          </div>
        ))}
      </div>

      <div className="validation-actions">
        <button onClick={onFixIssues} className="btn-fix">
          Fix Issues
        </button>
        <button onClick={onDismiss} className="btn-ignore">
          Ignore and Save Anyway
        </button>
      </div>
    </div>
  );
}
