import { promises as fs } from "fs";
import path from "path";

export interface KubeJSAddon {
  id: string;
  name: string;
  version: string;
  features: string[];
}

export interface ProbeJSTypeInfo {
  classes: string[];
  methods: Record<string, string[]>;
  properties: Record<string, string[]>;
}

export interface KubeJSInfo {
  isInstalled: boolean;
  version: string | null;
  addons: KubeJSAddon[];
  scriptsPath: string | null;
  probeJSTypes?: ProbeJSTypeInfo;
}

export interface KubeJSError {
  type: "syntax" | "runtime" | "compatibility" | "missing_api" | "version_mismatch";
  message: string;
  line?: number;
  column?: number;
  file?: string;
  suggestion?: string;
  severity: "error" | "warning" | "info";
}

export interface KubeJSValidationResult {
  isValid: boolean;
  errors: KubeJSError[];
  warnings: KubeJSError[];
  version: string;
  migrationNeeded: boolean;
  suggestions: string[];
}

const KUBEJS_PATTERNS = ["kubejs", "kubejs-forge", "kubejs-fabric"];

// Basic KubeJS version detection and error patterns
const COMMON_KUBEJS_ERRORS = [
  "NullPointerException: Check for undefined variables or objects",
  "ClassNotFoundException: Missing mod dependencies",
  "NoSuchMethodError: KubeJS version incompatibility",
  "RuntimeException: Script syntax or runtime errors",
  "SyntaxError: Invalid JavaScript syntax",
  "ReferenceError: Undefined variable or function",
  'Exception in thread "main": KubeJS startup script syntax errors',
  "could not be found: Missing mod or incorrect item ID",
];

const KNOWN_ADDONS: Record<string, { name: string; features: string[]; shortId: string }> = {
  "kubejs-create": {
    name: "KubeJS Create",
    shortId: "create",
    features: [
      "create_recipes",
      "assembly_recipes",
      "mixing_recipes",
      "crushing_recipes",
      "pressing_recipes",
      "deploying_recipes",
    ],
  },
  kubejs_create: {
    name: "KubeJS Create",
    shortId: "create",
    features: [
      "create_recipes",
      "assembly_recipes",
      "mixing_recipes",
      "crushing_recipes",
      "pressing_recipes",
      "deploying_recipes",
    ],
  },
  create: {
    name: "Create",
    shortId: "create",
    features: ["mechanical_crafting", "contraptions", "kinetic_power"],
  },
  thermal: {
    name: "Thermal Expansion",
    shortId: "thermal",
    features: ["thermal_machines", "pulverizer", "smelter", "induction_smelter"],
  },
  thermal_expansion: {
    name: "Thermal Expansion",
    shortId: "thermal",
    features: ["thermal_machines", "pulverizer", "smelter", "induction_smelter"],
  },
  farmersdelight: {
    name: "Farmer's Delight",
    shortId: "farmersdelight",
    features: ["cooking_pot", "cutting_board", "food_recipes"],
  },
  farmers_delight: {
    name: "Farmer's Delight",
    shortId: "farmersdelight",
    features: ["cooking_pot", "cutting_board", "food_recipes"],
  },
  kjscc: {
    name: "KubeJS CC:Tweaked",
    shortId: "computercraft",
    features: ["computercraft_peripherals", "turtle_tools"],
  },
  kubejsadditions: {
    name: "KubeJS Additions",
    shortId: "additions",
    features: ["custom_events", "advanced_commands", "data_components"],
  },
  kubejsdelight: {
    name: "KubeJS Delight",
    shortId: "farmersdelight",
    features: ["farmers_delight_recipes", "cooking_pot", "cutting_board"],
  },
  ponderjs: {
    name: "PonderJS",
    shortId: "ponder",
    features: ["create_ponder_scenes", "tooltips", "custom_chapters"],
  },
  lychee: {
    name: "Lychee",
    shortId: "lychee",
    features: ["item_inside", "block_crushing", "lightning_channeling"],
  },
  probejs: {
    name: "ProbeJS",
    shortId: "probe",
    features: ["type_definitions", "intellisense", "auto_complete"],
  },
  rhino: {
    name: "Rhino (JS Engine)",
    shortId: "rhino",
    features: ["javascript_runtime", "es6_support"],
  },
  architectury: {
    name: "Architectury API",
    shortId: "architectury",
    features: ["cross_platform", "api_library"],
  },
};

interface ParsedRecipe {
  code: string;
  mod: string;
  type: string;
  fullLine: string;
}

