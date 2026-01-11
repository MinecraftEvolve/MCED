import TOML from '@iarna/toml';
import { ConfigContent, ConfigSetting } from '../../types/config.types';

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
    const fullText = comments.join(' ');

    // Extract description (everything before range/allowed values)
    const descLines: string[] = [];
    for (const comment of comments) {
      if (comment.startsWith('Range:') || comment.startsWith('Allowed Values:') || comment.startsWith('[in ')) {
        break;
      }
      descLines.push(comment);
    }
    if (descLines.length > 0) {
      parsed.description = descLines.join(' ').trim();
    }

    // Extract range
    const rangeMatch = fullText.match(/Range:\s*([-\d.]+)\s*~\s*([-\d.E+]+)/i);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      // Handle scientific notation for very large numbers
      parsed.range = {
        min: isFinite(min) ? min : Number.MIN_SAFE_INTEGER,
        max: isFinite(max) ? max : Number.MAX_SAFE_INTEGER
      };
    }

    // Extract allowed values
    const allowedMatch = fullText.match(/Allowed Values:\s*(.+)/i);
    if (allowedMatch) {
      parsed.allowedValues = allowedMatch[1]
        .split(',')
        .map(v => v.trim().replace(/['"]/g, ''));
    }

    // Extract unit
    const unitMatch = fullText.match(/\[in ([^\]]+)\]/i);
    if (unitMatch) {
      parsed.unit = unitMatch[1];
    }

    // Extract default value
    const defaultMatch = fullText.match(/Default:\s*(.+)/i);
    if (defaultMatch) {
      const defaultStr = defaultMatch[1].trim();
      if (defaultStr === 'true' || defaultStr === 'false') {
        parsed.defaultValue = defaultStr === 'true';
      } else if (!isNaN(Number(defaultStr))) {
        parsed.defaultValue = Number(defaultStr);
      } else {
        parsed.defaultValue = defaultStr.replace(/['"]/g, '');
      }
    }

    return parsed;
  }
}
