import { ConfigFile, ConfigSetting, UserComment } from "../types/config.types";
import { TomlParser } from "./parsers/TomlParser";
import JSON5 from 'json5';

export class ConfigService {
  private tomlParser = new TomlParser();
  /**
   * Load config files for a specific mod
   */
  async loadModConfigs(
    instancePath: string,
    modId: string,
    defaultConfigsFolder?: string,
    serverConfigFolder?: string,
  ): Promise<ConfigFile[]> {
    try {
      const configs: ConfigFile[] = [];
      
      // Track which config files we've already loaded to avoid duplicates
      const loadedConfigNames = new Set<string>();
      
      // Load from main config folder (recursively)
      const mainResult = await window.api.readdirRecursive(`${instancePath}/config`, {
        extensions: ['.toml', '.json', '.json5', '.yml', '.yaml', '.cfg', '.properties', '.txt']
      });
      
      if (mainResult.success && mainResult.files) {
        for (const file of mainResult.files) {
          const fileName = file.relativePath.split('/').pop() || file.relativePath;
          
          // Pass full relative path for better mod matching (supports subfolders)
          if (this.matchesModId(file.relativePath, modId)) {
            const fileResult = await window.api.readFile(file.path);

            if (fileResult.success && fileResult.content) {
              const config = await this.parseConfig(
                file.relativePath, // Use relative path to show folder structure
                fileResult.content,
                file.path,
                "client",
              );
              if (config) {
                configs.push(config);
                loadedConfigNames.add(fileName.toLowerCase());
              }
            }
          }
        }
      }

      // Load from defaultconfigs folder FIRST (highest priority) - recursively
      if (defaultConfigsFolder) {
        const defaultResult = await window.api.readdirRecursive(defaultConfigsFolder, {
          extensions: ['.toml', '.json', '.json5', '.yml', '.yaml', '.cfg', '.properties']
        });
        
        if (defaultResult.success && defaultResult.files) {
          for (const file of defaultResult.files) {
            const fileName = file.relativePath.split('/').pop() || file.relativePath;
            
            // Skip if already loaded from main config folder
            if (loadedConfigNames.has(fileName.toLowerCase())) {
              continue;
            }
            
            // Pass full relative path for better mod matching (supports subfolders)
            if (this.matchesModId(file.relativePath, modId)) {
              const fileResult = await window.api.readFile(file.path);

              if (fileResult.success && fileResult.content) {
                const config = await this.parseConfig(
                  file.relativePath,
                  fileResult.content,
                  file.path,
                  "server-default",
                );
                if (config) {
                  configs.push(config);
                  loadedConfigNames.add(fileName.toLowerCase());
                }
              }
            }
          }
        }
      }

      // Load from serverconfig folder (world-specific server configs) - recursively
      // Only load if NOT already loaded from defaultconfigs or main config
      if (serverConfigFolder) {
        const serverResult = await window.api.readdirRecursive(serverConfigFolder, {
          extensions: ['.toml', '.json', '.json5', '.yml', '.yaml', '.cfg', '.properties']
        });
        
        if (serverResult.success && serverResult.files) {
          for (const file of serverResult.files) {
            const fileName = file.relativePath.split('/').pop() || file.relativePath;
            
            // Skip if already loaded
            if (loadedConfigNames.has(fileName.toLowerCase())) {
              continue;
            }

            // Pass full relative path for better mod matching (supports subfolders)
            const matches = this.matchesModId(file.relativePath, modId);
            
            if (matches) {
              const fileResult = await window.api.readFile(file.path);

              if (fileResult.success && fileResult.content) {
                const config = await this.parseConfig(
                  file.relativePath,
                  fileResult.content,
                  file.path,
                  "server",
                );
                if (config) {
                  configs.push(config);
                  loadedConfigNames.add(fileName.toLowerCase());
                }
              }
            }
          }
        }
      }

      return configs;
    } catch (error) {
      return [];
    }
  }

  /**
   * Match config file to mod ID with smart matching
   * @param filePathOrName - Can be just filename or full relative path like "kubejs/myconfig.json"
   * @param modId - The mod ID to match against
   */
  // Map for mods that share a parent config folder
  // Key: parent folder name, Value: mapping of subfolder -> modId
  private sharedFolderMappings: Record<string, Record<string, string>> = {
    'xaero': {
      'minimap': 'xaerominimap',
      'world-map': 'xaeroworldmap',
      'lib': 'xaerominimap' // Shared library, assign to minimap
    }
  };

