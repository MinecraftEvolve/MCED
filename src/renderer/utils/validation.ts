interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateConfigValue(
  value: any,
  type: string,
  min?: number,
  max?: number,
  pattern?: string
): ValidationResult {
  // Type validation
  switch (type) {
    case 'boolean':
      if (typeof value !== 'boolean') {
        return { isValid: false, error: 'Must be true or false' };
      }
      break;

    case 'integer':
      if (!Number.isInteger(Number(value))) {
        return { isValid: false, error: 'Must be a whole number' };
      }
      break;

    case 'number':
      if (isNaN(Number(value))) {
        return { isValid: false, error: 'Must be a number' };
      }
      break;

    case 'string':
      if (typeof value !== 'string') {
        return { isValid: false, error: 'Must be text' };
      }
      break;
  }

  // Range validation
  if ((type === 'integer' || type === 'number') && typeof value === 'number') {
    if (min !== undefined && value < min) {
      return { isValid: false, error: `Must be at least ${min}` };
    }
    if (max !== undefined && value > max) {
      return { isValid: false, error: `Must be at most ${max}` };
    }
  }

  // Pattern validation
  if (type === 'string' && pattern && typeof value === 'string') {
    try {
      const regex = new RegExp(pattern);
      if (!regex.test(value)) {
        return { isValid: false, error: 'Invalid format' };
      }
    } catch (e) {
      // Invalid regex pattern
    }
  }

  return { isValid: true };
}
