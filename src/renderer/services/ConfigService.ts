import { ConfigFile, ConfigSetting } from '../types/config.types';
import { TomlParser } from './parsers/TomlParser';

export class ConfigService {
  private tomlParser = new TomlParser();
  /**
   * Load config files for a specific mod
   */
  async loadModConfigs(instancePath: string, modId: string): Promise<ConfigFile[]> {
    try {
      const result = await window.electronAPI.readdir(`${instancePath}/config`);
      if (!result.success || !result.files) {
        return [];
      }

      // Find config files that match the mod
      const configFiles = result.files.filter((file: string) => {
        if (!(file.endsWith('.toml') || file.endsWith('.json') || file.endsWith('.json5'))) {
          return false;
        }
        
        return this.matchesModId(file, modId);
      });

      const configs: ConfigFile[] = [];
      
      for (const fileName of configFiles) {
        const filePath = `${instancePath}/config/${fileName}`;
        const fileResult = await window.electronAPI.readFile(filePath);
        
        if (fileResult.success && fileResult.content) {
          const config = await this.parseConfig(fileName, fileResult.content, filePath);
          if (config) {
            configs.push(config);
          }
        }
      }

      return configs;
    } catch (error) {
      console.error('Error loading configs:', error);
      return [];
    }
  }

  /**
   * Match config file to mod ID with smart matching
   */
  private matchesModId(fileName: string, modId: string): boolean {
    const fileNameLower = fileName.toLowerCase().replace(/\.(toml|json|json5)$/, '');
    const modIdLower = modId.toLowerCase();
    
    // Exact match (e.g., "create-common.toml" matches "create")
    if (fileNameLower === modIdLower) {
      return true;
    }
    
    // Exact match with suffix (e.g., "create-common.toml" matches "create")
    if (fileNameLower.startsWith(modIdLower + '-') || fileNameLower.startsWith(modIdLower + '_')) {
      return true;
    }
    
    // Exact match with word boundaries (e.g., "create_jetpack-common.toml" matches "create_jetpack")
    // But NOT "create-common.toml" for "create_jetpack"
    const parts = fileNameLower.split(/[-_]/);
    const modIdParts = modIdLower.split(/[-_]/);
    
    // Check if all parts of modId appear consecutively in filename
    for (let i = 0; i <= parts.length - modIdParts.length; i++) {
      let match = true;
      for (let j = 0; j < modIdParts.length; j++) {
        if (parts[i + j] !== modIdParts[j]) {
          match = false;
          break;
        }
      }
      if (match) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Parse config file content
   */
  private async parseConfig(fileName: string, content: string, filePath: string): Promise<ConfigFile | null> {
    const format = this.detectFormat(fileName);
    
    try {
      const settings = await this.parseSettings(content, format);
      
      return {
        name: fileName,
        path: filePath,
        format,
        content,
        settings,
      };
    } catch (error) {
      console.error(`Error parsing ${fileName}:`, error);
      return null;
    }
  }

  /**
   * Detect config file format
   */
  private detectFormat(fileName: string): ConfigFile['format'] {
    const lower = fileName.toLowerCase();
    if (lower.endsWith('.toml')) return 'toml';
    if (lower.endsWith('.json5')) return 'json5';
    if (lower.endsWith('.json')) return 'json';
    if (lower.endsWith('.yml') || lower.endsWith('.yaml')) return 'yaml';
    if (lower.endsWith('.cfg')) return 'cfg';
    if (lower.endsWith('.properties')) return 'properties';
    return 'toml';
  }

  /**
   * Parse settings from config content
   */
  private async parseSettings(content: string, format: ConfigFile['format']): Promise<ConfigSetting[]> {
    const settings: ConfigSetting[] = [];

    if (format === 'toml') {
      return this.parseToml(content);
    } else if (format === 'json' || format === 'json5') {
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
      this.extractSettingsFromToml(data, settings, '', metadata);
    } catch (error) {
      console.error('Error parsing TOML:', error);
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
    metadata: Map<string, any>
  ) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = path ? `${path}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Nested object - recurse
        this.extractSettingsFromToml(value, settings, fullKey, metadata);
      } else {
        // Leaf value - create setting with metadata
        const meta = metadata.get(fullKey) || {};
        const setting: ConfigSetting = {
          key: fullKey,
          value,
          defaultValue: meta.defaultValue !== undefined ? meta.defaultValue : value,
          type: this.inferType(value),
          description: meta.description,
          section: path || undefined,
          range: meta.range,
          allowedValues: meta.allowedValues,
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
    const lines = content.split('\n');
    let currentSection = '';
    let currentComments: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Section header
      if (line.startsWith('[') && line.endsWith(']')) {
        currentSection = line.slice(1, -1);
        currentComments = [];
        continue;
      }

      // Comment
      if (line.startsWith('#')) {
        const comment = line.slice(1).trim();
        if (comment && comment !== '.') {
          currentComments.push(comment);
        }
        continue;
      }

      // Key-value pair
      if (line.includes('=')) {
        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();
        
        const fullKey = currentSection ? `${currentSection}.${key.trim()}` : key.trim();
        const description = currentComments.join(' ');
        
        const setting: ConfigSetting = {
          key: fullKey,
          value: this.parseValue(value),
          defaultValue: this.parseValue(value),
          type: this.inferType(this.parseValue(value)),
          description: description || undefined,
          section: currentSection || undefined,
        };
        
        settings.push(setting);
        currentComments = [];
      } else if (line !== '') {
        // Reset comments on non-empty non-setting lines
        currentComments = [];
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
      this.extractSettings(obj, settings, '');
    } catch (error) {
      console.error('Error parsing JSON:', error);
    }

    return settings;
  }

  /**
   * Recursively extract settings from object
   */
  private extractSettings(obj: any, settings: ConfigSetting[], path: string) {
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = path ? `${path}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        // Nested object - recurse
        this.extractSettings(value, settings, fullKey);
      } else {
        // Leaf value - create setting
        settings.push(this.createSetting(fullKey, value, '', ''));
      }
    }
  }

