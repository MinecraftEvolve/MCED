import TOML from "@iarna/toml";
import { ConfigContent, ConfigSetting } from "@/types/config.types";

interface ParsedComment {
  description?: string;
  range?: [number, number]; // Tuple format matching ConfigSetting
  allowedValues?: string[];
  unit?: string;
  defaultValue?: any;
}

export class TomlParser {
  parse(content: string): ConfigContent {
    try {
      return TOML.parse(content) as ConfigContent;
    } catch (error) {
      throw new Error(`TOML parsing error: ${error}`);
    }
  }

  stringify(content: ConfigContent): string {
    try {
      return TOML.stringify(content as any);
    } catch (error) {
      throw new Error(`TOML stringify error: ${error}`);
    }
  }

  // Enhanced method to extract metadata from TOML comments
  parseWithMetadata(content: string): {
    data: ConfigContent;
    metadata: Map<string, ParsedComment>;
  } {
    const data = this.parse(content);
    const metadata = this.extractComments(content);
    return { data, metadata };
  }

  private extractComments(content: string): Map<string, ParsedComment> {
    const comments = new Map<string, ParsedComment>();
    const lines = content.split("\n");
    let currentComments: string[] = [];
    let currentSection = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Track section headers like [client.sound]
      const sectionMatch = line.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        currentComments = []; // Reset comments when entering new section
        continue;
      }

      // Collect comment lines
      if (line.startsWith("#")) {
        const comment = line.substring(1).trim();
        // Skip empty comments and single dots
        if (comment && comment !== ".") {
          currentComments.push(comment);
        }
        continue;
      }

      // When we hit a setting line, associate previous comments with it
      const settingMatch = line.match(/^([\w\.]+)\s*=/);
      if (settingMatch) {
        const settingName = settingMatch[1];
        const fullKey = currentSection ? `${currentSection}.${settingName}` : settingName;

        // Only parse if we have comments
        if (currentComments.length > 0) {
          const parsed = this.parseCommentMetadata(currentComments);
          comments.set(fullKey, parsed);
        }
        currentComments = []; // Reset for next setting
        continue;
      }

      // Reset comments on empty lines or other content
      if (line === "") {
        // Don't reset - allow comments to span empty lines
      } else if (!line.startsWith("#")) {
        currentComments = [];
      }
    }

    return comments;
  }

  private parseCommentMetadata(comments: string[]): ParsedComment {
    const parsed: ParsedComment = {};
    const fullText = comments.join(" "); // Join with spaces for easier matching

    // Keep the FULL comment as description - don't remove metadata
    parsed.description = fullText;

    // Extract range - improved patterns
    const rangePatterns = [
      // Range: 0 ~ 60
      /Range:\s*(-?\d+(?:\.\d+)?(?:E[+-]?\d+)?)\s*~\s*(-?\d+(?:\.\d+)?(?:E[+-]?\d+)?)/i,
      // Range: > 0
      /Range:\s*>\s*(-?\d+(?:\.\d+)?)/i,
      // Range: >= 0
      /Range:\s*>=\s*(-?\d+(?:\.\d+)?)/i,
    ];

    for (const pattern of rangePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        if (match[2]) {
          // Two values: min ~ max
          const min = parseFloat(match[1]);
          const max = parseFloat(match[2]);
          parsed.range = [isFinite(min) ? min : 0, isFinite(max) ? max : 100];
        } else {
          // Single value: > X or >= X
          const min = parseFloat(match[1]);
          parsed.range = [
            isFinite(min) ? min + 1 : 1,
            10000, // Reasonable default
          ];
        }
        break;
      }
    }

    // Extract allowed values / enum values - improved patterns
    const allowedPatterns = [
      // Allowed Values: VALUE1, VALUE2, VALUE3
      /Allowed\s*Values?:\s*([A-Z_][A-Z0-9_,\s]+)/i,
      // Valid Options: VALUE1, VALUE2
      /Valid\s*Options?:\s*([A-Z_][A-Z0-9_,\s]+)/i,
      // Options: VALUE1, VALUE2
      /Options?:\s*([A-Z_][A-Z0-9_,\s]+)/i,
      // Enum: VALUE1, VALUE2
      /Enum:\s*([A-Z_][A-Z0-9_,\s]+)/i,
      // Values: VALUE1, VALUE2
      /Values?:\s*([A-Z_][A-Z0-9_,\s]+)/i,
    ];

    for (const pattern of allowedPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const valuesStr = match[1].trim();
        // Split by comma and/or whitespace, filter valid enum names
        parsed.allowedValues = valuesStr
          .split(/[,\s]+/)
          .map((v) => v.trim())
          .filter((v) => v && v.length > 0 && /^[A-Z][A-Z0-9_]*$/.test(v));

        if (parsed.allowedValues.length > 0) {
          break;
        }
      }
    }

    // Extract unit
    if (fullText.match(/\bseconds?\b/i)) {
      parsed.unit = "seconds";
    } else if (fullText.match(/\bblocks?\b/i)) {
      parsed.unit = "blocks";
    } else if (fullText.match(/\bticks?\b/i)) {
      parsed.unit = "ticks";
    } else if (fullText.match(/\bpercent\b|%/i)) {
      parsed.unit = "%";
    }

    // Extract default value
    const defaultMatch = fullText.match(/Default(?:s to)?:\s*([^\s.]+)/i);
    if (defaultMatch) {
      const defaultStr = defaultMatch[1].trim();
      if (defaultStr === "true" || defaultStr === "false") {
        parsed.defaultValue = defaultStr === "true";
      } else if (defaultStr.match(/^-?\d+(\.\d+)?$/)) {
        parsed.defaultValue = Number(defaultStr);
      } else {
        parsed.defaultValue = defaultStr.replace(/^["']|["']$/g, "");
      }
    }

    return parsed;
  }
}
