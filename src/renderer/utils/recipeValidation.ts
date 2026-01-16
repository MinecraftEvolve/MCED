export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
}

export function validateRecipeId(recipeId: string): ValidationError | null {
  if (!recipeId || recipeId.trim() === '') {
    return {
      field: 'recipeId',
      message: 'Recipe ID is required',
      severity: 'error'
    };
  }

  if (!/^[a-z0-9_]+:[a-z0-9_/]+$/.test(recipeId)) {
    return {
      field: 'recipeId',
      message: 'Recipe ID must be in format "namespace:path" (lowercase, numbers, underscores only)',
      severity: 'error'
    };
  }

  return null;
}

export function validateItemInput(item: any, fieldName: string = 'item'): ValidationError | null {
  if (!item || !item.item) {
    return {
      field: fieldName,
      message: 'Item is required',
      severity: 'error'
    };
  }

  if (item.count !== undefined && (item.count < 1 || item.count > 64)) {
    return {
      field: `${fieldName}.count`,
      message: 'Item count must be between 1 and 64',
      severity: 'warning'
    };
  }

  return null;
}

export function validateFluidInput(fluid: any, fieldName: string = 'fluid'): ValidationError | null {
  if (!fluid || !fluid.fluid) {
    return {
      field: fieldName,
      message: 'Fluid is required',
      severity: 'error'
    };
  }

  if (fluid.amount !== undefined && fluid.amount < 1) {
    return {
      field: `${fieldName}.amount`,
      message: 'Fluid amount must be at least 1',
      severity: 'error'
    };
  }

  return null;
}

export function validateShapedRecipe(recipe: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // Validate recipe ID
  const idError = validateRecipeId(recipe.id);
  if (idError) errors.push(idError);

  // Validate pattern
  if (!recipe.pattern || recipe.pattern.length === 0) {
    errors.push({
      field: 'pattern',
      message: 'Pattern is required for shaped crafting',
      severity: 'error'
    });
  } else {
    const patternWidth = recipe.pattern[0]?.length || 0;
    const hasInconsistentWidth = recipe.pattern.some((row: string) => row.length !== patternWidth);
    
    if (hasInconsistentWidth) {
      errors.push({
        field: 'pattern',
        message: 'All pattern rows must have the same width',
        severity: 'error'
      });
    }
  }

  // Validate keys
  if (!recipe.key || Object.keys(recipe.key).length === 0) {
    errors.push({
      field: 'key',
      message: 'At least one ingredient is required',
      severity: 'error'
    });
  }

  // Validate result
  const resultError = validateItemInput(recipe.result, 'result');
  if (resultError) errors.push(resultError);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateShapelessRecipe(recipe: any): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const idError = validateRecipeId(recipe.id);
  if (idError) errors.push(idError);

  if (!recipe.ingredients || recipe.ingredients.length === 0) {
    errors.push({
      field: 'ingredients',
      message: 'At least one ingredient is required',
      severity: 'error'
    });
  } else if (recipe.ingredients.length > 9) {
    errors.push({
      field: 'ingredients',
      message: 'Maximum 9 ingredients allowed for shapeless crafting',
      severity: 'error'
    });
  }

  const resultError = validateItemInput(recipe.result, 'result');
  if (resultError) errors.push(resultError);

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateProcessingRecipe(recipe: any, config: {
  requiresInput?: boolean;
  requiresOutput?: boolean;
  allowMultipleInputs?: boolean;
  allowMultipleOutputs?: boolean;
  allowFluids?: boolean;
}): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  const idError = validateRecipeId(recipe.id);
  if (idError) errors.push(idError);

  // Validate inputs
  if (config.requiresInput) {
    if (!recipe.ingredients || recipe.ingredients.length === 0) {
      errors.push({
        field: 'ingredients',
        message: 'At least one input is required',
        severity: 'error'
      });
    } else if (!config.allowMultipleInputs && recipe.ingredients.length > 1) {
      errors.push({
        field: 'ingredients',
        message: 'Only one input allowed',
        severity: 'error'
      });
    }
  }

  // Validate outputs
  if (config.requiresOutput) {
    if (!recipe.results || recipe.results.length === 0) {
      errors.push({
        field: 'results',
        message: 'At least one output is required',
        severity: 'error'
      });
    } else if (!config.allowMultipleOutputs && recipe.results.length > 1) {
      errors.push({
        field: 'results',
        message: 'Only one output allowed',
        severity: 'error'
      });
    }
  }

  // Validate processing time if present
  if (recipe.processingTime !== undefined) {
    if (recipe.processingTime < 1) {
      errors.push({
        field: 'processingTime',
        message: 'Processing time must be at least 1 tick',
        severity: 'error'
      });
    } else if (recipe.processingTime > 72000) {
      warnings.push({
        field: 'processingTime',
        message: 'Processing time is very long (>1 hour)',
        severity: 'warning'
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateRecipe(recipeType: string, recipe: any): ValidationResult {
  switch (recipeType) {
    case 'minecraft:crafting_shaped':
      return validateShapedRecipe(recipe);
    
    case 'minecraft:crafting_shapeless':
      return validateShapelessRecipe(recipe);
    
    case 'minecraft:smelting':
    case 'minecraft:blasting':
    case 'minecraft:smoking':
    case 'minecraft:campfire_cooking':
      return validateProcessingRecipe(recipe, {
        requiresInput: true,
        requiresOutput: true,
        allowMultipleInputs: false,
        allowMultipleOutputs: false
      });
    
    case 'create:crushing':
    case 'create:milling':
      return validateProcessingRecipe(recipe, {
        requiresInput: true,
        requiresOutput: true,
        allowMultipleInputs: false,
        allowMultipleOutputs: true
      });
    
    case 'create:mixing':
      return validateProcessingRecipe(recipe, {
        requiresInput: true,
        requiresOutput: true,
        allowMultipleInputs: true,
        allowMultipleOutputs: true,
        allowFluids: true
      });
    
    default:
      // Generic validation for unknown recipe types
      return validateProcessingRecipe(recipe, {
        requiresInput: true,
        requiresOutput: true,
        allowMultipleInputs: true,
        allowMultipleOutputs: true
      });
  }
}