  /**
   * Parse value string to appropriate type
   */
  private parseValue(value: string): any {
    // Remove quotes
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1);
    }

    // Boolean
    if (value === 'true') return true;
    if (value === 'false') return false;

    // Number
    if (!isNaN(Number(value))) {
      return Number(value);
    }

    // Array
    if (value.startsWith('[') && value.endsWith(']')) {
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
    section: string
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
  private inferType(value: any): ConfigSetting['type'] {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'float';
    }
    if (Array.isArray(value)) return 'array';
    return 'string';
  }

  /**
   * Save config file
   */
  async saveConfig(config: ConfigFile): Promise<boolean> {
    try {
      // Update content with new values
      const updatedContent = this.updateConfigContent(config);
      
      // Write file
      const result = await window.electronAPI.writeFile(config.path, updatedContent);
      
      return result.success;
    } catch (error) {
      console.error('Error saving config:', error);
      return false;
    }
  }

  /**
   * Update config content while preserving comments
   */
  private updateConfigContent(config: ConfigFile): string {
    let content = config.content;

    // Simple replacement for now - preserves structure
    for (const setting of config.settings) {
      const oldValue = this.formatValue(setting.defaultValue ?? setting.value);
      const newValue = this.formatValue(setting.value);
      
      if (oldValue !== newValue) {
        // Replace the value in the content
        const regex = new RegExp(
          `(${this.escapeRegex(setting.key)}\\s*=\\s*)${this.escapeRegex(oldValue)}`,
          'g'
        );
        content = content.replace(regex, `$1${newValue}`);
      }
    }

    return content;
  }

  /**
   * Format value for config file
   */
  private formatValue(value: any): string {
    if (typeof value === 'string') {
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
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Match configs to mod
   */
  matchConfigsToMod(configs: ConfigFile[], modId: string): ConfigFile[] {
    return configs.filter(config => {
      const fileName = config.name.toLowerCase();
      const modIdLower = modId.toLowerCase();
      
      // Direct match
      if (fileName.includes(modIdLower)) return true;
      
      // Match without version/numbers
      const cleanModId = modIdLower.replace(/[-_]\d+/g, '');
      if (fileName.includes(cleanModId)) return true;
      
      return false;
    });
  }
}

export const configService = new ConfigService();
