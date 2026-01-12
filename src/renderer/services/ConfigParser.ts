import path from "path";
import { TomlParser } from "./parsers/TomlParser";
import { JsonParser } from "./parsers/JsonParser";
import { YamlParser } from "./parsers/YamlParser";
import { PropertiesParser } from "./parsers/PropertiesParser";
import { CfgParser } from "./parsers/CfgParser";
import {
  ConfigSection,
  ConfigContent,
  ConfigSectionObject,
} from "@/types/config.types";

export class ConfigParser {
  private tomlParser = new TomlParser();
  private jsonParser = new JsonParser();
  private yamlParser = new YamlParser();
  private propertiesParser = new PropertiesParser();
  private cfgParser = new CfgParser();

  parse(filePath: string, content: string): any {
    const ext = path.extname(filePath).toLowerCase();

    try {
      switch (ext) {
        case ".toml":
          return this.tomlParser.parse(content);

        case ".json":
        case ".json5":
          return this.jsonParser.parse(content);

        case ".yaml":
        case ".yml":
          return this.yamlParser.parse(content);

        case ".properties":
          return this.propertiesParser.parse(content);

        case ".cfg":
          return this.cfgParser.parse(content);

        default:
          // Try to auto-detect format
          return this.autoDetect(content);
      }
    } catch (error) {
      return [];
    }
  }

  stringify(filePath: string, sections: ConfigSection[]): string {
    const ext = path.extname(filePath).toLowerCase();

    try {
      switch (ext) {
        case ".toml":
          return this.tomlParser.stringify(this.sectionsToContent(sections));

        case ".json":
        case ".json5":
          return this.jsonParser.stringify(sections);

        case ".yaml":
        case ".yml":
          return this.yamlParser.stringify(this.sectionsToContent(sections));

        case ".properties":
          return this.propertiesParser.stringify(sections);

        case ".cfg":
          return this.cfgParser.stringify(sections);

        default:
          // Default to TOML
          return this.tomlParser.stringify(this.sectionsToContent(sections));
      }
    } catch (error) {
      return "";
    }
  }

  private sectionsToContent(sections: ConfigSection[]): ConfigContent {
    const content: ConfigContent = {};

    for (const section of sections) {
      const sectionObj: ConfigSectionObject = {};

      for (const setting of section.settings) {
        sectionObj[setting.key] = setting.value;
      }

      if (section.name === "General" || !section.name) {
        // Flatten general section to root
        Object.assign(content, sectionObj);
      } else {
        content[section.name] = sectionObj;
      }
    }

    return content;
  }

  private autoDetect(content: string): ConfigSection[] {
    // Try JSON first (most structured)
    if (content.trim().startsWith("{")) {
      try {
        return this.jsonParser.parse(content);
      } catch (e) {
        // Continue to next format
      }
    }

    // Try TOML (common in Forge mods)
    if (content.includes("[") && content.includes("]")) {
      try {
        return this.tomlParser.parse(content) as any;
      } catch (e) {
        // Continue to next format
      }
    }

    // Try YAML
    try {
      return this.yamlParser.parse(content) as any;
    } catch (e) {
      // Continue to next format
    }

    // Try properties
    if (content.includes("=")) {
      try {
        return this.propertiesParser.parse(content);
      } catch (e) {
        // Continue to next format
      }
    }

    // Default to CFG
    return this.cfgParser.parse(content);
  }
}

export const configParser = new ConfigParser();
