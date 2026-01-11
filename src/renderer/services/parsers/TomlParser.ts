import TOML from '@iarna/toml';
import { ConfigContent, ConfigSetting } from '../../types/config.types';

export class TomlParser {
  parse(content: string): ConfigContent {
    try {
      return TOML.parse(content) as ConfigContent;
    } catch (error) {
      console.error('Failed to parse TOML:', error);
      throw new Error(\TOML parsing error: \\);
    }
  }

  stringify(content: ConfigContent): string {
    try {
      return TOML.stringify(content as any);
    } catch (error) {
      console.error('Failed to stringify TOML:', error);
      throw new Error(\TOML stringify error: \\);
    }
  }
}
