import React from 'react';
import { ValidationResult } from '../../../utils/recipeValidation';

interface ValidationDisplayProps {
  validation: ValidationResult | null;
}

export const ValidationDisplay: React.FC<ValidationDisplayProps> = ({ validation }) => {
  if (!validation || (validation.errors.length === 0 && validation.warnings.length === 0)) {
    return null;
  }

  return (
    <div className="space-y-2 mt-4">
      {validation.errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h4 className="font-semibold text-red-500">Errors</h4>
          </div>
          <ul className="space-y-1 text-sm">
            {validation.errors.map((error, index) => (
              <li key={index} className="text-gray-300">
                <span className="font-medium text-red-400">{error.field}:</span> {error.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {validation.warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h4 className="font-semibold text-yellow-500">Warnings</h4>
          </div>
          <ul className="space-y-1 text-sm">
            {validation.warnings.map((warning, index) => (
              <li key={index} className="text-gray-300">
                <span className="font-medium text-yellow-400">{warning.field}:</span> {warning.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
