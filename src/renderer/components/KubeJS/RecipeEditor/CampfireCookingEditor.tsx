import React from 'react';
import { SmeltingEditor } from './SmeltingEditor';

interface CampfireCookingEditorProps {
  instancePath: string;
  onSave: (recipe: any) => void;
  initialRecipe?: any;
}

export const CampfireCookingEditor: React.FC<CampfireCookingEditorProps> = ({
  instancePath,
  onSave,
  initialRecipe
}) => {
  return (
    <SmeltingEditor
      instancePath={instancePath}
      onSave={onSave}
      recipeType="campfire_cooking"
      initialRecipe={initialRecipe}
    />
  );
};
