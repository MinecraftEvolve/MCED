import { ConfigSection, ConfigSetting } from '@/types/config.types';

export class CfgParser {
  parse(content: string): ConfigSection[] {
    const lines = content.split('\n');
    const sections: ConfigSection[] = [];
    let currentSection: ConfigSection | null = null;
    let currentComment = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        currentComment = '';
        continue;
      }

      // Collect comments
      if (line.startsWith('#')) {
        currentComment += (currentComment ? '\n' : '') + line.substring(1).trim();
        continue;
      }

      // Section header [SectionName]
      if (line.startsWith('[') && line.endsWith(']')) {
        const sectionName = line.substring(1, line.length - 1);
        currentSection = {
          name: sectionName,
          settings: []
        };
        sections.push(currentSection);
        currentComment = '';
        continue;
      }

      // Key=Value or Key:Value
      const separatorIndex = line.indexOf('=') !== -1 ? line.indexOf('=') : line.indexOf(':');
      if (separatorIndex === -1) continue;

      const key = line.substring(0, separatorIndex).trim();
      const valueStr = line.substring(separatorIndex + 1).trim();
      
      const value = this.parseValue(valueStr);
      const type = this.detectType(value, currentComment);

      const setting: ConfigSetting = {
        key,
        value,
        type,
        description: currentComment,
        comment: currentComment
      };

      // Add range/enum info if found in comment
      this.parseMetadata(setting, currentComment);

      if (currentSection) {
        currentSection.settings.push(setting);
      } else {
        // Create default section if none exists
        if (sections.length === 0 || sections[0].name !== 'General') {
          sections.unshift({ name: 'General', settings: [] });
        }
        sections[0].settings.push(setting);
      }

      currentComment = '';
    }

    return sections;
  }

  private parseValue(str: string): any {
    // Remove quotes if present
    if ((str.startsWith('"') && str.endsWith('"')) || 
        (str.startsWith("'") && str.endsWith("'"))) {
      return str.substring(1, str.length - 1);
    }

    // Try boolean
    if (str.toLowerCase() === 'true') return true;
    if (str.toLowerCase() === 'false') return false;

    // Try number
    const num = Number(str);
    if (!isNaN(num)) return num;

    // Check for array/list
    if (str.startsWith('[') && str.endsWith(']')) {
      try {
        const items = str.substring(1, str.length - 1).split(',').map(s => s.trim());
        return items.map(item => this.parseValue(item));
      } catch (e) {
        return str;
      }
    }

    // Default to string
    return str;
  }

  private detectType(value: any, comment: string): ConfigSetting['type'] {
    if (typeof value === 'boolean') return 'boolean';
    if (Array.isArray(value)) return 'list';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'float';
    }
    
    // Check comment for type hints
    const lowerComment = comment.toLowerCase();
    if (lowerComment.includes('enum') || lowerComment.includes('valid values')) {
      return 'enum';
    }
    
    return 'string';
  }

  private parseMetadata(setting: ConfigSetting, comment: string): void {
    // Extract range: "Range: 0-100" or "Min: 0, Max: 100"
    const rangeMatch = comment.match(/range:\s*(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/i);
    if (rangeMatch) {
      setting.min = parseFloat(rangeMatch[1]);
      setting.max = parseFloat(rangeMatch[2]);
    } else {
      const minMatch = comment.match(/min:\s*(\d+(?:\.\d+)?)/i);
      const maxMatch = comment.match(/max:\s*(\d+(?:\.\d+)?)/i);
      if (minMatch) setting.min = parseFloat(minMatch[1]);
      if (maxMatch) setting.max = parseFloat(maxMatch[1]);
    }

    // Extract default: "Default: value"
    const defaultMatch = comment.match(/default:\s*([^\n,]+)/i);
    if (defaultMatch) {
      setting.defaultValue = this.parseValue(defaultMatch[1].trim());
    }

    // Extract enum values: "Valid values: A, B, C"
    const enumMatch = comment.match(/valid values?:\s*([^\n]+)/i);
    if (enumMatch) {
      setting.enumValues = enumMatch[1].split(',').map(s => s.trim());
      setting.type = 'enum';
    }
  }

  stringify(sections: ConfigSection[]): string {
    let output = '';

    for (const section of sections) {
      // Add section header
      if (section.name !== 'General') {
        output += `\n[${section.name}]\n`;
      }

      for (const setting of section.settings) {
        // Add comment if present
        if (setting.comment) {
          const commentLines = setting.comment.split('\n');
          for (const line of commentLines) {
            output += `# ${line}\n`;
          }
        }

        // Add key=value
        let valueStr: string;
        if (Array.isArray(setting.value)) {
          valueStr = `[${setting.value.join(', ')}]`;
        } else if (typeof setting.value === 'string' && setting.value.includes(' ')) {
          valueStr = `"${setting.value}"`;
        } else {
          valueStr = String(setting.value);
        }
        output += `${setting.key}=${valueStr}\n`;
      }

      output += '\n';
    }

    return output;
  }
}
