import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, AlertTriangle, Code } from 'lucide-react';

interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning';
}

interface ScriptValidatorProps {
  code: string;
  onValidationChange?: (isValid: boolean, errors: ValidationError[]) => void;
}

export const ScriptValidator: React.FC<ScriptValidatorProps> = ({ code, onValidationChange }) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    validateScript(code);
  }, [code]);

  const validateScript = async (script: string) => {
    if (!script || script.trim() === '') {
      setErrors([]);
      setIsValid(true);
      if (onValidationChange) {
        onValidationChange(true, []);
      }
      return;
    }

    try {
      const result = await window.api.kubeJSValidateScript(script);
      if (result.success && result.data) {
        setErrors(result.data.errors);
        setIsValid(result.data.isValid);
        if (onValidationChange) {
          onValidationChange(result.data.isValid, result.data.errors);
        }
      }
    } catch (error) {
      console.error('Validation error:', error);
      // Fallback to local validation
      const validationErrors: ValidationError[] = [];
      
      try {
        new Function(script);
      } catch (e: any) {
        const match = e.message.match(/line (\d+)/);
        validationErrors.push({
          line: match ? parseInt(match[1]) : 1,
          column: 0,
          message: e.message,
          severity: 'error'
        });
      }
      
      setErrors(validationErrors);
      const valid = !validationErrors.some(e => e.severity === 'error');
      setIsValid(valid);
      
      if (onValidationChange) {
        onValidationChange(valid, validationErrors);
      }
    }
  };

  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;

  return (
    <div className="border rounded-lg p-4 bg-background">
      <div className="flex items-center gap-2 mb-3">
        <Code className="w-4 h-4" />
        <h3 className="font-semibold">Script Validation</h3>
      </div>

      <div className="flex items-center gap-4 mb-3">
        {isValid ? (
          <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">No errors found</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">{errorCount} error{errorCount !== 1 ? 's' : ''}</span>
          </div>
        )}

        {warningCount > 0 && (
          <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm">{warningCount} warning{warningCount !== 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {errors.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {errors.map((error, index) => (
            <div
              key={index}
              className={`flex items-start gap-2 p-2 rounded text-sm ${
                error.severity === 'error'
                  ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200'
                  : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-900 dark:text-yellow-200'
              }`}
            >
              {error.severity === 'error' ? (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-medium">Line {error.line}</div>
                <div className="text-xs opacity-90">{error.message}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
