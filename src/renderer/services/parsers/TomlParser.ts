import TOML from '@iarna/toml';
import { ConfigContent, ConfigSetting } from '../types/config.types';

interface ParsedComment {
  description?: string;
  range?: { min: number; max: number };
  allowedValues?: string[];
  unit?: string;
  defaultValue?: any;
}

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

  // Enhanced method to extract metadata from TOML comments
  parseWithMetadata(content: string): { data: ConfigContent; metadata: Map<string, ParsedComment> } {
    const data = this.parse(content);
    const metadata = this.extractComments(content);
    return { data, metadata };
  }

  private extractComments(content: string): Map<string, ParsedComment> {
    const comments = new Map<string, ParsedComment>();
    const lines = content.split('\n');
    let currentComments: string[] = [];
    let currentSection = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Track section headers like [client.sound]
      const sectionMatch = line.match(/^\[([^\]]+)\]$/);
      if (sectionMatch) {
        currentSection = sectionMatch[1];
        continue;
      }

      // Collect comment lines
      if (line.startsWith('#')) {
        const comment = line.substring(1).trim();
        if (comment !== '.' && comment !== '') {
          currentComments.push(comment);
        }
        continue;
      }

      // When we hit a setting line, associate comments with it
      const settingMatch = line.match(/^(\w+)\s*=/);
      if (settingMatch && currentComments.length > 0) {
        const settingName = settingMatch[1];
        const fullKey = currentSection ? `${currentSection}.${settingName}` : settingName;
        comments.set(fullKey, this.parseCommentMetadata(currentComments));
        currentComments = [];
      }

      // Reset comments if we hit a non-comment, non-setting line
      if (!line.startsWith('#') && !settingMatch && line !== '') {
        currentComments = [];
      }
    }

    return comments;
  }

  private parseCommentMetadata(comments: string[]): ParsedComment {
    const parsed: ParsedComment = {};
    const fullText = comments.join('\n');

    // Extract description (everything before range/allowed values/default)
    const descLines: string[] = [];
    for (const comment of comments) {
      // Stop at metadata lines
      if (comment.match(/^(Range|Allowed Values?|Default|Possible values?|Options?):/i)) {
        break;
      }
      // Skip lines that are just metadata markers
      if (comment.match(/^(SETTING|WARNING|NOTE|IMPORTANT):/i)) {
        continue;
      }
      descLines.push(comment);
    }
    if (descLines.length > 0) {
      parsed.description = descLines.join(' ').trim();
    }

    // Extract range - support multiple formats
    const rangePatterns = [
      /Range:\s*([<>]=?\s*)?(-?\d+(?:\.\d+)?(?:E[+-]?\d+)?)\s*~\s*([<>]=?\s*)?(-?\d+(?:\.\d+)?(?:E[+-]?\d+)?)/i,
      /Range:\s*>\s*(-?\d+(?:\.\d+)?)/i, // Range: > 0
      /Range:\s*(-?\d+(?:\.\d+)?)\s*~\s*(-?\d+(?:\.\d+)?)/i,
    ];

    for (const pattern of rangePatterns) {
      const match = fullText.match(pattern);
      if (match) {
        if (match.length === 3) {
          // Range: > X format
          const min = parseFloat(match[1]);
          parsed.range = {
            min: isFinite(min) ? min : 0,
            max: Number.MAX_SAFE_INTEGER
          };
        } else if (match.length >= 4) {
          const min = parseFloat(match[2]);
          const max = parseFloat(match[4]);
          parsed.range = {
            min: isFinite(min) ? min : Number.MIN_SAFE_INTEGER,
            max: isFinite(max) ? max : Number.MAX_SAFE_INTEGER
          };
        }
        break;
      }
    }

    // Extract allowed values - support multiple formats
    const allowedPatterns = [
      /Allowed Values?:\s*(.+?)(?=\n|$)/i,
      /Possible values?:\s*(.+?)(?=\n|$)/i,
      /Options?:\s*(.+?)(?=\n|$)/i,
    ];

    for (const pattern of allowedPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const valuesStr = match[1];
        // Handle both comma-separated and space-separated
        parsed.allowedValues = valuesStr
          .split(/[,;\|]|\sand\s/)
          .map(v => v.trim().replace(/^["']|["']$/g, ''))
          .filter(v => v && v.length > 0);
        break;
      }
    }

    // Extract unit - multiple patterns
    const unitPatterns = [
      /\[in ([^\]]+)\]/i,
      /\(([^)]*(?:percent|%|blocks?|seconds?|ticks?|minutes?|hours?|pixels?|chunks?|mb|kb|gb)[^)]*)\)/i,
    ];

    for (const pattern of unitPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        parsed.unit = match[1].trim();
        break;
      }
    }

    // Extract default value - multiple patterns
    const defaultPatterns = [
      /Default:\s*(.+?)(?=\n|$)/i,
      /Defaults? to:\s*(.+?)(?=\n|$)/i,
    ];

    for (const pattern of defaultPatterns) {
      const match = fullText.match(pattern);
      if (match) {
        const defaultStr = match[1].trim();
        // Parse the value appropriately
        if (defaultStr === 'true' || defaultStr === 'false') {
          parsed.defaultValue = defaultStr === 'true';
        } else if (defaultStr.match(/^-?\d+(\.\d+)?$/)) {
          parsed.defaultValue = Number(defaultStr);
        } else {
          // Remove quotes if present
          parsed.defaultValue = defaultStr.replace(/^["']|["']$/g, '');
        }
        break;
      }
    }

    return parsed;
  }
}
