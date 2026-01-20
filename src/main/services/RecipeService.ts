import path from "path";
import { promises as fs } from "fs";

export interface RecipeIngredient {
  item?: string;
  tag?: string;
  fluid?: string;
  count?: number;
  chance?: number;
  nbt?: any;
}

export interface RecipeResult {
  item?: string;
  fluid?: string;
  count?: number;
  chance?: number;
  nbt?: any;
}

export interface ParsedRecipe {
  id: string;
  type: string;
  ingredients: RecipeIngredient[];
  results: RecipeResult[];
  fluidIngredients?: Array<{ fluid: string; amount: number }>;
  fluidResults?: Array<{ fluid: string; amount: number }>;
  properties?: {
    processingTime?: number;
    energy?: number;
    experience?: number;
    heated?: boolean;
    superheated?: boolean;
    [key: string]: any;
  };
  raw: string; // Original script content
  filePath?: string; // Path to the script file
  inputs?: string[]; // Legacy support
  output?: string; // Legacy support
}

export interface RecipeTemplate {
  type: string;
  name: string;
  description: string;
  category: "vanilla" | "create" | "farmersdelight" | "thermal" | "mekanism" | "botania" | "other";
  template: string;
  requiredMods?: string[];
}

export class RecipeService {
  private recipesPath: string;

  constructor(instancePath: string) {
    this.recipesPath = path.join(instancePath, "kubejs", "server_scripts");
  }

  /**
   * Parse a recipe script file and extract all recipes
   */
  async parseRecipeFile(filePath: string): Promise<ParsedRecipe[]> {
    const recipes: ParsedRecipe[] = [];

    try {
      const content = await fs.readFile(filePath, "utf-8");

      // Find all event.recipes.* calls with proper parenthesis matching
      const recipeStarts =
        /event\.(recipes\.[\w.]+|shaped|shapeless|smelting|blasting|smoking|campfireCooking|stonecutting|smithing)\s*\(/g;

      let match;
      let recipeIndex = 0;

      while ((match = recipeStarts.exec(content)) !== null) {
        const methodName = match[1];
        const startPos = match.index;
        const openParenPos = match.index + match[0].length - 1;

        // Find matching closing parenthesis
        let depth = 1;
        let i = openParenPos + 1;
        let inString = false;
        let stringChar = "";

        while (i < content.length && depth > 0) {
          const char = content[i];
          const prevChar = i > 0 ? content[i - 1] : "";

          // Handle string literals
          if ((char === '"' || char === "'") && prevChar !== "\\") {
            if (!inString) {
              inString = true;
              stringChar = char;
            } else if (char === stringChar) {
              inString = false;
            }
          }

          if (!inString) {
            if (char === "(") depth++;
            else if (char === ")") depth--;
          }

          i++;
        }

        // Extract the full recipe call including any method chaining
        let fullMatch = content.substring(startPos, i);

        // Check for valid method chaining (not starting a new recipe)
        // Valid chains: .heated(), .superheated(), .processingTime(), .id(), etc.
        // Invalid: .filling(), .crushing(), .mixing(), etc. (these are new recipes)
        const validChainMethods = [
          "heated",
          "superheated",
          "processingTime",
          "id",
          "withChance",
          "keepHeldItem",
        ];
        const chainRegex = /\s*\.([\w]+)\s*\([^)]*\)/g;
        let endPos = i;

        while (true) {
          const remainingContent = content.substring(endPos);
          const chainMatch = chainRegex.exec(remainingContent);

          if (!chainMatch) break;

          const methodName = chainMatch[1];

          // Check if this is a valid chain method
          if (validChainMethods.includes(methodName)) {
            fullMatch += chainMatch[0];
            endPos += chainMatch.index + chainMatch[0].length;
            chainRegex.lastIndex = 0; // Reset regex
          } else {
            // This is a new recipe call, stop here
            break;
          }
        }

        try {
          const recipe = this.parseRecipeCall(methodName, "", fullMatch);
          recipe.id = `${path.basename(filePath, ".js")}_${recipeIndex++}`;
          recipe.filePath = filePath;
          recipes.push(recipe);
        } catch (error) {
          console.error(`Failed to parse recipe in ${filePath}:`, error);
        }
      }
    } catch (error) {
      console.error(`Failed to read recipe file ${filePath}:`, error);
    }

    return recipes;
  }

