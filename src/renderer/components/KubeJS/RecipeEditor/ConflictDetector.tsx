import React, { useState, useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Wrench } from 'lucide-react';
import { detectRecipeConflicts, autoFixDuplicateIds, RecipeConflict, ConflictReport } from '../../../utils/recipeConflicts';

interface ConflictDetectorProps {
  instancePath: string;
}

export const ConflictDetector: React.FC<ConflictDetectorProps> = ({ instancePath }) => {
  const [report, setReport] = useState<ConflictReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [recipes, setRecipes] = useState<any[]>([]);

  const scanForConflicts = async () => {
    setIsScanning(true);
    try {
      const result = await window.api.recipeSearch(instancePath, '');
      if (result.success && result.data) {
        const recipeData = result.data;
        setRecipes(recipeData);
        const conflictReport = detectRecipeConflicts(recipeData);
        setReport(conflictReport);
      }
    } catch (error) {
      console.error('Failed to scan for conflicts:', error);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAutoFix = async () => {
    if (!recipes.length) return;

    const { fixed, changes } = autoFixDuplicateIds(recipes);
    
    // Show what will be changed
    const changesText = Array.from(changes.entries())
      .map(([oldId, newId]) => `  ${oldId} → ${newId}`)
      .join('\n');
    
    if (!confirm(`Auto-fix will rename the following recipes:\n\n${changesText}\n\nContinue?`)) {
      return;
    }

    try {
      // Save each fixed recipe
      for (const recipe of fixed) {
        if (changes.has(recipe.id.replace(/_\d+$/, ''))) {
          await window.api.kubeJSSaveRecipe(instancePath, recipe);
        }
      }

      alert('Auto-fix completed! Please rescan to verify.');
      await scanForConflicts();
    } catch (error) {
      console.error('Failed to auto-fix:', error);
      alert('Auto-fix failed. Please check console for details.');
    }
  };

  useEffect(() => {
    scanForConflicts();
  }, [instancePath]);

  const getSeverityIcon = (severity: string) => {
    if (severity === 'error') {
      return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
    return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
  };

  const getSeverityColor = (severity: string) => {
    if (severity === 'error') {
      return 'border-red-500/20 bg-red-500/5';
    }
    return 'border-yellow-500/20 bg-yellow-500/5';
  };

  if (isScanning) {
    return (
      <div className="p-6">
        <div className="bg-muted/50 border border-border rounded-lg p-6">
          <div className="flex items-center justify-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="text-foreground">Scanning for conflicts...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="p-6">
        <div className="bg-muted/50 border border-border rounded-lg p-6 text-center">
          <p className="text-muted-foreground mb-4">No conflict scan performed yet</p>
          <button
            onClick={scanForConflicts}
            className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors"
          >
            Scan for Conflicts
          </button>
        </div>
      </div>
    );
  }

  const hasErrors = report.conflicts.some(c => c.severity === 'error');
  const hasWarnings = report.conflicts.some(c => c.severity === 'warning');

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Summary Card */}
        <div className="bg-muted/50 border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {report.conflicts.length === 0 ? (
                <>
                  <CheckCircle className="w-6 h-6 text-green-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">No Conflicts Detected</h3>
                    <p className="text-sm text-muted-foreground">All recipes look good!</p>
                  </div>
                </>
              ) : (
                <>
                  {hasErrors ? (
                    <AlertCircle className="w-6 h-6 text-red-500" />
                  ) : (
                    <AlertTriangle className="w-6 h-6 text-yellow-500" />
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      {report.conflicts.length} Conflict{report.conflicts.length !== 1 ? 's' : ''} Found
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {report.affectedRecipes.size} recipe{report.affectedRecipes.size !== 1 ? 's' : ''} affected
                    </p>
                  </div>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasErrors && (
                <button
                  onClick={handleAutoFix}
                  className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded transition-colors flex items-center gap-2"
                >
                  <Wrench className="w-4 h-4" />
                  Auto-Fix
                </button>
              )}
              <button
                onClick={scanForConflicts}
                className="px-4 py-2 bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded transition-colors"
              >
                Rescan
              </button>
            </div>
          </div>

          {/* Statistics */}
          {report.conflicts.length > 0 && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-red-500">
                  {report.conflicts.filter(c => c.severity === 'error').length}
                </div>
                <div className="text-sm text-muted-foreground">Errors</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-500">
                  {report.conflicts.filter(c => c.severity === 'warning').length}
                </div>
                <div className="text-sm text-muted-foreground">Warnings</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-foreground">
                  {report.affectedRecipes.size}
                </div>
                <div className="text-sm text-muted-foreground">Recipes</div>
              </div>
            </div>
          )}
        </div>

        {/* Conflict List */}
        {report.conflicts.length > 0 && (
          <div className="space-y-3">
            {report.conflicts.map((conflict, index) => (
              <div
                key={index}
                className={`border rounded-lg p-4 ${getSeverityColor(conflict.severity)}`}
              >
                <div className="flex items-start gap-3">
                  {getSeverityIcon(conflict.severity)}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-semibold text-foreground capitalize">
                        {conflict.type.replace(/_/g, ' ')}
                      </h4>
                      <span className={`text-xs px-2 py-1 rounded ${
                        conflict.severity === 'error' 
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {conflict.severity}
                      </span>
                    </div>
                    <p className="text-sm text-foreground mb-2">{conflict.message}</p>
                    {conflict.suggestion && (
                      <p className="text-sm text-muted-foreground italic">
                        💡 {conflict.suggestion}
                      </p>
                    )}
                    <div className="mt-3 flex flex-wrap gap-2">
                      {conflict.recipes.map((recipeId) => (
                        <span
                          key={recipeId}
                          className="text-xs px-2 py-1 bg-background border border-border rounded font-mono"
                        >
                          {recipeId}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
