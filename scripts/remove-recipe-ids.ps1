# Script to remove recipeId from all editors
$editors = @(
    "CreateCuttingEditor.tsx",
    "CreateDeployingEditor.tsx",
    "CreateEmptyingEditor.tsx",
    "CreateFillingEditor.tsx",
    "CreateMechanicalCraftingEditor.tsx",
    "CreateMillingEditor.tsx",
    "FarmersDelightCuttingBoardEditor.tsx",
    "StonecuttingEditor.tsx",
    "ThermalSmelterEditor.tsx"
)

$basePath = "C:\Users\Luke\Dev\MCED\src\renderer\components\KubeJS\RecipeEditor"

foreach ($editor in $editors) {
    $file = Join-Path $basePath $editor
    if (Test-Path $file) {
        $content = Get-Content $file -Raw
        
        # Remove recipeId state declaration
        $content = $content -replace "  const \[recipeId, setRecipeId\] = useState\(initialRecipe\?\.id \|\| ''\);`r?`n", ""
        
        # Remove recipeId from validation
        $content = $content -replace "if \(!recipeId \|\| ", "if ("
        $content = $content -replace "\|\| !recipeId", ""
        $content = $content -replace "!recipeId \|\| ", ""
        $content = $content -replace "!recipeId,", ""
        
        # Remove recipeId from alert messages  
        $content = $content -replace "Please provide a recipe ID,? (and )?", "Please provide "
        $content = $content -replace ", ?a recipe ID", ""
        
        # Remove id from recipe object
        $content = $content -replace "      id: recipeId,`r?`n", ""
        $content = $content -replace "      id,`r?`n", ""
        
        # Remove Recipe ID input field (multiline)
        $content = $content -replace "(?s)      {/\* Recipe ID \*/}`r?`n      <div>`r?`n.*?</div>`r?`n`r?`n", ""
        $content = $content -replace "(?s)      <div>`r?`n        <label.*?>Recipe ID</label>`r?`n.*?</div>`r?`n`r?`n", ""
        
        # Remove recipeId from code preview condition
        $content = $content -replace "recipeId && ", ""
        $content = $content -replace " && recipeId", ""
        
        # Remove recipeId from Clear button
        $content = $content -replace "            setRecipeId\(''\);`r?`n", ""
        
        # Remove recipeId from disabled condition
        $content = $content -replace "!recipeId \|\| ", ""
        $content = $content -replace " \|\| !recipeId", ""
        
        Set-Content $file $content -NoNewline
        Write-Host "✅ Processed $editor"
    }
}

Write-Host "`n✨ Done! Recipe IDs removed from all editors."
