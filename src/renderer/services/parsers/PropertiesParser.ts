import { ConfigSection, ConfigSetting } from "@/types/config.types";

export class PropertiesParser {
  parse(content: string): ConfigSection[] {
    const lines = content.split("\n");
    const settings: ConfigSetting[] = [];
    let currentComment = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        currentComment = "";
        continue;
      }

      // Collect comments
      if (line.startsWith("#") || line.startsWith("!")) {
        currentComment +=
          (currentComment ? "\n" : "") + line.substring(1).trim();
        continue;
      }

      // Parse key=value
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) continue;

      const key = line.substring(0, separatorIndex).trim();
      const valueStr = line.substring(separatorIndex + 1).trim();

      const value = this.parseValue(valueStr);
      const metadata = this.extractMetadata(currentComment);
      const type = this.detectType(value, metadata);

      settings.push({
        key,
        value,
        type,
        description: metadata.description || currentComment,
        comment: currentComment,
        range: metadata.range,
        allowedValues: metadata.allowedValues,
        unit: metadata.unit,
        default: metadata.default,
      });

      currentComment = "";
    }

    return [
      {
        name: "General",
        settings,
      },
    ];
  }

  private extractMetadata(comment: string): any {
    const metadata: any = { description: comment };

    // Range: X ~ Y or Range: X to Y
    const rangeMatch = comment.match(
      /Range:\s*(-?\d+(?:\.\d+)?)\s*(?:~|to)\s*(-?\d+(?:\.\d+)?)/i,
    );
    if (rangeMatch) {
      metadata.range = [parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2])];
    }

    // Allowed Values
    const allowedMatch = comment.match(/Allowed Values?:\s*(.+?)(?:\.|$)/i);
    if (allowedMatch) {
      const values = allowedMatch[1].split(",").map((v) => v.trim());
      metadata.allowedValues = values;
    }

    // Default
    const defaultMatch = comment.match(/Default:\s*(.+?)(?:\.|$)/i);
    if (defaultMatch) {
      metadata.default = defaultMatch[1].trim();
    }

    // Unit
    const unitMatch = comment.match(/\(([^)]+)\)$/);
    if (unitMatch) {
      metadata.unit = unitMatch[1];
    }

    return metadata;
  }

  private parseValue(str: string): any {
    // Remove quotes if present
    if (
      (str.startsWith('"') && str.endsWith('"')) ||
      (str.startsWith("'") && str.endsWith("'"))
    ) {
      return str.substring(1, str.length - 1);
    }

    // Try boolean
    if (str.toLowerCase() === "true") return true;
    if (str.toLowerCase() === "false") return false;

    // Try number
    const num = Number(str);
    if (!isNaN(num)) return num;

    // Default to string
    return str;
  }

  private detectType(value: any, metadata: any = {}): ConfigSetting["type"] {
    if (metadata.allowedValues) return "enum";
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") {
      if (metadata.range) return "range";
      return Number.isInteger(value) ? "integer" : "float";
    }
    return "string";
  }

  stringify(sections: ConfigSection[]): string {
    let output = "";

    for (const section of sections) {
      if (section.name !== "General") {
        output += `\n# ${section.name}\n`;
      }

      for (const setting of section.settings) {
        // Add comment if present
        if (setting.comment) {
          const commentLines = setting.comment.split("\n");
          for (const line of commentLines) {
            output += `# ${line}\n`;
          }
        }

        // Add key=value
        let valueStr = String(setting.value);
        if (typeof setting.value === "string" && setting.value.includes(" ")) {
          valueStr = `"${setting.value}"`;
        }
        output += `${setting.key}=${valueStr}\n`;
      }
    }

    return output;
  }
}
