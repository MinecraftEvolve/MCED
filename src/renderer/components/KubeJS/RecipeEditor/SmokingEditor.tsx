import React from "react";
import { SmeltingEditor } from "./SmeltingEditor";

interface SmokingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

export const SmokingEditor: React.FC<SmokingEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe,
}) => {
  return (
    <SmeltingEditor
      instancePath={instancePath}
      onSave={onSave}
      recipeType="smoking"
      initialRecipe={initialRecipe}
    />
  );
};
