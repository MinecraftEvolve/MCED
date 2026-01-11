import React from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';
import './ValidationIndicator.css';

interface ValidationResult {
  isValid: boolean;
  error?: string;
}

interface ValidationIndicatorProps {
  validation: ValidationResult;
}

export function ValidationIndicator({ validation }: ValidationIndicatorProps) {
  if (validation.isValid) {
    return (
      <div className="validation-indicator valid">
        <CheckCircle size={16} />
        <span>Valid</span>
      </div>
    );
  }

  return (
    <div className="validation-indicator invalid">
      <AlertCircle size={16} />
      <span>{validation.error || 'Invalid value'}</span>
    </div>
  );
}
