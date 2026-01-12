import yaml from "js-yaml";
import { ConfigContent } from "../../types/config.types";

export class YamlParser {
  parse(content: string): ConfigContent {
    try {
      return yaml.load(content) as ConfigContent;
    } catch (error) {
      throw new Error(`YAML parsing error: ${error}`);
    }
  }

  stringify(content: ConfigContent): string {
    try {
      return yaml.dump(content);
    } catch (error) {
      throw new Error(`YAML stringify error: ${error}`);
    }
  }
}
