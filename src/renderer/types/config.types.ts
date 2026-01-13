export interface ConfigFile {
  name: string;
  path: string;
  format: "toml" | "json" | "json5" | "yaml" | "cfg" | "properties";
  content: string;
  rawContent?: string;
  settings: ConfigSetting[];
  configType?: "client" | "server" | "server-default";
}

export type ConfigValue =
  | string
  | number
  | boolean
  | string[]
  | number[]
  | unknown;

export interface ConfigSetting {
  key: string;
  value: ConfigValue;
  default?: ConfigValue;
  defaultValue?: ConfigValue;
  type:
    | "string"
    | "integer"
    | "float"
    | "boolean"
    | "array"
    | "enum"
    | "list"
    | "range";
  description?: string;
  comment?: string;
  section?: string;
  category?: string;
  range?: [number, number];
  min?: number;
  max?: number;
  userComments?: UserComment[];
}

export interface UserComment {
  id: string;
  text: string;
  timestamp: string;
  author?: string;
  step?: number;
  options?: string[];
  enumValues?: string[];
  allowedValues?: string[];
  unit?: string;
}

export interface ConfigContent {
  [key: string]: ConfigValue | ConfigSectionObject;
}

export interface ConfigSectionObject {
  [key: string]: ConfigValue | ConfigSectionObject;
}

// Parser section format
export interface ConfigSection {
  name: string;
  settings: ConfigSetting[];
}
