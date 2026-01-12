import React from "react";
import "./ValidationHelper.css";

interface ValidationHelperProps {
  value: any;
  type: string;
  min?: number;
  max?: number;
  pattern?: string;
  required?: boolean;
}

export function ValidationHelper({
  value,
  type,
  min,
  max,
  pattern,
  required,
}: ValidationHelperProps) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required check
  if (required && (value === "" || value === null || value === undefined)) {
    errors.push("This field is required");
  }

  // Type-specific validation
  if (value !== "" && value !== null && value !== undefined) {
    switch (type) {
      case "number":
      case "integer":
      case "float":
        const num = Number(value);
        if (isNaN(num)) {
          errors.push("Must be a valid number");
        } else {
          if (min !== undefined && num < min) {
            errors.push(`Must be at least ${min}`);
          }
          if (max !== undefined && num > max) {
            errors.push(`Must be at most ${max}`);
          }
          if (type === "integer" && !Number.isInteger(num)) {
            errors.push("Must be a whole number");
          }
        }
        break;

      case "string":
        if (pattern) {
          try {
            const regex = new RegExp(pattern);
            if (!regex.test(String(value))) {
              errors.push("Invalid format");
            }
          } catch (e) {
            // Invalid regex pattern
          }
        }
        if (min !== undefined && String(value).length < min) {
          errors.push(`Must be at least ${min} characters`);
        }
        if (max !== undefined && String(value).length > max) {
          errors.push(`Must be at most ${max} characters`);
        }
        break;

      case "boolean":
        if (
          typeof value !== "boolean" &&
          value !== "true" &&
          value !== "false"
        ) {
          errors.push("Must be true or false");
        }
        break;
    }
  }

  // Performance warnings for common settings
  if (typeof value === "number") {
    if (min !== undefined && max !== undefined) {
      const range = max - min;
      const percentile = ((Number(value) - min) / range) * 100;

      if (percentile > 90) {
        warnings.push("High value may impact performance");
      } else if (percentile < 10) {
        warnings.push("Low value may reduce quality");
      }
    }
  }

  if (errors.length === 0 && warnings.length === 0) {
    return (
      <div className="validation-helper success">
        <span className="validation-icon">✓</span>
        <span>Valid</span>
      </div>
    );
  }

  return (
    <div className="validation-helper">
      {errors.map((error, i) => (
        <div key={`error-${i}`} className="validation-message error">
          <span className="validation-icon">✗</span>
          <span>{error}</span>
        </div>
      ))}
      {warnings.map((warning, i) => (
        <div key={`warning-${i}`} className="validation-message warning">
          <span>{warning}</span>
        </div>
      ))}
    </div>
  );
}
