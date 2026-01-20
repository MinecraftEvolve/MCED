export interface ConfigFile {
  path: string;
  filename: string;
  format: ConfigFormat;
  modId?: string;
  isOrphaned?: boolean;
  content: ConfigContent;
  rawContent: string;
  lastModified?: Date;
  hasChanges?: boolean;
}

export type ConfigFormat = "toml" | "json" | "json5" | "yaml" | "cfg" | "properties" | "txt";

export interface ConfigContent {
  [key: string]: ConfigValue | ConfigSection;
}

export interface ConfigSection {
  [key: string]: ConfigValue | ConfigSection;
}

export type ConfigValue = string | number | boolean | Array<string | number | boolean> | null;

export interface ConfigSetting {
  key: string;
  value: ConfigValue;
  type: ConfigSettingType;
  description?: string;
  comment?: string;
  default?: ConfigValue;
  defaultValue?: ConfigValue;
  range?: [number, number];
  min?: number;
  max?: number;
  options?: string[];
  enumValues?: string[];
  unit?: string;
  category?: string;
  path: string[]; // Path to nested value
  userComments?: UserComment[]; // User-added comments with timestamps
}

export interface UserComment {
  id: string;
  text: string;
  timestamp: string; // ISO 8601 format
  author?: string;
}

export type ConfigSettingType =
  | "boolean"
  | "integer"
  | "float"
  | "string"
  | "enum"
  | "array"
  | "list"
  | "range"
  | "color"
  | "object";

export interface ParsedConfig {
  file: ConfigFile;
  settings: ConfigSetting[];
  categories: string[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  key: string;
  message: string;
  value: ConfigValue;
}

export interface ValidationWarning {
  key: string;
  message: string;
  value: ConfigValue;
}

export interface ConfigChange {
  key: string;
  oldValue: ConfigValue;
  newValue: ConfigValue;
  timestamp: Date;
}

export interface ConfigProfile {
  name: string;
  description?: string;
  configs: Record<string, ConfigContent>;
  created?: Date;
  modified?: Date;
}
