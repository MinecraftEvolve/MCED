import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, BookOpen, AlertTriangle, Folder, FolderPlus, Trash2, Edit3, Code, Database } from 'lucide-react';
import { ItemSelector } from './ItemSelector';
import { RecipeList } from './RecipeList';
import { ConflictDetector } from './ConflictDetector';
import { RecipeModifier } from './RecipeModifier';
import { BulkRecipeEditor } from '../BulkOperations/BulkRecipeEditor';
import { CodePreview } from './CodePreview';
import { CraftingShapedEditor } from './CraftingShapedEditor';
import { CraftingShapelessEditor } from './CraftingShapelessEditor';
import { SmeltingEditor } from './SmeltingEditor';
import { BlastingEditor } from './BlastingEditor';
import { SmokingEditor } from './SmokingEditor';
import { CampfireCookingEditor } from './CampfireCookingEditor';
import { StonecuttingEditor } from './StonecuttingEditor';
import { CreateCrushingEditor } from './CreateCrushingEditor';
import { CreateMixingEditor } from './CreateMixingEditor';
import { CreatePressingEditor } from './CreatePressingEditor';
import { CreateCuttingEditor } from './CreateCuttingEditor';
import { CreateMillingEditor } from './CreateMillingEditor';
import { CreateDeployingEditor } from './CreateDeployingEditor';
import CreateCompactingEditor from './CreateCompactingEditor';
import CreateItemApplicationEditor from './CreateItemApplicationEditor';
import CreateSandpaperPolishingEditor from './CreateSandpaperPolishingEditor';
import ThermalPulverizerEditor from './ThermalPulverizerEditor';
import FarmersDelightCookingEditor from './FarmersDelightCookingEditor';
import { CreateFillingEditor } from './CreateFillingEditor';
import { CreateEmptyingEditor } from './CreateEmptyingEditor';
import { CreateMechanicalCraftingEditor } from './CreateMechanicalCraftingEditor';
import { ThermalSmelterEditor } from './ThermalSmelterEditor';
import { FarmersDelightCuttingBoardEditor } from './FarmersDelightCuttingBoardEditor';
import { DataPackManager } from '../DataPacks/DataPackManager';
import CreateSequencedAssemblyEditor from './CreateSequencedAssemblyEditor';
import MekanismCrushingEditor from './MekanismCrushingEditor';
import MekanismEnrichingEditor from './MekanismEnrichingEditor';
import { RecipeRemoval } from './RecipeRemoval';

interface RecipeEditorMainProps {
  instancePath: string;
  addons: string[];
}