export class KubeJSService {
  private instancePath: string;
  private instanceName: string;
  private modsPath: string;

  constructor(instancePath: string) {
    this.instancePath = instancePath;
    this.instanceName = path.basename(instancePath);
    this.modsPath = path.join(instancePath, "mods");
  }

  async detectKubeJS(): Promise<KubeJSInfo> {
    const result: KubeJSInfo = {
      isInstalled: false,
      version: null,
      addons: [],
      scriptsPath: null,
    };

    try {
      const modsExist = await this.directoryExists(this.modsPath);
      if (!modsExist) {
        return result;
      }

      const files = await fs.readdir(this.modsPath);

      // Check for KubeJS main mod
      const kubeJSFile = files.find((file) =>
        KUBEJS_PATTERNS.some(
          (pattern) => file.toLowerCase().includes(pattern) && file.endsWith(".jar")
        )
      );

      if (!kubeJSFile) {
        return result;
      }

      result.isInstalled = true;
      result.version = this.extractVersion(kubeJSFile);

      // Check for KubeJS scripts folder
      const scriptsPath = path.join(this.instancePath, "kubejs");
      const scriptsExist = await this.directoryExists(scriptsPath);
      if (scriptsExist) {
        result.scriptsPath = scriptsPath;
      }

      // Detect addons
      result.addons = await this.detectAddons(files);

      // Load ProbeJS type definitions if ProbeJS is installed
      const hasProbeJS = result.addons.some((addon) => addon.id === "probe");
      if (hasProbeJS && scriptsExist) {
        result.probeJSTypes = await this.loadProbeJSTypes(scriptsPath);
      }

      return result;
    } catch (error) {
      console.error("Error detecting KubeJS:", error);
      return result;
    }
  }

  private async detectAddons(modFiles: string[]): Promise<KubeJSAddon[]> {
    const addons: KubeJSAddon[] = [];
    const seenShortIds = new Set<string>();

    for (const [addonId, addonInfo] of Object.entries(KNOWN_ADDONS)) {
      const addonFile = modFiles.find(
        (file) => file.toLowerCase().includes(addonId) && file.endsWith(".jar")
      );

      if (addonFile && !seenShortIds.has(addonInfo.shortId)) {
        seenShortIds.add(addonInfo.shortId);
        addons.push({
          id: addonInfo.shortId,
          name: addonInfo.name,
          version: this.extractVersion(addonFile),
          features: addonInfo.features,
        });
      }
    }

    return addons;
  }

  private extractVersion(filename: string): string {
    const versionMatch = filename.match(/(\d+\.\d+\.\d+)/);
    return versionMatch ? versionMatch[1] : "unknown";
  }