  private matchesModId(filePathOrName: string, modId: string): boolean {
    const modIdLower = modId.toLowerCase();
    
    // Extract both filename and folder path
    const parts = filePathOrName.split('/');
    const fileName = parts[parts.length - 1];
    
    // Remove file extension for matching
    const fileNameLower = fileName
      .toLowerCase()
      .replace(/\.(toml|json|json5|properties|cfg|yaml|yml|txt)$/, "");

    // Normalize by replacing underscores and hyphens
    const normalizedFileName = fileNameLower.replace(/[-_]/g, "");
    const normalizedModId = modIdLower.replace(/[-_]/g, "");
    
    // Check for shared folder mappings (e.g., xaero/minimap -> xaerominimap)
    // This needs to be checked before general folder matching
    for (let i = 0; i < parts.length - 1; i++) {
      const parentFolder = parts[i].toLowerCase();
      if (this.sharedFolderMappings[parentFolder]) {
        // We found a parent folder with shared mappings
        // Check if the next part matches a mapped subfolder
        if (i + 1 < parts.length) {
          const subfolder = parts[i + 1].toLowerCase();
          const mappedModId = this.sharedFolderMappings[parentFolder][subfolder];
          if (mappedModId && mappedModId.toLowerCase() === modIdLower) {
            return true;
          }
        }
      }
    }
    
    // Check all folder parts in the path (for nested structures like "betterdeserttemples/forge-1_20/config.toml")
    const folderParts = parts.slice(0, -1); // All parts except the filename
    
    // 1. Check if any folder in the path matches the mod ID
    for (const folder of folderParts) {
      const normalizedFolder = folder.toLowerCase().replace(/[-_]/g, "");
      
      // Exact folder match
      if (normalizedFolder === normalizedModId) {
        return true;
      }
      
      // Folder might contain version info like "forge-1_20", "fabric-1.19", etc.
      // Strip version patterns: forge-X_XX, fabric-X.XX, etc.
      const folderWithoutVersion = normalizedFolder.replace(/(?:forge|fabric|neoforge|quilt)?[-_]?\d+[-_.]\d+(?:[-_.]\d+)?/g, '');
      if (folderWithoutVersion && folderWithoutVersion === normalizedModId) {
        return true;
      }
    }

    // 2. Exact filename match (e.g., "create.toml" matches "create")
    if (normalizedFileName === normalizedModId) {
      return true;
    }

    // 3. Check if starts with mod ID followed by a variant suffix
    // e.g., "create-common.toml" or "create_common.toml" matches "create"
    const validSuffixes = ["client", "common", "server", "forge", "fabric", "default"];

    for (const suffix of validSuffixes) {
      const normalizedSuffix = suffix.replace(/[-_]/g, "");
      // Check if filename is modId + suffix
      if (normalizedFileName === normalizedModId + normalizedSuffix) {
        return true;
      }
    }

    return false;
  }

  /**
   * Parse config file content
   */
  private async parseConfig(
    fileName: string,
    content: string,
    filePath: string,
    configType: "client" | "server" | "server-default" = "client",
  ): Promise<ConfigFile | null> {
    const format = this.detectFormat(fileName);

    try {
      const settings = await this.parseSettings(content, format);

      return {
        name: fileName,
        path: filePath,
        format,
        content, // ConfigContent type
        rawContent: content, // Store raw string content
        settings,
        configType,
      };
    } catch (error) {
      console.error(`[ConfigService] Error parsing ${fileName}:`, error);
      return null;
    }
  }

  /**
   * Detect config file format
   */
  private detectFormat(fileName: string): ConfigFile["format"] {
    const lower = fileName.toLowerCase();
    if (lower.endsWith(".toml")) return "toml";
    if (lower.endsWith(".json5")) return "json5";
    if (lower.endsWith(".json")) return "json";
    if (lower.endsWith(".yml") || lower.endsWith(".yaml")) return "yaml";
    if (lower.endsWith(".cfg")) return "cfg";
    if (lower.endsWith(".properties")) return "properties";
    if (lower.endsWith(".txt")) return "properties"; // Treat .txt files as properties format
    return "toml";
  }

