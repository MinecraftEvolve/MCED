export interface RecipeConflict {
  type: 'duplicate_id' | 'duplicate_output' | 'circular_dependency';
  severity: 'error' | 'warning';
  recipes: string[]; // Recipe IDs involved
  message: string;
  suggestion?: string;
}

export interface ConflictReport {
  conflicts: RecipeConflict[];
  affectedRecipes: Set<string>;
}

export function detectRecipeConflicts(recipes: any[]): ConflictReport {
  const conflicts: RecipeConflict[] = [];
  const affectedRecipes = new Set<string>();
  
  // Check for duplicate recipe IDs
  const idMap = new Map<string, string[]>();
  recipes.forEach((recipe) => {
    const id = recipe.id;
    if (!idMap.has(id)) {
      idMap.set(id, []);
    }
    idMap.get(id)!.push(recipe.filePath || 'unknown');
  });

  idMap.forEach((files, id) => {
    if (files.length > 1) {
      conflicts.push({
        type: 'duplicate_id',
        severity: 'error',
        recipes: [id],
        message: `Recipe ID "${id}" is defined in ${files.length} different files`,
        suggestion: `Rename one of the recipes to use a unique ID`
      });
      affectedRecipes.add(id);
    }
  });

  // Check for duplicate outputs (warning, not error)
  const outputMap = new Map<string, string[]>();
  recipes.forEach((recipe) => {
    let outputId: string | null = null;
    
    if (recipe.result?.item) {
      outputId = recipe.result.item;
    } else if (recipe.results && recipe.results.length > 0) {
      outputId = recipe.results[0].item || recipe.results[0].fluid;
    }
    
    if (outputId) {
      if (!outputMap.has(outputId)) {
        outputMap.set(outputId, []);
      }
      outputMap.get(outputId)!.push(recipe.id);
    }
  });

  outputMap.forEach((recipeIds, outputId) => {
    if (recipeIds.length > 1) {
      conflicts.push({
        type: 'duplicate_output',
        severity: 'warning',
        recipes: recipeIds,
        message: `Multiple recipes (${recipeIds.length}) produce "${outputId}"`,
        suggestion: `This may be intentional, but ensure recipe priorities are set correctly`
      });
      recipeIds.forEach(id => affectedRecipes.add(id));
    }
  });

  return {
    conflicts,
    affectedRecipes
  };
}

export function suggestRecipeIdFix(conflictingId: string, existingIds: Set<string>): string {
  let counter = 2;
  let newId = `${conflictingId}_${counter}`;
  
  while (existingIds.has(newId)) {
    counter++;
    newId = `${conflictingId}_${counter}`;
  }
  
  return newId;
}

export function autoFixDuplicateIds(recipes: any[]): { fixed: any[], changes: Map<string, string> } {
  const idCounts = new Map<string, number>();
  const changes = new Map<string, string>();
  
  const fixed = recipes.map((recipe) => {
    const id = recipe.id;
    const count = idCounts.get(id) || 0;
    idCounts.set(id, count + 1);
    
    if (count > 0) {
      // This is a duplicate, rename it
      const newId = `${id}_${count + 1}`;
      changes.set(id, newId);
      return {
        ...recipe,
        id: newId
      };
    }
    
    return recipe;
  });
  
  return { fixed, changes };
}
