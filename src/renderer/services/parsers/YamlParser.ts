import yaml from 'js-yaml';
import { ConfigContent } from '../../types/config.types';

export class YamlParser {
  parse(content: string): ConfigContent {
    try {
      return yaml.load(content) as ConfigContent;
    } catch (error) {
      console.error('Failed to parse YAML:', error);
      throw new Error(`YAML parsing error: ${error}`);
    }
  }

  stringify(content: ConfigContent): string {
    try {
      return yaml.dump(content);
    } catch (error) {
      console.error('Failed to stringify YAML:', error);
      throw new Error(`YAML stringify error: ${error}`);
    }
  }
}
