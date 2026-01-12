import { ConfigFile, ConfigSetting, UserComment } from "../types/config.types";
import { TomlParser } from "./parsers/TomlParser";

export class ConfigService {
  private tomlParser = new TomlParser();
  /**
   * Load config files for a specific mod
   */
  async loadModConfigs(
    instancePath: string,
    modId: string,
  ): Promise<ConfigFile[]> {
    try {
      const result = await window.api.readdir(`${instancePath}/config`);
      if (!result.success || !result.files) {
        return [];
      }

      // Find config files that match the mod
      const configFiles = result.files.filter((file: string) => {
        if (
          !(
            file.endsWith(".toml") ||
            file.endsWith(".json") ||
            file.endsWith(".json5")
          )
        ) {
          return false;
        }

        return this.matchesModId(file, modId);
      });

      const configs: ConfigFile[] = [];

      for (const fileName of configFiles) {
        const filePath = `${instancePath}/config/${fileName}`;
        const fileResult = await window.api.readFile(filePath);

        if (fileResult.success && fileResult.content) {
          const config = await this.parseConfig(
            fileName,
            fileResult.content,
            filePath,
          );
          if (config) {
            configs.push(config);
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
   */
  private matchesModId(fileName: string, modId: string): boolean {
    const fileNameLower = fileName
      .toLowerCase()
      .replace(/\.(toml|json|json5)$/, "");
    const modIdLower = modId.toLowerCase();

    // Normalize both by replacing underscores and hyphens
    const normalizedFileName = fileNameLower.replace(/[-_]/g, "");
    const normalizedModId = modIdLower.replace(/[-_]/g, "");

    // Exact match (e.g., "create.toml" matches "create")
    if (normalizedFileName === normalizedModId) {
      return true;
    }

    // Check if starts with mod ID followed by a variant suffix
    // e.g., "create-common.toml" or "create_common.toml" matches "create"
    const validSuffixes = ["client", "common", "server", "forge", "fabric"];

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
      };
    } catch (error) {
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
    } else if (format === "json" || format === "json5") {
      return this.parseJson(content);
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
              : this.inferType(value),
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

        const setting: ConfigSetting = {
          key: fullKey,
          value: this.parseValue(value),
          defaultValue: this.parseValue(value),
          type: this.inferType(this.parseValue(value)),
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
  private parseJson(content: string): ConfigSetting[] {
    const settings: ConfigSetting[] = [];

    try {
      const obj = JSON.parse(content);
      this.extractSettings(obj, settings, "");
    } catch (error) {
      // Silently fail
    }

    return settings;
  }

  /**
   * Recursively extract settings from object
   */
  private extractSettings(obj: any, settings: ConfigSetting[], path: string) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = path ? `${path}.${key}` : key;

      if (
        typeof value === "object" &&
        value !== null &&
        !Array.isArray(value)
      ) {
        // Nested object - recurse
        this.extractSettings(value, settings, fullKey);
      } else {
        // Leaf value - create setting
        settings.push(this.createSetting(fullKey, value, "", ""));
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
    return {
      key,
      value,
      defaultValue: value,
      type: this.inferType(value),
      description: comment || undefined,
      section: section || undefined,
    };
  }

  /**
   * Infer setting type from value
   */
  private inferType(value: any): ConfigSetting["type"] {
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") {
      return Number.isInteger(value) ? "integer" : "float";
    }
    if (Array.isArray(value)) return "array";
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
}

export const configService = new ConfigService();