  /**
   * Parse a single recipe method call
   */
  private parseRecipeCall(methodName: string, rawParams: string, fullRecipe: string): ParsedRecipe {
    const type = this.normalizeRecipeType(methodName);
    const ingredients: RecipeIngredient[] = [];
    const results: RecipeResult[] = [];
    const properties: any = {};
    let fluidIngredients: any[] = [];
    let fluidResults: any[] = [];

    // Extract method chaining (e.g., .heated(), .withChance())
    const chainMethods = fullRecipe.match(/\.\w+\([^)]*\)/g) || [];
    for (const chain of chainMethods) {
      if (chain.includes(".heated()")) {
        properties.heated = true;
      }
      if (chain.includes(".superheated()")) {
        properties.superheated = true;
      }
      const timeMatch = chain.match(/\.processingTime\((\d+)\)/);
      if (timeMatch) {
        properties.processingTime = parseInt(timeMatch[1]);
      }
    }

    // Parse create:filling recipes
    if (type === "create:filling") {
      // Pattern: event.recipes.create.filling('result', [Fluid.of('fluid', amount), 'container'])
      // OR: event.recipes.create.filling('result', ['container', Fluid.of('fluid', amount)])

      // Extract result (first parameter)
      const resultMatch = fullRecipe.match(/filling\s*\(\s*["']([^"']+)["']/);
      if (resultMatch) {
        results.push({ item: resultMatch[1] });
      }

      // Extract fluid
      const fluidMatch = fullRecipe.match(/Fluid\.of\s*\(\s*["']([^"']+)["']\s*,\s*(\d+)\s*\)/);
      if (fluidMatch) {
        fluidIngredients.push({ fluid: fluidMatch[1], amount: parseInt(fluidMatch[2]) });
      }

      // Extract container item - look for item string that's NOT inside Fluid.of
      // Match quoted strings in the array that are not part of Fluid.of
      const arrayMatch = fullRecipe.match(/filling\s*\([^[]*\[([^\]]+)\]/);
      if (arrayMatch) {
        const arrayContent = arrayMatch[1];
        // Find all quoted strings
        const itemMatches = arrayContent.match(/["']([^"']+)["']/g);
        if (itemMatches) {
          // Filter out fluid IDs (they appear inside Fluid.of)
          for (const match of itemMatches) {
            const itemId = match.replace(/["']/g, "");
            // Check if this is not the fluid ID
            if (!fluidMatch || itemId !== fluidMatch[1]) {
              ingredients.push({ item: itemId });
              break; // Only take the first non-fluid item
            }
          }
        }
      }
    }

    // Parse create:emptying recipes
    if (type === "create:emptying") {
      // Pattern: event.recipes.create.emptying(['result_item', Fluid.of('fluid', amount)], 'input')
      const inputMatch = fullRecipe.match(/emptying\s*\(\s*\[[^\]]+\]\s*,\s*["']([^"']+)["']/);
      if (inputMatch) {
        ingredients.push({ item: inputMatch[1] });
      }

      // Extract result item (first array element)
      const resultMatch = fullRecipe.match(/\[\s*["']([^"']+)["']/);
      if (resultMatch) {
        results.push({ item: resultMatch[1] });
      }

      // Extract fluid
      const fluidMatch = fullRecipe.match(/Fluid\.of\s*\(\s*["']([^"']+)["']\s*,\s*(\d+)\s*\)/);
      if (fluidMatch) {
        fluidResults.push({ fluid: fluidMatch[1], amount: parseInt(fluidMatch[2]) });
      }
    }

    // Parse create:crushing recipes
    if (type === "create:crushing") {
      // Pattern: event.recipes.create.crushing([outputs...], 'input')
      const inputMatch = fullRecipe.match(/crushing\s*\(\s*\[[^\]]+\]\s*,\s*["']([^"']+)["']/);
      if (inputMatch) {
        ingredients.push({ item: inputMatch[1] });
      }

      // Extract outputs with chances
      const outputsArrayMatch = fullRecipe.match(/crushing\s*\(\s*\[([^\]]+)\]/);
      if (outputsArrayMatch) {
        const outputsContent = outputsArrayMatch[1];
        // Match both simple items and Item.of with withChance
        const itemMatches = outputsContent.matchAll(
          /["']([^"']+)["']|Item\.of\s*\(\s*["']([^"']+)["']\s*\)(?:\.withChance\s*\(\s*([\d.]+)\s*\))?/g
        );
        for (const match of itemMatches) {
          const itemId = match[1] || match[2];
          const chance = match[3] ? parseFloat(match[3]) : undefined;
          if (itemId) {
            results.push({ item: itemId, chance });
          }
        }
      }
    }

    // Parse create:milling recipes
    if (type === "create:milling") {
      // Pattern: event.recipes.create.milling([outputs...], 'input')
      const inputMatch = fullRecipe.match(/milling\s*\(\s*\[[^\]]+\]\s*,\s*["']([^"']+)["']/);
      if (inputMatch) {
        ingredients.push({ item: inputMatch[1] });
      }

      // Extract outputs with chances
      const outputsArrayMatch = fullRecipe.match(/milling\s*\(\s*\[([^\]]+)\]/);
      if (outputsArrayMatch) {
        const outputsContent = outputsArrayMatch[1];
        const itemMatches = outputsContent.matchAll(
          /["']([^"']+)["']|Item\.of\s*\(\s*["']([^"']+)["']\s*\)(?:\.withChance\s*\(\s*([\d.]+)\s*\))?/g
        );
        for (const match of itemMatches) {
          const itemId = match[1] || match[2];
          const chance = match[3] ? parseFloat(match[3]) : undefined;
          if (itemId) {
            results.push({ item: itemId, chance });
          }
        }
      }
    }

    // Parse create:cutting recipes
    if (type === "create:cutting") {
      // Pattern: event.recipes.create.cutting([outputs...], 'input')
      const inputMatch = fullRecipe.match(/cutting\s*\(\s*\[[^\]]+\]\s*,\s*["']([^"']+)["']/);
      if (inputMatch) {
        ingredients.push({ item: inputMatch[1] });
      }

      // Extract outputs with chances
      const outputsArrayMatch = fullRecipe.match(/cutting\s*\(\s*\[([^\]]+)\]/);
      if (outputsArrayMatch) {
        const outputsContent = outputsArrayMatch[1];
        const itemMatches = outputsContent.matchAll(
          /["']([^"']+)["']|Item\.of\s*\(\s*["']([^"']+)["']\s*\)(?:\.withChance\s*\(\s*([\d.]+)\s*\))?/g
        );
        for (const match of itemMatches) {
          const itemId = match[1] || match[2];
          const chance = match[3] ? parseFloat(match[3]) : undefined;
          if (itemId) {
            results.push({ item: itemId, chance });
          }
        }
      }
    }

    // Parse create:pressing recipes
    if (type === "create:pressing") {
      // Pattern: event.recipes.create.pressing('output', 'input')
      const match = fullRecipe.match(/pressing\s*\(\s*["']([^"']+)["']\s*,\s*["']([^"']+)["']/);
      if (match) {
        results.push({ item: match[1] });
        ingredients.push({ item: match[2] });
      }
    }

    // Parse create:mixing recipes
    if (type === "create:mixing") {
      // Pattern: event.recipes.create.mixing('output', [inputs...])
      const outputMatch = fullRecipe.match(/mixing\s*\(\s*["']([^"']+)["']/);
      if (outputMatch) {
        results.push({ item: outputMatch[1] });
      }

      // Extract inputs
      const inputsArrayMatch = fullRecipe.match(/mixing\s*\([^[]*\[([^\]]+)\]/);
      if (inputsArrayMatch) {
        const inputsContent = inputsArrayMatch[1];
        const itemMatches = inputsContent.match(/["']([^"']+)["']/g);
        if (itemMatches) {
          itemMatches.forEach((match) => {
            const itemId = match.replace(/["']/g, "");
            ingredients.push({ item: itemId });
          });
        }
      }
    }

    // Parse create:deploying recipes
    if (type === "create:deploying") {
      // Pattern: event.recipes.create.deploying('output', [base, tool])
      const outputMatch = fullRecipe.match(/deploying\s*\(\s*["']([^"']+)["']/);
      if (outputMatch) {
        results.push({ item: outputMatch[1] });
      }

      // Extract base and tool from array
      const inputsArrayMatch = fullRecipe.match(/deploying\s*\([^[]*\[([^\]]+)\]/);
      if (inputsArrayMatch) {
        const inputsContent = inputsArrayMatch[1];
        const itemMatches = inputsContent.match(/["']([^"']+)["']/g);
        if (itemMatches && itemMatches.length >= 2) {
          ingredients.push({ item: itemMatches[0].replace(/["']/g, "") });
          ingredients.push({ item: itemMatches[1].replace(/["']/g, "") });
        }
      }
    }

    const parsed: any = {
      id: "",
      type,
      ingredients,
      results,
      properties,
      raw: fullRecipe,
    };

    if (fluidIngredients.length > 0) {
      parsed.fluidIngredients = fluidIngredients;
    }
    if (fluidResults.length > 0) {
      parsed.fluidResults = fluidResults;
    }

    return parsed;
  }

  private normalizeRecipeType(methodName: string): string {
    // Map method names to standard recipe types
    const typeMap: Record<string, string> = {
      shaped: "minecraft:crafting_shaped",
      shapeless: "minecraft:crafting_shapeless",
      smelting: "minecraft:smelting",
      blasting: "minecraft:blasting",
      smoking: "minecraft:smoking",
      campfireCooking: "minecraft:campfire_cooking",
      stonecutting: "minecraft:stonecutting",
      smithing: "minecraft:smithing",
      "recipes.create.mechanical_crafting": "create:mechanical_crafting",
      "recipes.create.crushing": "create:crushing",
      "recipes.create.milling": "create:milling",
      "recipes.create.mixing": "create:mixing",
      "recipes.create.compacting": "create:compacting",
      "recipes.create.pressing": "create:pressing",
      "recipes.create.filling": "create:filling",
      "recipes.create.emptying": "create:emptying",
      "recipes.create.cutting": "create:cutting",
      "recipes.create.deploying": "create:deploying",
      "recipes.create.item_application": "create:item_application",
      "recipes.create.sequenced_assembly": "create:sequenced_assembly",
      "recipes.farmersdelight.cooking": "farmersdelight:cooking",
      "recipes.farmersdelight.cutting": "farmersdelight:cutting",
    };

    return typeMap[methodName] || methodName;
  }

  /**
   * Get all available recipe templates
   */
  getRecipeTemplates(): RecipeTemplate[] {
    return [
      // Vanilla Templates
      {
        type: "minecraft:crafting_shaped",
        name: "Shaped Crafting",
        description: "Create a shaped crafting recipe",
        category: "vanilla",
        template: `event.shaped('output_item', [
  'AAA',
  'ABA',
  'AAA'
], {
  A: 'ingredient_a',
  B: 'ingredient_b'
})`,
      },
      {
        type: "minecraft:crafting_shapeless",
        name: "Shapeless Crafting",
        description: "Create a shapeless crafting recipe",
        category: "vanilla",
        template: `event.shapeless('output_item', [
  'ingredient_a',
  'ingredient_b',
  'ingredient_c'
])`,
      },
      {
        type: "minecraft:smelting",
        name: "Smelting",
        description: "Create a furnace smelting recipe",
        category: "vanilla",
        template: `event.smelting('output_item', 'input_item')`,
      },

      // Create Templates
      {
        type: "create:crushing",
        name: "Create: Crushing",
        description: "Crush items in a crushing wheel",
        category: "create",
        requiredMods: ["create"],
        template: `event.recipes.create.crushing([
  'output_item',
  Item.of('bonus_item').withChance(0.5)
], 'input_item')`,
      },
      {
        type: "create:mixing",
        name: "Create: Mixing",
        description: "Mix ingredients in a mechanical mixer",
        category: "create",
        requiredMods: ["create"],
        template: `event.recipes.create.mixing('output_item', [
  'ingredient_a',
  'ingredient_b'
]).heated()`,
      },
      {
        type: "create:pressing",
        name: "Create: Pressing",
        description: "Press items with a mechanical press",
        category: "create",
        requiredMods: ["create"],
        template: `event.recipes.create.pressing('output_item', 'input_item')`,
      },
      {
        type: "create:cutting",
        name: "Create: Cutting",
        description: "Cut items with a mechanical saw",
        category: "create",
        requiredMods: ["create"],
        template: `event.recipes.create.cutting([
  'output_item'
], 'input_item')`,
      },
    ];
  }

  /**
   * Create a new recipe from template
   */
  async createRecipe(scriptPath: string, recipe: string): Promise<void> {
    try {
      let content = "";

      // Check if file exists
      try {
        content = await fs.readFile(scriptPath, "utf-8");
      } catch {
        // File doesn't exist, create with proper structure
        content = `// Auto-generated recipe file\nServerEvents.recipes(event => {\n  // Add your recipes here\n\n});\n`;
      }

      // Insert recipe before the closing brace
      const lines = content.split("\n");
      const closingBraceIndex = lines.length - 2; // Typically second to last line

      lines.splice(closingBraceIndex, 0, `  ${recipe}`);
      lines.splice(closingBraceIndex, 0, ""); // Add blank line

      await fs.writeFile(scriptPath, lines.join("\n"), "utf-8");
    } catch (error) {
      throw new Error(
        `Failed to create recipe: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Delete a recipe from a script file
   */
  async deleteRecipe(scriptPath: string, recipeId: string): Promise<void> {
    try {
      const content = await fs.readFile(scriptPath, "utf-8");
      const recipes = await this.parseRecipeFile(scriptPath);

      const recipe = recipes.find((r) => r.id === recipeId);
      if (!recipe) {
        throw new Error(`Recipe ${recipeId} not found`);
      }

      // Remove the recipe from content
      const newContent = content.replace(recipe.raw, "");

      await fs.writeFile(scriptPath, newContent, "utf-8");
    } catch (error) {
      throw new Error(
        `Failed to delete recipe: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Search for recipes by ingredient or output
   */
  async searchRecipes(query: string): Promise<any[]> {
    const allRecipes: any[] = [];

    // Recursive function to scan directories for recipe files
    const scanDirectory = async (dirPath: string) => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            await scanDirectory(fullPath);
          } else if (entry.isFile() && entry.name.endsWith(".js")) {
            // Parse recipe file
            try {
              const recipes = await this.parseRecipeFile(fullPath);

              // Add filePath to each recipe and format for display
              recipes.forEach((recipe) => {
                allRecipes.push({
                  ...recipe,
                  filePath: fullPath,
                  output: recipe.results[0]?.item || "Unknown",
                  inputs: recipe.ingredients.map((ing) => ing.item || ing.tag).filter(Boolean),
                });
              });
            } catch (err) {
              console.warn(`Failed to parse recipe file ${fullPath}:`, err);
            }
          }
        }
      } catch (error) {
        // Directory became inaccessible during scan
        if (process.env.DEBUG) {
          console.log(`Skipped directory ${dirPath}:`, error);
        }
      }
    };

    try {
      // Check if recipes path exists before scanning
      await fs.access(this.recipesPath);
      await scanDirectory(this.recipesPath);
    } catch (error) {
      // Recipes path doesn't exist - this is fine for instances without KubeJS
      if (process.env.DEBUG) {
        console.log("Recipes path does not exist:", this.recipesPath);
      }
    }

    if (!query) return allRecipes;

    const lowerQuery = query.toLowerCase();
    return allRecipes.filter((recipe) => {
      const matchesIngredient = recipe.ingredients.some(
        (ing: any) =>
          ing.item?.toLowerCase().includes(lowerQuery) ||
          ing.tag?.toLowerCase().includes(lowerQuery)
      );
      const matchesResult = recipe.results.some((res: any) =>
        res.item?.toLowerCase().includes(lowerQuery)
      );
      const matchesType = recipe.type.toLowerCase().includes(lowerQuery);
      const matchesId = recipe.id.toLowerCase().includes(lowerQuery);

      return matchesIngredient || matchesResult || matchesType || matchesId;
    });
  }

  /**
   * Convert a recipe object from the visual editor to KubeJS script code
   */
  private recipeObjectToScript(recipe: any): string {
    const type = recipe.type;

    // Shaped Crafting
    if (type === "minecraft:crafting_shaped" || type === "crafting_shaped") {
      const pattern = recipe.pattern.map((row: string) => `'${row}'`).join(",\n    ");
      const keyEntries = Object.entries(recipe.key)
        .map(([key, itemId]) => `    ${key}: '${itemId}'`)
        .join(",\n");

      return `event.shaped('${recipe.result.item}'${recipe.result.count > 1 ? ` * ${recipe.result.count}` : ""}, [
    ${pattern}
  ], {
${keyEntries}
  })`;
    }

    // Shapeless Crafting
    if (type === "minecraft:crafting_shapeless" || type === "crafting_shapeless") {
      const ingredients = recipe.ingredients.map((ing: any) => `'${ing.item}'`).join(", ");
      return `event.shapeless('${recipe.result.item}'${recipe.result.count > 1 ? ` * ${recipe.result.count}` : ""}, [${ingredients}])`;
    }

    // Vanilla Smelting Types
    if (
      type === "smelting" ||
      type === "blasting" ||
      type === "smoking" ||
      type === "campfire_cooking"
    ) {
      const methodMap: Record<string, string> = {
        smelting: "smelting",
        blasting: "blasting",
        smoking: "smoking",
        campfire_cooking: "campfireCooking",
      };
      const method = methodMap[type] || type;
      return `event.${method}('${recipe.output}', '${recipe.input}')`;
    }

    // Stonecutting
    if (type === "stonecutting") {
      return `event.stonecutting('${recipe.output}', '${recipe.input}')`;
    }

    // Create: Crushing
    if (type === "create:crushing") {
      const outputs = recipe.outputs
        .map((out: any) => {
          if (out.chance && out.chance < 1) {
            return `Item.of('${out.item}').withChance(${out.chance})`;
          }
          return `'${out.item}'`;
        })
        .join(",\n    ");
      return `event.recipes.create.crushing([
    ${outputs}
  ], '${recipe.input}')`;
    }

    // Create: Mixing
    if (type === "create:mixing") {
      const inputs = recipe.inputs.map((inp: string) => `'${inp}'`).join(",\n    ");
      let script = `event.recipes.create.mixing('${recipe.output}', [
    ${inputs}
  ])`;
      if (recipe.heated) script += ".heated()";
      if (recipe.superheated) script += ".superheated()";
      return script;
    }

    // Create: Pressing
    if (type === "create:pressing") {
      return `event.recipes.create.pressing('${recipe.output}', '${recipe.input}')`;
    }

    // Create: Cutting
    if (type === "create:cutting") {
      const outputs = recipe.outputs
        .map((out: any) => {
          if (out.chance && out.chance < 1) {
            return `Item.of('${out.item}').withChance(${out.chance})`;
          }
          return `'${out.item}'`;
        })
        .join(",\n    ");
      return `event.recipes.create.cutting([
    ${outputs}
  ], '${recipe.input}')`;
    }

    // Create: Milling
    if (type === "create:milling") {
      const outputs = recipe.outputs
        .map((out: any) => {
          if (out.chance && out.chance < 1) {
            return `Item.of('${out.item}').withChance(${out.chance})`;
          }
          return `'${out.item}'`;
        })
        .join(",\n    ");
      return `event.recipes.create.milling([
    ${outputs}
  ], '${recipe.input}')`;
    }

    // Create: Deploying
    if (type === "create:deploying") {
      return `event.recipes.create.deploying('${recipe.output}', [
    '${recipe.inputs[0]}',
    '${recipe.inputs[1]}'
  ])`;
    }

    // Create: Filling
    if (type === "create:filling") {
      const ingredientObj = recipe.ingredients?.[0];
      const fluidIngredient = recipe.fluidIngredients?.[0];
      const resultObj = recipe.results?.[0];

      // Handle different input formats (item string or UnifiedSelector object)
      const ingredient = ingredientObj?.id || ingredientObj?.item || ingredientObj;
      const result = resultObj?.id || resultObj?.item || resultObj;
      const fluidAmount = fluidIngredient?.amount || 1000;
      const fluidId = fluidIngredient?.id || fluidIngredient?.fluid || fluidIngredient;

      return `event.recipes.create.filling('${result}', ['${ingredient}', Fluid.of('${fluidId}', ${fluidAmount})])`;
    }

    // Create: Emptying
    if (type === "create:emptying") {
      const ingredientObj = recipe.ingredients?.[0];
      const resultObj = recipe.results?.[0];
      const fluidResult = recipe.fluidResults?.[0];

      // Handle different input formats
      const ingredient = ingredientObj?.id || ingredientObj?.item || ingredientObj;
      const resultItem = resultObj?.id || resultObj?.item || resultObj;
      const fluidAmount = fluidResult?.amount || 1000;
      const fluidId = fluidResult?.id || fluidResult?.fluid || fluidResult;

      return `event.recipes.create.emptying(['${resultItem}', Fluid.of('${fluidId}', ${fluidAmount})], '${ingredient}')`;
    }

    throw new Error(`Unsupported recipe type: ${type}`);
  }

  /**
   * Save a recipe from a visual editor object
   */
  async saveRecipeFromObject(recipe: any): Promise<void> {
    try {
      // Generate script code from recipe object
      const recipeScript = this.recipeObjectToScript(recipe);

      // Determine the script file path
      const scriptFileName = "custom_recipes.js";
      const scriptPath = path.join(this.recipesPath, scriptFileName);

      // Ensure kubejs/server_scripts directory exists
      await fs.mkdir(this.recipesPath, { recursive: true });

      // Add recipe to the file
      await this.createRecipe(scriptPath, recipeScript);
    } catch (error) {
      throw new Error(
        `Failed to save recipe: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}
