export interface ConfigFile {
  name: string;
  path: string;
  format: 'toml' | 'json' | 'json5' | 'yaml' | 'cfg' | 'properties';
  content: string;
  settings: ConfigSetting[];
}

export interface ConfigSetting {
  key: string;
  value: any;
  defaultValue?: any;
  type: 'string' | 'integer' | 'float' | 'boolean' | 'array' | 'enum';
  description?: string;
  section?: string;
  range?: [number, number];
  min?: number;
  max?: number;
  options?: string[];
  enumValues?: string[];
  allowedValues?: string[];
  unit?: string;
}

export interface ConfigContent {
  [key: string]: any;
}

export interface ConfigSection {
  [key: string]: any;
}
