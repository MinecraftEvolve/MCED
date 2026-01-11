import { ConfigSection, ConfigSetting } from '@/types/config.types';
import JSON5 from 'json5';

export class JsonParser {
  parse(content: string, isJson5: boolean = false): ConfigSection[] {
    try {
      // Extract comments before parsing
      const commentMap = new Map<string, string>();
      this.extractComments(content, commentMap);

      const data = isJson5 ? JSON5.parse(content) : JSON.parse(content);
      const settings = this.flattenObject(data, '', commentMap);

      return [{
        name: 'General',
        settings
      }];
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      throw new Error(`JSON parsing error: ${error}`);
    }
  }

  private extractComments(content: string, commentMap: Map<string, string>): void {
    const lines = content.split('\n');
    let lastComment = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Single-line comment
      if (line.startsWith('//')) {
        lastComment = line.substring(2).trim();
      }
      // Multi-line comment
      else if (line.includes('/*')) {
        let comment = '';
        const sameLine = line.match(/\/\*(.*?)\*\//);
        
        if (sameLine) {
          // Single line /* */ comment
          comment = sameLine[1].trim();
        } else {
          // Multi-line comment
          comment = line.replace('/*', '').replace(/^\s*\*/, '').trim();
          i++;
          
          while (i < lines.length && !lines[i].includes('*/')) {
            const cleaned = lines[i].replace(/^\s*\*/, '').trim();
            if (cleaned) comment += ' ' + cleaned;
            i++;
          }
          
          if (i < lines.length) {
            const ending = lines[i].replace('*/', '').replace(/^\s*\*/, '').trim();
            if (ending) comment += ' ' + ending;
          }
        }
        
        lastComment = comment.trim();
      }
      // Property line - associate with last comment
      else if (line.includes(':') && lastComment) {
        const match = line.match(/["']?(\w+)["']?\s*:/);
        if (match) {
          commentMap.set(match[1], lastComment);
          lastComment = '';
        }
      }
      // Empty line or closing brace - keep comment for next property
      else if (line === '' || line === '}' || line === '},') {
        // Don't reset comment - it might apply to the next property
      }
    }
  }

  private extractMetadata(comment: string): any {
    const metadata: any = { description: comment };

    // Range: X ~ Y
    const rangeMatch = comment.match(/Range:\s*(-?\d+(?:\.\d+)?)\s*(?:~|to)\s*(-?\d+(?:\.\d+)?)/i);
    if (rangeMatch) {
      metadata.range = [parseFloat(rangeMatch[1]), parseFloat(rangeMatch[2])];
    }

    // Allowed Values
    const allowedMatch = comment.match(/Allowed Values?:\s*(.+?)(?:\.|$)/i);
    if (allowedMatch) {
      const values = allowedMatch[1].split(',').map(v => v.trim());
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

  private flattenObject(obj: any, prefix: string, commentMap: Map<string, string>): ConfigSetting[] {
    const settings: ConfigSetting[] = [];

    for (const [key, value] of Object.entries(obj)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;

      if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
        settings.push(...this.flattenObject(value, fullKey, commentMap));
      } else {
        const comment = commentMap.get(key) || '';
        const metadata = comment ? this.extractMetadata(comment) : {};
        
        settings.push({
          key: fullKey,
          value,
          type: this.detectType(value, metadata),
          description: metadata.description,
          comment,
          range: metadata.range,
          allowedValues: metadata.allowedValues,
          unit: metadata.unit,
          default: metadata.default,
        });
      }
    }

    return settings;
  }

  private detectType(value: any, metadata: any = {}): ConfigSetting['type'] {
    if (metadata.allowedValues) return 'enum';
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
      if (metadata.range) return 'range';
      return Number.isInteger(value) ? 'integer' : 'float';
    }
    if (Array.isArray(value)) return 'array';
    return 'string';
  }

  stringify(sections: ConfigSection[], isJson5: boolean = false): string {
    try {
      const obj = this.unflattenObject(sections[0].settings);
      
      if (isJson5) {
        return JSON5.stringify(obj, null, 2);
      }
      return JSON.stringify(obj, null, 2);
    } catch (error) {
      console.error('Failed to stringify JSON:', error);
      throw new Error(`JSON stringify error: ${error}`);
    }
  }

  private unflattenObject(settings: ConfigSetting[]): any {
    const result: any = {};

    for (const setting of settings) {
      const keys = setting.key.split('.');
      let current = result;

      for (let i = 0; i < keys.length - 1; i++) {
        if (!current[keys[i]]) {
          current[keys[i]] = {};
        }
        current = current[keys[i]];
      }

      current[keys[keys.length - 1]] = setting.value;
    }

    return result;
  }
}
