import React from "react";
import { SmeltingEditor } from "./SmeltingEditor";

interface BlastingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

export const BlastingEditor: React.FC<BlastingEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe,
}) => {
  return (
    <SmeltingEditor
      instancePath={instancePath}
      onSave={onSave}
      recipeType="blasting"
      initialRecipe={initialRecipe}
    />
  );
};