  private async directoryExists(dirPath: string): Promise<boolean> {
    try {
      const stat = await fs.stat(dirPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async loadProbeJSTypes(scriptsPath: string): Promise<ProbeJSTypeInfo> {
    const typeInfo: ProbeJSTypeInfo = {
      classes: [],
      methods: {},
      properties: {},
    };

    try {
      // ProbeJS generates type definitions in .probe/client and .probe/server
      const probePath = path.join(scriptsPath, ".probe");
      const probeExists = await this.directoryExists(probePath);

      if (!probeExists) {
        return typeInfo;
      }

      // Try to load from both client and server folders
      const folders = ["client", "server"];

      for (const folder of folders) {
        const folderPath = path.join(probePath, folder);
        const folderExists = await this.directoryExists(folderPath);

        if (folderExists) {
          await this.parseProbeJSFolder(folderPath, typeInfo);
        }
      }

      return typeInfo;
    } catch (error) {
      console.error("Error loading ProbeJS types:", error);
      return typeInfo;
    }
  }

  private async parseProbeJSFolder(folderPath: string, typeInfo: ProbeJSTypeInfo): Promise<void> {
    try {
      const files = await fs.readdir(folderPath, { withFileTypes: true });

      for (const file of files) {
        const fullPath = path.join(folderPath, file.name);

        if (file.isDirectory()) {
          await this.parseProbeJSFolder(fullPath, typeInfo);
        } else if (file.name.endsWith(".d.ts")) {
          await this.parseTypeDefinitionFile(fullPath, typeInfo);
        }
      }
    } catch (error) {
      console.error("Error parsing ProbeJS folder:", error);
    }
  }

  private async parseTypeDefinitionFile(
    filePath: string,
    typeInfo: ProbeJSTypeInfo
  ): Promise<void> {
    try {
      const content = await fs.readFile(filePath, "utf-8");

      // Extract class/interface declarations
      const classMatches = content.matchAll(/(?:class|interface)\s+(\w+)/g);
      for (const match of classMatches) {
        const className = match[1];
        if (!typeInfo.classes.includes(className)) {
          typeInfo.classes.push(className);
        }
      }

      // Extract method signatures
      const methodMatches = content.matchAll(/(\w+)\s*\(([^)]*)\)\s*:\s*([^;{]+)/g);
      for (const match of methodMatches) {
        const methodName = match[1];
        const params = match[2];
        const returnType = match[3].trim();
        const signature = `${methodName}(${params}): ${returnType}`;

        if (!typeInfo.methods[methodName]) {
          typeInfo.methods[methodName] = [];
        }
        if (!typeInfo.methods[methodName].includes(signature)) {
          typeInfo.methods[methodName].push(signature);
        }
      }

      // Extract property declarations
      const propertyMatches = content.matchAll(/(\w+)\s*:\s*([^;]+);/g);
      for (const match of propertyMatches) {
        const propName = match[1];
        const propType = match[2].trim();

        if (!typeInfo.properties[propName]) {
          typeInfo.properties[propName] = [];
        }
        if (!typeInfo.properties[propName].includes(propType)) {
          typeInfo.properties[propName].push(propType);
        }
      }
    } catch (error) {
      console.error("Error parsing type definition file:", error);
    }
  }

  async getScriptFiles(): Promise<string[]> {
    const info = await this.detectKubeJS();
    if (!info.scriptsPath) {
      return [];
    }

    try {
      const scriptFiles: string[] = [];
      await this.scanDirectory(info.scriptsPath, scriptFiles);
      return scriptFiles;
    } catch (error) {
      console.error("Error getting script files:", error);
      return [];
    }
  }

  private async scanDirectory(dirPath: string, results: string[]): Promise<void> {
    try {
      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);

        if (entry.isDirectory()) {
          await this.scanDirectory(fullPath, results);
        } else if (entry.isFile() && entry.name.endsWith(".js")) {
          results.push(fullPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error);
    }
  }

  async readScriptFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf-8");
    } catch (error) {
      console.error(`Error reading script file ${filePath}:`, error);
      throw error;
    }
  }

  async writeScriptFile(filePath: string, content: string): Promise<void> {
    try {
      await fs.writeFile(filePath, content, "utf-8");
    } catch (error) {
      console.error(`Error writing script file ${filePath}:`, error);
      throw error;
    }
  }

  async createScriptFile(relativePath: string, content: string): Promise<string> {
    const info = await this.detectKubeJS();
    if (!info.scriptsPath) {
      throw new Error("KubeJS scripts folder not found");
    }

    const fullPath = path.join(info.scriptsPath, relativePath);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await this.writeScriptFile(fullPath, content);

    return fullPath;
  }

  async deleteScriptFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error deleting script file ${filePath}:`, error);
      throw error;
    }
  }

  async saveTag(tagData: {
    id: string;
    type: "items" | "blocks" | "fluids" | "entity_types";
    values: string[];
    replace?: boolean;
  }): Promise<string> {
    const info = await this.detectKubeJS();
    if (!info.scriptsPath) {
      throw new Error("KubeJS scripts folder not found");
    }

    const tagsFolder = path.join(info.scriptsPath, "server_scripts", "tags");
    await fs.mkdir(tagsFolder, { recursive: true });

    const fileName = `${tagData.id.replace(/[:/]/g, "_")}.js`;
    const filePath = path.join(tagsFolder, fileName);

    const code = `// Tag: ${tagData.id}
ServerEvents.tags('${tagData.type}', event => {
  event.add('${tagData.id}', [
${tagData.values.map((v) => `    '${v}'`).join(",\n")}
  ])${tagData.replace ? ".removeAll()" : ""};
});
`;

    await fs.writeFile(filePath, code, "utf-8");
    return filePath;
  }

  async listScripts(): Promise<
    Array<{
      name: string;
      path: string;
      type: "server" | "client" | "startup";
      size: number;
      modified: Date;
    }>
  > {
    const info = await this.detectKubeJS();
    if (!info.scriptsPath) {
      return [];
    }

    const scripts: Array<{
      name: string;
      path: string;
      type: "server" | "client" | "startup";
      size: number;
      modified: Date;
    }> = [];

    const scriptTypes: Array<"server" | "client" | "startup"> = ["server", "client", "startup"];

    // Recursive function to scan directories
    const scanDirectory = async (
      dirPath: string,
      type: "server" | "client" | "startup",
      relativePath: string = ""
    ) => {
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);

          if (entry.isDirectory()) {
            // Recursively scan subdirectories
            const newRelativePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;
            await scanDirectory(fullPath, type, newRelativePath);
          } else if (entry.isFile() && entry.name.endsWith(".js")) {
            // Add script file
            const stats = await fs.stat(fullPath);
            const displayName = relativePath ? `${relativePath}/${entry.name}` : entry.name;

            scripts.push({
              name: displayName,
              path: fullPath,
              type,
              size: stats.size,
              modified: stats.mtime,
            });
          }
        }
      } catch (err) {
        // Directory became inaccessible during scan
        // Log as debug info only
        if (process.env.DEBUG) {
          console.log(`Skipped inaccessible directory ${dirPath}:`, err);
        }
      }
    };

    for (const type of scriptTypes) {
      const scriptsFolder = path.join(info.scriptsPath, `${type}_scripts`);

      // Check if directory exists before scanning
      try {
        await fs.access(scriptsFolder);
        await scanDirectory(scriptsFolder, type);
      } catch (err) {
        // Directory doesn't exist, skip silently
        // This is normal for fresh instances
      }
    }

    return scripts;
  }

  async loadTags(): Promise<
    Array<{
      id: string;
      type: string;
      values: string[];
      filePath: string;
    }>
  > {
    const info = await this.detectKubeJS();
    if (!info.scriptsPath) {
      return [];
    }

    const tagsFolder = path.join(info.scriptsPath, "server_scripts", "tags");
    const tagsExist = await this.directoryExists(tagsFolder);

    if (!tagsExist) {
      return [];
    }

    try {
      const files = await fs.readdir(tagsFolder);
      const tags: Array<{ id: string; type: string; values: string[]; filePath: string }> = [];

      for (const file of files) {
        if (!file.endsWith(".js")) continue;

        const filePath = path.join(tagsFolder, file);
        const content = await fs.readFile(filePath, "utf-8");

        // Parse tag data from file
        const typeMatch = content.match(/ServerEvents\.tags\('([^']+)'/);
        const idMatch = content.match(/event\.add\('([^']+)'/);
        const valuesMatch = content.match(/\[\s*([\s\S]*?)\s*\]/);

        if (typeMatch && idMatch && valuesMatch) {
          const values = valuesMatch[1]
            .split(",")
            .map((v) => v.trim().replace(/['"]/g, ""))
            .filter((v) => v);

          tags.push({
            id: idMatch[1],
            type: typeMatch[1],
            values,
            filePath,
          });
        }
      }

      return tags;
    } catch (error) {
      console.error("Error loading tags:", error);
      return [];
    }
  }

  private generateRecipeFile(
    mod: string,
    recipes: ParsedRecipe[],
    kubejsVersion: string,
    preserveComments: boolean,
    strategy: string,
    type?: string
  ): string {
    // FarmersDelight compatibility fix for 1.20.1
    const fixFarmersDelightSyntax = (code: string): string => {
      if (kubejsVersion === "1.20.1" || kubejsVersion === "auto") {
        // Fix FarmersDelight recipe syntax for 1.20.1
        return code
          .replace(/event\.recipes\.farmersdelight\./g, "event.recipes.farmersdelight.")
          .replace(/\.cutting\(/g, ".cuttingBoard(") // FD 1.20.1 uses cuttingBoard instead of cutting
          .replace(/\.cooking\(/g, ".cookingPot(") // FD 1.20.1 uses cookingPot instead of cooking
          .replace(/\.cutting_board\(/g, ".cuttingBoard("); // Alternative naming
      }
      return code;
    };

    let fileContent = "";

    // Header comments
    if (preserveComments) {
      if (strategy === "mod-only") {
        fileContent += `// ${mod.charAt(0).toUpperCase() + mod.slice(1)} Recipes\n`;
        fileContent += `// Auto-organized: ${new Date().toLocaleString()}\n`;
        fileContent += `// File: recipes/${mod}.js\n`;
      } else if (strategy === "type-only") {
        fileContent += `// ${(type || "unknown").charAt(0).toUpperCase() + (type || "unknown").slice(1)} Recipes\n`;
        fileContent += `// Auto-organized: ${new Date().toLocaleString()}\n`;
        fileContent += `// File: recipes/${type || "unknown"}.js\n`;
      } else if (strategy === "flat") {
        fileContent += `// All Recipes\n`;
        fileContent += `// Auto-organized: ${new Date().toLocaleString()}\n`;
        fileContent += `// File: recipes/organized_recipes.js\n`;
      } else {
        fileContent += `// ${mod.charAt(0).toUpperCase() + mod.slice(1)} - ${(type || "unknown").charAt(0).toUpperCase() + (type || "unknown").slice(1)} Recipes\n`;
        fileContent += `// Auto-organized: ${new Date().toLocaleString()}\n`;
        fileContent += `// File: recipes/${mod}/${type || "unknown"}.js\n`;
      }