export const RecipeEditorMain: React.FC<RecipeEditorMainProps> = ({ instancePath, addons }) => {
  const [view, setView] = useState<'list' | 'create' | 'conflicts' | 'datapacks' | 'remove'>('list');
  const [selectedRecipeType, setSelectedRecipeType] = useState<string>('crafting_shaped');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingRecipe, setEditingRecipe] = useState<any>(null);
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [recipeTypeFilter, setRecipeTypeFilter] = useState<string>('all');
  const [folders, setFolders] = useState<string[]>([]);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedRecipes, setSelectedRecipes] = useState<Set<string>>(new Set());
  const [showModifier, setShowModifier] = useState(false);
  const [modifyingRecipe, setModifyingRecipe] = useState<any>(null);
  const [showBulkEditor, setShowBulkEditor] = useState(false);
  const [bulkRecipes, setBulkRecipes] = useState<any[]>([]);
  const [showCodePreview, setShowCodePreview] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);

  const availableRecipeTypes = [
    { id: 'crafting_shaped', name: 'Shaped Crafting', icon: '⬛' },
    { id: 'crafting_shapeless', name: 'Shapeless Crafting', icon: '○' },
    { id: 'smelting', name: 'Smelting', icon: '▲' },
    { id: 'blasting', name: 'Blasting', icon: '◆' },
    { id: 'smoking', name: 'Smoking', icon: '~' },
    { id: 'campfire_cooking', name: 'Campfire Cooking', icon: '◊' },
    { id: 'stonecutting', name: 'Stonecutting', icon: '▼' },
    ...(addons.includes('create') ? [
      { id: 'create:crushing', name: 'Crushing', icon: '⊕' },
      { id: 'create:mixing', name: 'Mixing', icon: '~' },
      { id: 'create:pressing', name: 'Pressing', icon: '▼' },
      { id: 'create:cutting', name: 'Cutting', icon: '/' },
      { id: 'create:compacting', name: 'Compacting', icon: '■' },
      { id: 'create:filling', name: 'Filling', icon: '▽' },
      { id: 'create:emptying', name: 'Emptying', icon: '△' },
      { id: 'create:deploying', name: 'Deploying', icon: '↓' },
      { id: 'create:item_application', name: 'Item Application', icon: '+' },
      { id: 'create:milling', name: 'Milling', icon: '◎' },
      { id: 'create:sandpaper_polishing', name: 'Sandpaper Polishing', icon: '◇' },
      { id: 'create:mechanical_crafting', name: 'Mechanical Crafting', icon: '⊞' },
      { id: 'create:sequenced_assembly', name: 'Sequenced Assembly', icon: '↻' },
    ] : []),
    ...(addons.includes('thermal') ? [
      { id: 'thermal:pulverizer', name: 'Pulverizer', icon: '⊕' },
      { id: 'thermal:smelter', name: 'Smelter', icon: '▲' },
    ] : []),
    ...(addons.includes('farmersdelight') ? [
      { id: 'farmersdelight:cooking', name: 'Cooking Pot', icon: '◉' },
      { id: 'farmersdelight:cutting', name: 'Cutting Board', icon: '/' },
    ] : []),
    ...(addons.includes('mekanism') ? [
      { id: 'mekanism:crushing', name: 'Crushing', icon: '⊕' },
      { id: 'mekanism:enriching', name: 'Enriching', icon: '◈' },
    ] : []),
  ];

  const handleSaveRecipe = async (recipe: any) => {
    // Save current state to undo stack
    if (editingRecipe) {
      setUndoStack([...undoStack, editingRecipe]);
      setRedoStack([]); // Clear redo stack on new action
    }

    try {
      const result = await window.api.kubeJSSaveRecipe(instancePath, recipe);
      if (result.success) {
        alert('Recipe saved successfully!');
        setView('list');
        setEditingRecipe(null);
      } else {
        alert(`Failed to save recipe: ${result.error}`);
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe');
    }
  };

  const handleViewRecipe = (recipe: any) => {
    setEditingRecipe(recipe);
    setSelectedRecipeType(recipe.type);
    setView('create');
  };

  const handleDuplicateRecipe = (recipe: any) => {
    const duplicated = { ...recipe, id: `${recipe.id}_copy` };
    setEditingRecipe(duplicated);
    setSelectedRecipeType(recipe.type);
    setView('create');
  };

  const handleModifyRecipe = (recipe: any) => {
    setModifyingRecipe(recipe);
    setShowModifier(true);
  };

  const handleSaveModified = async (modifiedRecipe: any) => {
    await handleSaveRecipe(modifiedRecipe);
    setShowModifier(false);
    setModifyingRecipe(null);
  };

  const handleBulkEdit = async () => {
    // Get all selected recipes
    const recipesToEdit = Array.from(selectedRecipes).map(id => {
      // In a real implementation, we'd fetch full recipe data
      return { id, type: 'unknown', output: 'unknown' };
    });
    setBulkRecipes(recipesToEdit);
    setShowBulkEditor(true);
  };

  const handleApplyBulkChanges = async (updates: Array<{ id: string; changes: any }>) => {
    // Apply bulk changes
    for (const update of updates) {
      // TODO: Implement bulk recipe update logic
      // This would need to find the recipe by ID and apply changes
    }
    setShowBulkEditor(false);
    setSelectedRecipes(new Set());
    setSelectionMode(false);
  };

  const handleToggleSelection = (recipeId: string) => {
    const newSelection = new Set(selectedRecipes);
    if (newSelection.has(recipeId)) {
      newSelection.delete(recipeId);
    } else {
      newSelection.add(recipeId);
    }
    setSelectedRecipes(newSelection);
  };

  const renderRecipeEditor = () => {
    const commonProps = {
      instancePath,
      onSave: handleSaveRecipe,
      onCancel: () => {
        setView('list');
        setEditingRecipe(null);
      },
      initialRecipe: editingRecipe
    };

    switch (selectedRecipeType) {
      case 'crafting_shaped':
        return <CraftingShapedEditor {...commonProps} />;
      case 'crafting_shapeless':
        return <CraftingShapelessEditor {...commonProps} />;
      case 'smelting':
        return <SmeltingEditor {...commonProps} />;
      case 'blasting':
        return <BlastingEditor {...commonProps} />;
      case 'smoking':
        return <SmokingEditor {...commonProps} />;
      case 'campfire_cooking':
        return <CampfireCookingEditor {...commonProps} />;
      case 'stonecutting':
        return <StonecuttingEditor {...commonProps} />;
      case 'create:crushing':
        return <CreateCrushingEditor {...commonProps} />;
      case 'create:mixing':
        return <CreateMixingEditor {...commonProps} />;
      case 'create:pressing':
        return <CreatePressingEditor {...commonProps} />;
      case 'create:cutting':
        return <CreateCuttingEditor {...commonProps} />;
      case 'create:milling':
        return <CreateMillingEditor {...commonProps} />;
      case 'create:deploying':
        return <CreateDeployingEditor {...commonProps} />;
      case 'create:filling':
        return <CreateFillingEditor {...commonProps} />;
      case 'create:emptying':
        return <CreateEmptyingEditor {...commonProps} />;
      case 'create:compacting':
        return <CreateCompactingEditor {...commonProps} />;
      case 'create:item_application':
        return <CreateItemApplicationEditor {...commonProps} />;
      case 'create:sandpaper_polishing':
        return <CreateSandpaperPolishingEditor {...commonProps} />;
      case 'thermal:pulverizer':
        return <ThermalPulverizerEditor {...commonProps} />;
      case 'thermal:smelter':
        return <ThermalSmelterEditor {...commonProps} />;
      case 'farmersdelight:cooking':
        return <FarmersDelightCookingEditor {...commonProps} />;
      case 'farmersdelight:cutting':
        return <FarmersDelightCuttingBoardEditor {...commonProps} />;
      case 'create:mechanical_crafting':
        return <CreateMechanicalCraftingEditor {...commonProps} />;
      case 'create:sequenced_assembly':
        return <CreateSequencedAssemblyEditor {...commonProps} />;
      case 'mekanism:crushing':
        return <MekanismCrushingEditor {...commonProps} />;
      case 'mekanism:enriching':
        return <MekanismEnrichingEditor {...commonProps} />;
      default:
        return (
          <div className="text-center py-12 text-muted-foreground">
            <p>This recipe type is not yet implemented.</p>
            <p className="text-sm mt-2">Coming soon!</p>
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header with Create/List/Conflicts Toggle */}
      <div className="flex-shrink-0 px-3 py-2 border-b border-border bg-muted/30">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setView('list')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                view === 'list'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 inline-block mr-1" />
              List
            </button>
            <button
              onClick={() => setView('create')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                view === 'create'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <Plus className="w-3.5 h-3.5 inline-block mr-1" />
              Create
            </button>
            <button
              onClick={() => setView('conflicts')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                view === 'conflicts'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 inline-block mr-1" />
              Conflicts
            </button>
            <button
              onClick={() => setView('datapacks')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                view === 'datapacks'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <Database className="w-3.5 h-3.5 inline-block mr-1" />
              Data Packs
            </button>
            <button
              onClick={() => setView('remove')}
              className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                view === 'remove'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-foreground hover:bg-secondary/80'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 inline-block mr-1" />
              Remove
            </button>
          </div>

          {view === 'list' && (
            <div className="flex items-center gap-2 flex-wrap">
              {selectionMode && selectedRecipes.size > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-xs text-muted-foreground">{selectedRecipes.size} selected</span>
                  <button
                    onClick={handleBulkEdit}
                    className="px-2 py-1 bg-primary/20 hover:bg-primary/30 border border-primary/50 rounded text-xs text-primary transition-colors"
                  >
                    <Edit3 className="w-3 h-3 inline-block mr-0.5" />
                    Bulk Edit
                  </button>
                  <button
                    onClick={() => {
                      // Bulk disable (comment out)
                      alert(`Would disable ${selectedRecipes.size} recipes`);
                    }}
                    className="px-2 py-1 bg-secondary hover:bg-secondary/80 border border-border rounded text-xs transition-colors"
                  >
                    Disable
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete ${selectedRecipes.size} recipes?`)) {
                        alert(`Would delete ${selectedRecipes.size} recipes`);
                        setSelectedRecipes(new Set());
                      }
                    }}
                    className="px-2 py-1 bg-destructive/20 hover:bg-destructive/30 border border-destructive/50 rounded text-xs text-destructive transition-colors"
                  >
                    Delete
                  </button>
                </div>
              )}
              <button
                onClick={() => {
                  setSelectionMode(!selectionMode);
                  if (selectionMode) setSelectedRecipes(new Set());
                }}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors ${
                  selectionMode
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                }`}
              >
                {selectionMode ? 'Cancel' : 'Select Multiple'}
              </button>
              <div className="relative">
                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 w-32 lg:w-40 bg-secondary border border-border rounded text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="relative">
                <Filter className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <select
                  value={recipeTypeFilter}
                  onChange={(e) => setRecipeTypeFilter(e.target.value)}
                  className="pl-8 pr-6 py-1.5 bg-secondary border border-border rounded text-xs text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="all">All Types</option>
                  {availableRecipeTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recipe Type Selector (when creating) */}
      {view === 'create' && (
        <div className="flex-shrink-0 px-3 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
            {availableRecipeTypes.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedRecipeType(type.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  selectedRecipeType === type.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
                }`}
              >
                <span className="mr-1.5">{type.icon}</span>
                {type.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {view === 'list' ? (
          <RecipeList
            instancePath={instancePath}
            searchQuery={searchQuery}
            filterType={recipeTypeFilter}
            onViewRecipe={handleViewRecipe}
            onDuplicateRecipe={handleDuplicateRecipe}
            onModifyRecipe={handleModifyRecipe}
            selectionMode={selectionMode}
            selectedRecipes={selectedRecipes}
            onToggleSelection={handleToggleSelection}
          />
        ) : view === 'conflicts' ? (
          <ConflictDetector instancePath={instancePath} />
        ) : view === 'datapacks' ? (
          <DataPackManager instancePath={instancePath} />
        ) : view === 'remove' ? (
          <RecipeRemoval 
            instancePath={instancePath}
            onClose={() => setView('list')}
          />
        ) : (
          <div className="p-3 lg:p-6">
            <div className="max-w-7xl mx-auto">
              <div className="bg-muted/50 border border-border rounded-lg p-3 lg:p-6">
                <h3 className="text-base lg:text-lg font-semibold text-foreground mb-3 lg:mb-6">
                  {editingRecipe ? 'Edit' : 'Create'} {availableRecipeTypes.find(t => t.id === selectedRecipeType)?.name} Recipe
                </h3>
                {renderRecipeEditor()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showModifier && modifyingRecipe && (
        <RecipeModifier
          recipe={modifyingRecipe}
          onSave={handleSaveModified}
          onCancel={() => {
            setShowModifier(false);
            setModifyingRecipe(null);
          }}
        />
      )}

      {showBulkEditor && (
        <BulkRecipeEditor
          recipes={bulkRecipes}
          onApply={handleApplyBulkChanges}
          onCancel={() => setShowBulkEditor(false)}
        />
      )}
    </div>
  );
};