  /**
   * Parse settings from config content
   */
  private async parseSettings(
    content: string,
    format: ConfigFile["format"],
  ): Promise<ConfigSetting[]> {
    const settings: ConfigSetting[] = [];

    if (format === "toml") {
      return this.parseToml(content);
    } else if (format === "json5") {
      return this.parseJson5(content);
    } else if (format === "json") {
      return this.parseJson(content);
    } else if (format === "properties") {
      return this.parseProperties(content);
    } else if (format === "cfg") {
      return this.parseCfg(content);
    } else if (format === "yaml") {
      return this.parseYaml(content);
    }

    return settings;
  }

  /**
   * Parse TOML config with full metadata extraction
   */
  private parseToml(content: string): ConfigSetting[] {
    const settings: ConfigSetting[] = [];

    try {
      // Use enhanced parser to get metadata
      const { data, metadata } = this.tomlParser.parseWithMetadata(content);

      // Flatten the TOML object into settings
      this.extractSettingsFromToml(data, settings, "", metadata);
    } catch (error) {
      // Fallback to simple parsing
      return this.parseTomlFallback(content);
    }

    return settings;
  }

  /**
   * Recursively extract settings from TOML data
   */
  private extractSettingsFromToml(
    obj: any,
    settings: ConfigSetting[],
    path: string,
    metadata: Map<string, any>,
  ) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = path ? `${path}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Nested object - recurse
        this.extractSettingsFromToml(value, settings, fullKey, metadata);
      } else {
        // Leaf value - create setting with metadata
        const meta = metadata.get(fullKey) || metadata.get(key) || {};

        const setting: ConfigSetting = {
          key: fullKey,
          value,
          defaultValue:
            meta.defaultValue !== undefined ? meta.defaultValue : value,
          type:
            meta.allowedValues && meta.allowedValues.length > 0
              ? "enum"
              : this.inferType(value, meta),
          description: meta.description,
          section: path || undefined,
          range: meta.range,
          min: meta.range ? meta.range[0] : undefined,
          max: meta.range ? meta.range[1] : undefined,
          options: meta.allowedValues,
          enumValues: meta.allowedValues,
          unit: meta.unit,
        };
        
        settings.push(setting);
      }
    }
  }

  /**
   * Fallback TOML parser (simple line-by-line)
   */
  private parseTomlFallback(content: string): ConfigSetting[] {
    const settings: ConfigSetting[] = [];
    const lines = content.split("\n");
    let currentSection = "";
    let currentComments: string[] = [];
    let userComments: UserComment[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Section header
      if (line.startsWith("[") && line.endsWith("]")) {
        currentSection = line.slice(1, -1);
        currentComments = [];
        userComments = [];
        continue;
      }

      // MCED user comment
      if (line.startsWith("#@MCED:")) {
        const commentContent = line.substring(7).trim(); // Remove "#@MCED:"
        const pipeIndex = commentContent.indexOf("|");
        
        if (pipeIndex !== -1) {
          const timestamp = commentContent.substring(0, pipeIndex).trim();
          const text = commentContent.substring(pipeIndex + 1).trim();
          
          userComments.push({
            id: `${timestamp}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp,
            text,
          });
        }
        continue;
      }

      // Regular comment
      if (line.startsWith("#")) {
        const comment = line.slice(1).trim();
        if (comment && comment !== ".") {
          currentComments.push(comment);
        }
        continue;
      }

      // Key-value pair
      if (line.includes("=")) {
        const [key, ...valueParts] = line.split("=");
        const value = valueParts.join("=").trim();

        const fullKey = currentSection
          ? `${currentSection}.${key.trim()}`
          : key.trim();
        const description = currentComments.join(" ");

        // Create metadata object for type detection
        const metadata = description ? { description } : undefined;

        const setting: ConfigSetting = {
          key: fullKey,
          value: this.parseValue(value),
          defaultValue: this.parseValue(value),
          type: this.inferType(this.parseValue(value), metadata),
          description: description || undefined,
          section: currentSection || undefined,
          userComments: userComments.length > 0 ? [...userComments] : undefined,
        };

        settings.push(setting);
        currentComments = [];
        userComments = [];
      } else if (line !== "") {
        // Reset comments on non-empty non-setting lines
        currentComments = [];
        userComments = [];
      }
    }

    return settings;
  }

  /**
   * Parse JSON config
   */
  private parseJson5(content: string): ConfigSetting[] {
    const settings: ConfigSetting[] = [];

    try {
      // First, extract comments from the JSON5 content
      const commentMap = this.extractJsonComments(content);
      
      const obj = JSON5.parse(content);
      this.extractSettings(obj, settings, "", commentMap);
    } catch (error) {
      console.error('[ConfigService] Failed to parse JSON5:', error);
      // Silently fail
    }

    return settings;
  }

  private parseJson(content: string): ConfigSetting[] {
    const settings: ConfigSetting[] = [];

    try {
      // Try to extract comments from plain JSON (though standard JSON doesn't support them)
      const commentMap = this.extractJsonComments(content);
      
      const obj = JSON.parse(content);
      this.extractSettings(obj, settings, "", commentMap);
    } catch (error) {
      // Silently fail
    }

    return settings;
  }

  /**
   * Extract comments from JSON/JSON5 content
   */
  private extractJsonComments(content: string): Map<string, string> {
    const commentMap = new Map<string, string>();
    const lines = content.split('\n');
    let lastComment = '';
    let currentPath: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Single-line comment
      if (line.startsWith('//')) {
        const comment = line.substring(2).trim();
        lastComment = lastComment ? `${lastComment} ${comment}` : comment;
        continue;
      }

      // Multi-line comment start
      if (line.includes('/*')) {
        let commentText = line.substring(line.indexOf('/*') + 2);
        
        // Check if comment ends on same line
        if (commentText.includes('*/')) {
          const endIndex = commentText.indexOf('*/');
          lastComment = commentText.substring(0, endIndex).trim();
          continue;
        }
        
        // Multi-line comment - collect until */
        let commentLines = [commentText];
        for (let j = i + 1; j < lines.length; j++) {
          i = j;
          const nextLine = lines[j];
          if (nextLine.includes('*/')) {
            commentLines.push(nextLine.substring(0, nextLine.indexOf('*/')).trim());
            break;
          }
          commentLines.push(nextLine.trim());
        }
        lastComment = commentLines.join(' ').replace(/\*/g, '').trim();
        continue;
      }

      // Property line - associate comment with this property
      if (line.includes(':') && !line.startsWith('{') && !line.startsWith('[')) {
        const colonIndex = line.indexOf(':');
        let propertyName = line.substring(0, colonIndex).trim();
        
        // Remove quotes from property name
        propertyName = propertyName.replace(/["']/g, '');
        
        if (lastComment && propertyName) {
          commentMap.set(propertyName, lastComment);
        }
        lastComment = '';
      }
    }

    return commentMap;
  }

  /**
   * Recursively extract settings from object
   */
  private extractSettings(obj: any, settings: ConfigSetting[], path: string, commentMap?: Map<string, string>) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = path ? `${path}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Nested object - recurse
        this.extractSettings(value, settings, fullKey, commentMap);
      } else {
        // Leaf value - create setting with comment if available
        const comment = commentMap?.get(key) || "";
        settings.push(this.createSetting(fullKey, value, comment, path));
      }
    }
  }

  /**
   * Parse value string to appropriate type
   */
  private parseValue(value: string): any {
    // Remove quotes
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      return value.slice(1, -1);
    }

    // Boolean
    if (value === "true") return true;
    if (value === "false") return false;

    // Number
    if (!isNaN(Number(value))) {
      return Number(value);
    }

    // Array
    if (value.startsWith("[") && value.endsWith("]")) {
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }

    return value;
  }

  /**
   * Create a config setting object
   */
  private createSetting(
    key: string,
    value: any,
    comment: string,
    section: string,
  ): ConfigSetting {
    // Create metadata from comment for better type detection
    const metadata = comment ? { description: comment } : undefined;
    
    return {
      key,
      value,
      defaultValue: value,
      type: this.inferType(value, metadata),
      description: comment || undefined,
      section: section || undefined,
    };
  }

  /**
   * Infer setting type from value and metadata
   */
  private inferType(value: any, metadata?: any): ConfigSetting["type"] {
    // Check for enum based on metadata
    if (metadata?.allowedValues && Array.isArray(metadata.allowedValues) && metadata.allowedValues.length > 0) {
      return "enum";
    }

    // Check value type
    if (typeof value === "boolean") return "boolean";
    
    if (typeof value === "number") {
      // Check for range if metadata exists
      if (metadata?.range && Array.isArray(metadata.range)) {
        return "range";
      }
      return Number.isInteger(value) ? "integer" : "float";
    }
    
    if (Array.isArray(value)) {
      // Check if it's a list of specific values
      if (value.length > 0) {
        // All booleans?
        if (value.every(v => typeof v === "boolean")) return "array";
        // All numbers?
        if (value.every(v => typeof v === "number")) return "array";
        // All strings?
        if (value.every(v => typeof v === "string")) return "array";
      }
      return "array";
    }

    // String could be enum if it matches common patterns
    if (typeof value === "string") {
      // Common enum patterns: UPPERCASE_WITH_UNDERSCORES
      if (/^[A-Z][A-Z0-9_]*$/.test(value)) {
        return "enum"; // Likely enum
      }
      // If metadata has description mentioning "Allowed Values" or similar
      if (metadata?.description && 
          (/allowed\s*values?/i.test(metadata.description) || 
           /valid\s*options?/i.test(metadata.description))) {
        return "enum";
      }
    }
    
    return "string";
  }

  /**
   * Save config file
   */
  async saveConfig(config: ConfigFile): Promise<boolean> {
    try {
      // Update content with new values
      const updatedContent = this.updateConfigContent(config);

      // Write file
      const result = await window.api.writeFile(config.path, updatedContent);

      return result.success;
    } catch (error) {
      return false;
    }
  }

  /**
   * Update config content while preserving comments and adding user comments
   */
  private updateConfigContent(config: ConfigFile): string {
    let content = config.rawContent || config.content;

    // For each setting, update its value and comments
    for (const setting of config.settings) {
      const key = setting.key.split(".").pop() || setting.key;
      const oldValue = this.formatValue(setting.defaultValue ?? setting.value);
      const newValue = this.formatValue(setting.value);

      // Update value if changed
      if (oldValue !== newValue) {
        const patterns = [
          new RegExp(
            `(${this.escapeRegex(key)}\\s*=\\s*)${this.escapeRegex(oldValue)}`,
            "g",
          ),
          new RegExp(
            `(${this.escapeRegex(setting.key)}\\s*=\\s*)${this.escapeRegex(oldValue)}`,
            "g",
          ),
        ];

        for (const regex of patterns) {
          if (regex.test(content)) {
            content = content.replace(regex, `$1${newValue}`);
            break;
          }
        }
      }

      // Add/update user comments (recalculate line index after value update)
      if (setting.userComments && setting.userComments.length > 0) {
        const lines = content.split("\n");
        let settingLineIndex = -1;

        // Find the line with this setting
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i].trim();
          if (
            line.startsWith(key + " =") ||
            line.startsWith(key + "=") ||
            line.startsWith(setting.key + " =") ||
            line.startsWith(setting.key + "=")
          ) {
            settingLineIndex = i;
            break;
          }
        }

        if (settingLineIndex !== -1) {
          // Remove old MCED comments for this setting
          let insertIndex = settingLineIndex;
          while (
            insertIndex > 0 &&
            lines[insertIndex - 1].trim().startsWith("#@MCED:")
          ) {
            lines.splice(insertIndex - 1, 1);
            insertIndex--;
            settingLineIndex--;
          }

          // Add new MCED comments
          const commentLines = setting.userComments.map(
            (comment) =>
              `#@MCED: ${comment.timestamp} | ${comment.text.replace(/\n/g, " ")}`,
          );

          lines.splice(insertIndex, 0, ...commentLines);
          content = lines.join("\n");
        }
      }
    }

    return content;
  }

  /**
   * Format value for config file
   */
  private formatValue(value: any): string {
    if (typeof value === "string") {
      return `"${value}"`;
    }
    if (Array.isArray(value)) {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Escape regex special characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  /**
   * Parse .properties file (Java properties format)
   */
  private parseProperties(content: string): ConfigSetting[] {
    const settings: ConfigSetting[] = [];
    const lines = content.split('\n');
    let currentComments: string[] = [];
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Section marker (e.g., ##[zoom] or ##[gui])
      if (line.startsWith('##[') && line.endsWith(']')) {
        currentSection = line.substring(3, line.length - 1);
        currentComments = [];
        continue;
      }

      // Comment line
      if (line.startsWith('#') || line.startsWith('!')) {
        const comment = line.substring(1).trim();
        // Don't add empty comments
        if (comment) {
          currentComments.push(comment);
        }
        continue;
      }

      // Property line
      if (line.includes('=') || line.includes(':')) {
        const separator = line.includes('=') ? '=' : ':';
        const parts = line.split(separator);
        
        if (parts.length >= 2) {
          let keyPart = parts[0].trim();
          let valuePart = parts.slice(1).join(separator).trim();
          
          // Handle type prefixes (e.g., B:, F:, I:, S:, D:)
          // B = Boolean, F = Float, I = Integer, S = String, D = Double
          let explicitType: ConfigSetting["type"] | null = null;
          const typeMatch = keyPart.match(/^([BIFSD]):(.*)/);
          if (typeMatch) {
            const typePrefix = typeMatch[1];
            keyPart = typeMatch[2];
            
            // Map type prefix to our type system
            switch (typePrefix) {
              case 'B':
                explicitType = 'boolean';
                break;
              case 'I':
                explicitType = 'integer';
                break;
              case 'F':
              case 'D':
                explicitType = 'float';
                break;
              case 'S':
                explicitType = 'string';
                break;
            }
          }
          
          // Remove quotes and semicolons from value
          valuePart = valuePart.replace(/[;'"]/g, '').trim();
          
          const comment = currentComments.join(' ');
          const parsedValue = this.parseValue(valuePart);
          
          // Create setting with explicit type if available
          const setting = this.createSetting(
            keyPart,
            parsedValue,
            comment,
            currentSection
          );
          
          // Override type if we detected it from prefix
          if (explicitType) {
            setting.type = explicitType;
          }
          
          settings.push(setting);
        }
        
        currentComments = [];
      } else if (line !== '') {
        // Reset comments on non-empty non-property lines
        currentComments = [];
      }
    }

    return settings;
  }

  /**
   * Parse .cfg file (Forge config format - similar to properties)
   */
  private parseCfg(content: string): ConfigSetting[] {
    const settings: ConfigSetting[] = [];
    const lines = content.split('\n');
    let currentSection = '';
    let currentComments: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Section header
      if (line.match(/^[A-Z_]+\s*{/)) {
        currentSection = line.replace(/\s*{.*/, '').trim();
        currentComments = [];
        continue;
      }

      // End of section
      if (line === '}') {
        currentSection = '';
        currentComments = [];
        continue;
      }

      // Comment line
      if (line.startsWith('#')) {
        const comment = line.substring(1).trim();
        currentComments.push(comment);
        continue;
      }

      // Property line
      if (line.includes('=')) {
        const parts = line.split('=');
        
        if (parts.length >= 2) {
          const keyPart = parts[0].trim();
          const valuePart = parts.slice(1).join('=').trim();
          
          // Extract type and key (format: "I:settingName=value" or just "settingName=value")
          let key = keyPart;
          let value = valuePart;
          
          const typeMatch = keyPart.match(/^([IBSFD]):(.*)/);
          if (typeMatch) {
            key = typeMatch[2];
          }
          
          const comment = currentComments.join(' ');
          settings.push(this.createSetting(
            currentSection ? `${currentSection}.${key}` : key,
            this.parseValue(value),
            comment,
            currentSection
          ));
        }
        
        currentComments = [];
      } else if (line !== '') {
        // Reset comments on non-empty non-property lines
        currentComments = [];
      }
    }

    return settings;
  }

  /**
   * Parse YAML file (basic implementation)
   */
  private parseYaml(content: string): ConfigSetting[] {
    const settings: ConfigSetting[] = [];
    const lines = content.split('\n');
    let currentComments: string[] = [];
    let currentPath: string[] = [];
    let indentStack: number[] = [0];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Comment line
      if (trimmed.startsWith('#')) {
        const comment = trimmed.substring(1).trim();
        currentComments.push(comment);
        continue;
      }

      if (trimmed === '') {
        continue;
      }

      // Calculate indentation
      const indent = line.search(/\S/);
      if (indent === -1) continue;

      // Adjust path based on indentation
      while (indentStack.length > 0 && indent <= indentStack[indentStack.length - 1] && currentPath.length > 0) {
        indentStack.pop();
        currentPath.pop();
      }

      // Key-value pair
      if (trimmed.includes(':')) {
        const colonIndex = trimmed.indexOf(':');
        const key = trimmed.substring(0, colonIndex).trim();
        const valueStr = trimmed.substring(colonIndex + 1).trim();

        if (valueStr === '' || valueStr === '|' || valueStr === '>') {
          // This is a section/object
          currentPath.push(key);
          indentStack.push(indent);
        } else {
          // This is a value
          const fullKey = currentPath.length > 0 
            ? `${currentPath.join('.')}.${key}` 
            : key;
          
          const comment = currentComments.join(' ');
          settings.push(this.createSetting(
            fullKey,
            this.parseValue(valueStr),
            comment,
            currentPath.join('.')
          ));
        }

        currentComments = [];
      }
    }

    return settings;
  }

  /**
   * Match configs to mod
   */
  matchConfigsToMod(configs: ConfigFile[], modId: string): ConfigFile[] {
    return configs.filter((config) => {
      const fileName = config.name.toLowerCase();
      const modIdLower = modId.toLowerCase();

      // Direct match
      if (fileName.includes(modIdLower)) return true;

      // Match without version/numbers
      const cleanModId = modIdLower.replace(/[-_]\d+/g, "");
      if (fileName.includes(cleanModId)) return true;

      return false;
    });
  }

  /**
   * Migrate server configs to default configs
   * Copies all server config files from serverconfig folder to defaultconfigs folder
   */
  async migrateServerToDefaultConfigs(
    serverConfigFolder: string,
    defaultConfigsFolder: string,
  ): Promise<{ success: boolean; message: string; movedCount: number }> {
    try {
      // Ensure defaultconfigs folder exists
      const defaultFolderResult = await window.api.readdir(defaultConfigsFolder);
      if (!defaultFolderResult.success) {
        return {
          success: false,
          message: "Default configs folder does not exist",
          movedCount: 0,
        };
      }

      // Get all files from serverconfig folder
      const serverResult = await window.api.readdir(serverConfigFolder);
      if (!serverResult.success || !serverResult.files) {
        return {
          success: false,
          message: "Could not read server config folder",
          movedCount: 0,
        };
      }

      // Filter for config files
      const configFiles = serverResult.files.filter((file: string) =>
        file.endsWith(".toml") ||
        file.endsWith(".json") ||
        file.endsWith(".json5")
      );

      let movedCount = 0;
      const errors: string[] = [];

      for (const fileName of configFiles) {
        try {
          // Read from serverconfig
          const sourceFile = `${serverConfigFolder}/${fileName}`;
          const readResult = await window.api.readFile(sourceFile);

          if (!readResult.success || !readResult.content) {
            errors.push(`Failed to read ${fileName}`);
            continue;
          }

          // Write to defaultconfigs (will overwrite if exists)
          const destFile = `${defaultConfigsFolder}/${fileName}`;
          const writeResult = await window.api.writeFile(destFile, readResult.content);

          if (!writeResult.success) {
            errors.push(`Failed to write ${fileName} to defaultconfigs`);
            continue;
          }

          // Delete from serverconfig after successful copy
          const deleteResult = await window.api.deleteFile(sourceFile);
          if (deleteResult.success) {
            movedCount++;
          } else {
            errors.push(`Copied ${fileName} but failed to delete from serverconfig`);
          }
        } catch (error) {
          errors.push(`Error processing ${fileName}: ${error}`);
        }
      }

      if (errors.length > 0) {
        return {
          success: false,
          message: `Moved ${movedCount} files with errors: ${errors.join(", ")}`,
          movedCount,
        };
      }

      return {
        success: true,
        message: `Successfully moved ${movedCount} config files to defaultconfigs`,
        movedCount,
      };
    } catch (error) {
      return {
        success: false,
        message: `Migration failed: ${error}`,
        movedCount: 0,
      };
    }
  }
}

export const configService = new ConfigService();