      if (kubejsVersion === "1.20.1") {
        fileContent += `// KubeJS 1.20.1 compatibility fixes applied\n`;
      }
      fileContent += `\n`;
    }

    // Start event block
    fileContent += `ServerEvents.recipes(event => {\n`;

    for (const recipe of recipes) {
      let recipeCode = recipe.code;

      // Apply FarmersDelight fixes if needed
      if (mod === "farmersdelight" || recipeCode.includes("farmersdelight")) {
        recipeCode = fixFarmersDelightSyntax(recipeCode);
      }

      // Add proper indentation
      const indentedCode = recipeCode
        .split("\n")
        .map((line) => "  " + line)
        .join("\n");
      fileContent += `${indentedCode}\n\n`;
    }

    fileContent += `});\n`;

    return fileContent;
  }

  async validateKubeJSScripts(instancePath: string): Promise<{ valid: boolean; issues: string[] }> {
    const info = await this.detectKubeJS();
    if (!info.scriptsPath) {
      return { valid: false, issues: ["KubeJS not installed"] };
    }

    const issues: string[] = [];

    // Check for common KubeJS issues
    if (info.version) {
      if (info.version.startsWith("1.19")) {
        issues.push("Consider upgrading to KubeJS 1.20+ for better compatibility");
      }

      if (info.version.startsWith("1.20")) {
        // Check for FarmersDelight compatibility
        const scripts = await this.listScripts();
        for (const script of scripts) {
          if (script.type === "server") {
            const content = await this.readScriptFile(script.path);
            if (
              content.includes("farmersdelight.cutting(") ||
              content.includes("farmersdelight.cooking(")
            ) {
              issues.push("FarmersDelight recipes may need updates for KubeJS 1.20+");
            }
          }
        }
      }
    }

    return { valid: issues.length === 0, issues };
  }

  async organizeScripts(
    instancePath: string,
    options: {
      strategy?: "hybrid" | "flat" | "mod-only" | "type-only";
      kubejsVersion?: "1.19.2" | "1.20.1" | "auto";
      preserveComments?: boolean;
    } = {}
  ): Promise<{ organizedCount: number; backupPath: string }> {
    const info = await this.detectKubeJS();
    if (!info.scriptsPath) {
      throw new Error("KubeJS not detected");
    }

    const serverScriptsPath = path.join(info.scriptsPath, "server_scripts");

    // Create backup
    const timestamp = Date.now();
    const backupPath = path.join(info.scriptsPath, `server_scripts_backup_${timestamp}`);
    await fs.mkdir(backupPath, { recursive: true });

    // Read all files
    const entries = await fs.readdir(serverScriptsPath, { withFileTypes: true });
    const files = entries.filter((e) => e.isFile() && e.name.endsWith(".js"));

    if (files.length === 0) {
      throw new Error("No JavaScript files found to organize");
    }

    // Copy all files to backup
    for (const file of files) {
      await fs.copyFile(path.join(serverScriptsPath, file.name), path.join(backupPath, file.name));
    }

    // Data structures for organization
    interface ParsedContent {
      recipes: ParsedRecipe[];
      tags: { type: string; code: string }[];
      events: { type: string; code: string }[];
      other: string[];
    }

    const parsed: ParsedContent = {
      recipes: [],
      tags: [],
      events: [],
      other: [],
    };

    // Parse all files
    for (const file of files) {
      const filePath = path.join(serverScriptsPath, file.name);
      const content = await fs.readFile(filePath, "utf-8");
      const lines = content.split("\n");

      let currentBlock = "";
      let blockType: "recipe" | "tag" | "event" | "other" = "other";

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        // Detect block start
        if (line.includes("ServerEvents.recipes")) {
          blockType = "recipe";
          currentBlock = line;
          continue;
        } else if (line.includes("ServerEvents.tags")) {
          blockType = "tag";
          currentBlock = line;
          continue;
        } else if (line.includes("ServerEvents.")) {
          blockType = "event";
          currentBlock = line;
          continue;
        }

        currentBlock += "\n" + lines[i];

        // Check if we need to parse recipe content
        if (blockType === "recipe") {
          // Look for recipe calls within the event
          const recipePatterns = [
            // Standard recipes: event.shaped(), event.shapeless(), etc.
            /event\.(shaped|shapeless|smelting|blasting|smoking|campfireCooking|stonecutting|smithing)\s*\(/,
            // Modded recipes: event.recipes.create.mixing(), event.recipes.thermal.pulverizer(), etc.
            /event\.recipes\.(\w+)\.(\w+)\s*\(/,
            // Recipe removals
            /event\.remove\s*\(/,
          ];

          for (const pattern of recipePatterns) {
            const match = line.match(pattern);
            if (match) {
              // Extract the full recipe statement (might be multi-line)
              let recipeCode = line;
              let depth = 0;
              let j = i;

              // Count brackets to find the complete statement
              for (let char of line) {
                if (char === "(" || char === "{" || char === "[") depth++;
                if (char === ")" || char === "}" || char === "]") depth--;
              }

              // If not closed, continue to next lines
              while (depth > 0 && j < lines.length - 1) {
                j++;
                recipeCode += "\n" + lines[j];
                for (let char of lines[j]) {
                  if (char === "(" || char === "{" || char === "[") depth++;
                  if (char === ")" || char === "}" || char === "]") depth--;
                }
              }

              // Determine mod and type
              let mod = "minecraft";
              let type = "shaped";

              if (line.includes("event.recipes.")) {
                const modMatch = line.match(/event\.recipes\.(\w+)\.(\w+)/);
                if (modMatch) {
                  mod = modMatch[1];
                  type = modMatch[2];
                }
              } else if (line.includes("event.remove")) {
                type = "removals";
              } else {
                const typeMatch = line.match(/event\.(\w+)\(/);
                if (typeMatch) {
                  type = typeMatch[1];
                }
              }

              parsed.recipes.push({
                code: recipeCode.trim(),
                mod: mod,
                type: type,
                fullLine: recipeCode.trim(),
              });

              i = j; // Skip processed lines
              break;
            }
          }
        } else if (blockType === "tag") {
          if (line.includes("event.add") || line.includes("event.remove")) {
            // Detect tag type (items, blocks, fluids)
            const tagTypeMatch = currentBlock.match(/ServerEvents\.tags\(['"](\w+)['"]/);
            const tagType = tagTypeMatch ? tagTypeMatch[1] : "items";

            parsed.tags.push({
              type: tagType,
              code: currentBlock,
            });
          }
        } else if (blockType === "event") {
          // Other events
          const eventTypeMatch = currentBlock.match(/ServerEvents\.(\w+)/);
          const eventType = eventTypeMatch ? eventTypeMatch[1] : "custom";

          parsed.events.push({
            type: eventType,
            code: currentBlock,
          });
        }
      }
    }

    // Remove duplicates
    const seenRecipes = new Set<string>();
    parsed.recipes = parsed.recipes.filter((r) => {
      const key = r.code;
      if (seenRecipes.has(key)) return false;
      seenRecipes.add(key);
      return true;
    });

    // Delete old files
    for (const file of files) {
      await fs.unlink(path.join(serverScriptsPath, file.name));
    }

    // Create folder structure
    const recipesPath = path.join(serverScriptsPath, "recipes");
    const tagsPath = path.join(serverScriptsPath, "tags");
    const eventsPath = path.join(serverScriptsPath, "events");

    await fs.mkdir(recipesPath, { recursive: true });
    await fs.mkdir(tagsPath, { recursive: true });
    await fs.mkdir(eventsPath, { recursive: true });

    // Organize recipes by mod and type
    const recipesByMod: Record<string, Record<string, ParsedRecipe[]>> = {};

    for (const recipe of parsed.recipes) {
      if (!recipesByMod[recipe.mod]) {
        recipesByMod[recipe.mod] = {};
      }
      if (!recipesByMod[recipe.mod][recipe.type]) {
        recipesByMod[recipe.mod][recipe.type] = [];
      }
      recipesByMod[recipe.mod][recipe.type].push(recipe);
    }

    // Write organized recipe files based on strategy
    let organizedCount = 0;
    const { strategy = "hybrid", kubejsVersion = "auto", preserveComments = true } = options;

    if (strategy === "hybrid" || strategy === "mod-only") {
      // Organize by mod (and optionally type)
      for (const [mod, types] of Object.entries(recipesByMod)) {
        if (strategy === "mod-only") {
          // All types in one file per mod
          const fileName = `${mod}.js`;
          const filePath = path.join(recipesPath, fileName);
          await fs.mkdir(recipesPath, { recursive: true });

          const allRecipes = Object.values(types).flat();
          allRecipes.sort((a, b) => a.code.localeCompare(b.code));

          const fileContent = this.generateRecipeFile(
            mod,
            allRecipes,
            kubejsVersion,
            preserveComments,
            strategy
          );
          await fs.writeFile(filePath, fileContent);
          organizedCount++;
        } else {
          // Hybrid: mod/type structure
          const modPath = path.join(recipesPath, mod);
          await fs.mkdir(modPath, { recursive: true });

          for (const [type, recipes] of Object.entries(types)) {
            const fileName = `${type}.js`;
            const filePath = path.join(modPath, fileName);

            recipes.sort((a, b) => a.code.localeCompare(b.code));

            const fileContent = this.generateRecipeFile(
              mod,
              recipes,
              kubejsVersion,
              preserveComments,
              strategy,
              type
            );
            await fs.writeFile(filePath, fileContent);
            organizedCount++;
          }
        }
      }
    } else if (strategy === "type-only") {
      // Organize by type only
      const typesByType: Record<string, ParsedRecipe[]> = {};
      for (const recipesByType of Object.values(recipesByMod)) {
        for (const [type, recipes] of Object.entries(recipesByType)) {
          if (!typesByType[type]) {
            typesByType[type] = [];
          }
          typesByType[type].push(...recipes);
        }
      }

      for (const [type, recipes] of Object.entries(typesByType)) {
        const fileName = `${type}.js`;
        const filePath = path.join(recipesPath, fileName);

        recipes.sort((a, b) => a.code.localeCompare(b.code));

        const fileContent = this.generateRecipeFile(
          "",
          recipes,
          kubejsVersion,
          preserveComments,
          strategy,
          type
        );
        await fs.writeFile(filePath, fileContent);
        organizedCount++;
      }
    } else if (strategy === "flat") {
      // All recipes in one file
      const allRecipes = Object.values(recipesByMod)
        .flatMap((types) => Object.values(types))
        .flat();
      allRecipes.sort((a, b) => a.code.localeCompare(b.code));

      const fileName = "organized_recipes.js";
      const filePath = path.join(recipesPath, fileName);

      const fileContent = this.generateRecipeFile(
        "",
        allRecipes,
        kubejsVersion,
        preserveComments,
        strategy
      );
      await fs.writeFile(filePath, fileContent);
      organizedCount++;
    }

    // Organize tags by type
    const tagsByType: Record<string, any[]> = {};
    for (const tag of parsed.tags) {
      if (!tagsByType[tag.type]) {
        tagsByType[tag.type] = [];
      }
      tagsByType[tag.type].push(tag);
    }

    for (const [type, tags] of Object.entries(tagsByType)) {
      const fileName = `${type}.js`;
      const filePath = path.join(tagsPath, fileName);

      let fileContent = `// ${type.charAt(0).toUpperCase() + type.slice(1)} Tags\n`;
      fileContent += `// Auto-organized: ${new Date().toLocaleString()}\n\n`;

      for (const tag of tags) {
        fileContent += tag.code + "\n\n";
      }

      await fs.writeFile(filePath, fileContent);
      organizedCount++;
    }

    // Organize other events
    const eventsByType: Record<string, any[]> = {};
    for (const event of parsed.events) {
      if (!eventsByType[event.type]) {
        eventsByType[event.type] = [];
      }
      eventsByType[event.type].push(event);
    }

    for (const [type, events] of Object.entries(eventsByType)) {
      const fileName = `${type}.js`;
      const filePath = path.join(eventsPath, fileName);

      let fileContent = `// ${type.charAt(0).toUpperCase() + type.slice(1)} Events\n`;
      fileContent += `// Auto-organized: ${new Date().toLocaleString()}\n\n`;

      for (const event of events) {
        fileContent += event.code + "\n\n";
      }

      await fs.writeFile(filePath, fileContent);
      organizedCount++;
    }

    console.log(`Scripts organized into ${organizedCount} files. Backup: ${backupPath}`);

    return {
      organizedCount,
      backupPath,
    };
  }

  async detectVersionSpecificIssues(instancePath: string): Promise<{
    farmersDelightIssues: boolean;
    forgeVersionIssues: boolean;
    recommendations: string[];
  }> {
    const info = await this.detectKubeJS();
    const scripts = await this.listScripts();
    const issues = {
      farmersDelightIssues: false,
      forgeVersionIssues: false,
      recommendations: [] as string[],
    };

    // Check for FarmersDelight compatibility issues
    for (const script of scripts) {
      if (script.type === "server") {
        const content = await this.readScriptFile(script.path);

        // Check for old FarmersDelight patterns
        if (
          content.includes("farmersdelight.cutting(") ||
          content.includes("farmersdelight.cooking(")
        ) {
          if (info.version && this.isModernKubeJS(info.version)) {
            issues.farmersDelightIssues = true;
            issues.recommendations.push(
              "Update FarmersDelight recipes for KubeJS 1.20.1 compatibility"
            );
          }
        }
      }
    }

    // Check for Forge version issues
    if (info.version && !info.version.startsWith("1.20")) {
      issues.forgeVersionIssues = true;
      issues.recommendations.push(
        "Consider upgrading to KubeJS 1.20.1+ for better mod compatibility"
      );
    }

    return issues;
  }

  async getCommonErrors(instancePath: string): Promise<{
    syntaxErrors: KubeJSError[];
    runtimeErrors: KubeJSError[];
    missingAPIs: string[];
  }> {
    const info = await this.detectKubeJS();
    const scripts = await this.listScripts();
    const result: {
      syntaxErrors: KubeJSError[];
      runtimeErrors: KubeJSError[];
      missingAPIs: string[];
    } = {
      syntaxErrors: [],
      runtimeErrors: [],
      missingAPIs: [],
    };

    for (const script of scripts) {
      if (script.type === "server") {
        const content = await this.readScriptFile(script.path);
        const validation = await this.validateScript(instancePath, script.path, content);
        result.syntaxErrors.push(...validation.errors);

        // Check for common runtime error patterns
        if (
          content.includes("NullPointerException") ||
          content.includes("ClassNotFoundException") ||
          content.includes("NoSuchMethodError")
        ) {
          result.runtimeErrors.push({
            type: "runtime",
            message: "Potential runtime error detected in script",
            file: script.path,
            severity: "warning",
          });
        }
      }
    }

    return result;
  }

  private isModernKubeJS(version: string): boolean {
    // Consider 1.20+ as modern KubeJS
    return version.startsWith("1.20") || version.startsWith("1.21") || version.startsWith("1.22");
  }

  private async validateScript(
    instancePath: string,
    filePath: string,
    content: string
  ): Promise<{ errors: KubeJSError[] }> {
    const errors: KubeJSError[] = [];

    try {
      // Basic syntax validation
      const lines = content.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        const lineNumber = i + 1;

        // Check for common syntax issues
        if (line.includes("ServerEvents.recipes") && !line.includes("=>")) {
          errors.push({
            type: "syntax",
            message: "Missing arrow function in ServerEvents.recipes",
            line: lineNumber,
            file: filePath,
            severity: "error",
            suggestion: "Use: ServerEvents.recipes(event => { ... })",
          });
        }

        // Check for unmatched brackets
        const openBrackets = (line.match(/\{/g) || []).length;
        const closeBrackets = (line.match(/\}/g) || []).length;
        const openParens = (line.match(/\(/g) || []).length;
        const closeParens = (line.match(/\)/g) || []).length;

        if (openBrackets > closeBrackets) {
          errors.push({
            type: "syntax",
            message: "Unclosed bracket detected",
            line: lineNumber,
            file: filePath,
            severity: "warning",
          });
        }

        if (openParens > closeParens) {
          errors.push({
            type: "syntax",
            message: "Unclosed parenthesis detected",
            line: lineNumber,
            file: filePath,
            severity: "warning",
          });
        }

        // Check for deprecated API usage
        if (line.includes("farmersdelight.cutting(") || line.includes("farmersdelight.cooking(")) {
          errors.push({
            type: "compatibility",
            message: "Deprecated FarmersDelight API usage",
            line: lineNumber,
            file: filePath,
            severity: "warning",
            suggestion:
              "Use farmersdelight.cuttingBoard() and farmersdelight.cookingPot() for KubeJS 1.20+",
          });
        }
      }
    } catch (error) {
      errors.push({
        type: "runtime",
        message: `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`,
        file: filePath,
        severity: "error",
      });
    }

    return { errors };
  }
}
