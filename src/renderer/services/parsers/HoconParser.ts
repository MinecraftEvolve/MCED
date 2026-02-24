import { ConfigSetting } from "../../types/config.types";

/**
 * HOCON (Human-Optimized Config Object Notation) parser
 * Used by many older Forge mods and some newer ones
 */
export class HoconParser {
  parse(content: string): ConfigSetting[] {
    const settings: ConfigSetting[] = [];
    const lines = content.split("\n");
    let currentPath: string[] = [];
    let currentComments: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Skip empty lines
      if (!trimmed) {
        currentComments = [];
        continue;
      }

      // Single-line comment
      if (trimmed.startsWith("//") || trimmed.startsWith("#")) {
        const comment = trimmed.startsWith("//")
          ? trimmed.substring(2).trim()
          : trimmed.substring(1).trim();
        if (comment) currentComments.push(comment);
        continue;
      }

      // Multi-line comment
      if (trimmed.startsWith("/*")) {
        const lines2 = [];
        while (i < content.split("\n").length) {
          const l = content.split("\n")[i];
          if (l.includes("*/")) break;
          lines2.push(l.replace(/^\s*\*?\s?/, "").trim());
          i++;
        }
        currentComments.push(...lines2.filter(Boolean));
        continue;
      }

      // Opening brace for nested object: "key {" or "key = {"
      const objectMatch = trimmed.match(/^"?([^"=\s]+)"?\s*(?:=\s*)?\{$/);
      if (objectMatch) {
        currentPath.push(objectMatch[1]);
        currentComments = [];
        continue;
      }

      // Closing brace
      if (trimmed === "}") {
        currentPath.pop();
        currentComments = [];
        continue;
      }

      // Key-value: key = value or key: value
      const kvMatch = trimmed.match(/^"?([^"=:\s]+)"?\s*[=:]\s*(.+)$/);
      if (kvMatch) {
        const key = kvMatch[1];
        const rawValue = kvMatch[2].trim().replace(/,$/, ""); // remove trailing comma
        const value = this.parseValue(rawValue);
        const fullKey = [...currentPath, key].join(".");
        const comment = currentComments.join(" ");

        settings.push({
          key: fullKey,
          value,
          defaultValue: value,
          type: this.inferType(value),
          description: comment || undefined,
          section: currentPath.join(".") || undefined,
        });

        currentComments = [];
      }
    }

    return settings;
  }

  stringify(settings: ConfigSetting[], originalContent: string): string {
    let content = originalContent;
    for (const setting of settings) {
      const key = setting.key.split(".").pop() || setting.key;
      const oldVal = this.formatValue(setting.defaultValue ?? setting.value);
      const newVal = this.formatValue(setting.value);
      if (oldVal !== newVal) {
        const regex = new RegExp(
          `(${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*[=:]\\s*)${oldVal.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "g"
        );
        content = content.replace(regex, `$1${newVal}`);
      }
    }
    return content;
  }

  private parseValue(raw: string): any {
    // Remove surrounding quotes
    if ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'"))) {
      return raw.slice(1, -1);
    }
    if (raw === "true") return true;
    if (raw === "false") return false;
    if (raw === "null") return null;
    if (!isNaN(Number(raw)) && raw !== "") return Number(raw);
    if (raw.startsWith("[") && raw.endsWith("]")) {
      try { return JSON.parse(raw); } catch { return raw; }
    }
    return raw;
  }

  private formatValue(value: any): string {
    if (typeof value === "string") return `"${value}"`;
    if (Array.isArray(value)) return JSON.stringify(value);
    return String(value);
  }

  private inferType(value: any): ConfigSetting["type"] {
    if (typeof value === "boolean") return "boolean";
    if (typeof value === "number") return Number.isInteger(value) ? "integer" : "float";
    if (Array.isArray(value)) return "array";
    if (typeof value === "string" && /^[A-Z][A-Z0-9_]*$/.test(value)) return "enum";
    return "string";
  }
}
