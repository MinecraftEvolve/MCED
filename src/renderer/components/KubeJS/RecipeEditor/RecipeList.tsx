import React, { useState, useEffect } from "react";
import { FileCode, Trash2, Copy, Eye, CheckSquare, Square, Edit3 } from "lucide-react";

interface Recipe {
  id: string;
  type: string;
  output: string;
  inputs?: string[];
  filePath: string;
  raw?: string;
  ingredients?: Array<{ item?: string; tag?: string; count?: number }>;
  results?: Array<{ item?: string; count?: number }>;
}

interface RecipeListProps {
  instancePath: string;
  searchQuery: string;
  filterType?: string; // 'all' or specific recipe type
  onViewRecipe?: (recipe: Recipe) => void;
  onDuplicateRecipe?: (recipe: Recipe) => void;
  onModifyRecipe?: (recipe: Recipe) => void;
  selectionMode?: boolean;
  selectedRecipes?: Set<string>;
  onToggleSelection?: (recipeId: string) => void;
}

export const RecipeList: React.FC<RecipeListProps> = ({
  instancePath,
  searchQuery,
  filterType = "all",
  onViewRecipe,
  onDuplicateRecipe,
  onModifyRecipe,
  selectionMode = false,
  selectedRecipes = new Set(),
  onToggleSelection,
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filteredRecipes, setFilteredRecipes] = useState<Recipe[]>([]);

  const extractOutput = (recipe: Recipe): string => {
    // Try direct output first
    if (recipe.output && recipe.output !== "Unknown") return recipe.output;

    // Try results array
    if (recipe.results?.[0]?.item) return recipe.results[0].item;

    // Parse from raw recipe string
    if (recipe.raw) {
      // Match patterns like .deploying('output', ...) or .crushing(['output'])
      const patterns = [
        /\.\w+\(\s*['"]([^'"]+)['"]/, // .method('output'...)
        /\.\w+\(\s*\[?\s*['"]([^'"]+)['"]/, // .method(['output']...)
      ];

      for (const pattern of patterns) {
        const match = recipe.raw.match(pattern);
        if (match?.[1]) return match[1];
      }
    }

    return "Unknown";
  };

  useEffect(() => {
    loadRecipes();
  }, [instancePath, searchQuery]);

  useEffect(() => {
    // Apply type filter
    if (filterType === "all") {
      setFilteredRecipes(recipes);
    } else {
      setFilteredRecipes(recipes.filter((r) => r.type === filterType));
    }
  }, [recipes, filterType]);

  const loadRecipes = async () => {
    setIsLoading(true);
    try {
      const result = await window.api.recipeSearch(instancePath, searchQuery || "");
      if (result.success && result.data) {
        setRecipes(result.data);
      }
    } catch (error) {
      console.error("Failed to load recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRecipe = async (recipeId: string, filePath: string) => {
    if (!confirm(`Are you sure you want to delete the recipe "${recipeId}"?`)) {
      return;
    }

    try {
      const result = await window.api.recipeDelete(instancePath, filePath, recipeId);
      if (result.success) {
        setRecipes(recipes.filter((r) => r.id !== recipeId));
      }
    } catch (error) {
      console.error("Failed to delete recipe:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full py-12">
        <div className="text-muted-foreground">Loading recipes...</div>
      </div>
    );
  }

  if (filteredRecipes.length === 0 && recipes.length > 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <FileCode className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Recipes Match Filter</h3>
        <p className="text-sm text-muted-foreground">
          Try selecting a different recipe type filter
        </p>
      </div>
    );
  }

  if (filteredRecipes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12">
        <FileCode className="w-16 h-16 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">No Recipes Found</h3>
        <p className="text-sm text-muted-foreground">
          {searchQuery ? "Try a different search query" : "Create your first recipe to get started"}
        </p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="max-w-6xl mx-auto space-y-2.5">
        {filteredRecipes.map((recipe) => (
          <div
            key={recipe.id}
            className={`bg-muted/50 border rounded-lg p-3.5 transition-colors ${
              selectionMode && selectedRecipes.has(recipe.id)
                ? "border-primary bg-primary/5"
                : "border-primary/20 hover:border-primary/20/80"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {selectionMode && (
                  <button
                    onClick={() => onToggleSelection?.(recipe.id)}
                    className="flex-shrink-0 p-1 hover:bg-secondary rounded transition-colors"
                  >
                    {selectedRecipes.has(recipe.id) ? (
                      <CheckSquare className="w-5 h-5 text-primary" />
                    ) : (
                      <Square className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                )}
                <div className="flex-1 cursor-pointer" onClick={() => onViewRecipe?.(recipe)}>
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <h4 className="font-medium text-foreground">{recipe.id}</h4>
                    <span className="text-xs px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded border border-purple-500/20">
                      {recipe.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div>
                      <span className="text-muted-foreground/70">Output:</span>{" "}
                      {extractOutput(recipe)}
                    </div>
                    {recipe.inputs && recipe.inputs.length > 0 && (
                      <div>
                        <span className="text-muted-foreground/70">Inputs:</span>{" "}
                        {recipe.inputs.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground/50 mt-1.5">{recipe.filePath}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onDuplicateRecipe?.(recipe)}
                  className="p-2 bg-secondary hover:bg-secondary/80 border border-primary/20 rounded transition-colors"
                  title="Duplicate Recipe"
                >
                  <Copy className="w-4 h-4 text-foreground" />
                </button>
                <button
                  onClick={() => handleDeleteRecipe(recipe.id, recipe.filePath)}
                  className="p-2 bg-destructive/10 hover:bg-destructive/20 border border-destructive/30 rounded transition-colors"
                  title="Delete Recipe"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
