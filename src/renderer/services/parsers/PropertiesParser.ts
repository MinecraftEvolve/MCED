import { ConfigSection, ConfigSetting } from '@/types/config.types';

export class PropertiesParser {
  parse(content: string): ConfigSection[] {
    const lines = content.split('\n');
    const settings: ConfigSetting[] = [];
    let currentComment = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip empty lines
      if (!line) {
        currentComment = '';
        continue;
      }

      // Collect comments
      if (line.startsWith('#') || line.startsWith('!')) {
        currentComment += (currentComment ? '\n' : '') + line.substring(1).trim();
        continue;
      }

      // Parse key=value
      const separatorIndex = line.indexOf('=');
      if (separatorIndex === -1) continue;

      const key = line.substring(0, separatorIndex).trim();
      const valueStr = line.substring(separatorIndex + 1).trim();
      
      const value = this.parseValue(valueStr);
      const type = this.detectType(value);

      settings.push({
        key,
        value,
        type,
        description: currentComment,
        comment: currentComment
      });

      currentComment = '';
    }

    return [{
      name: 'General',
      settings
    }];
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

    // Default to string
    return str;
  }

  private detectType(value: any): ConfigSetting['type'] {
    if (typeof value === 'boolean') return 'boolean';
    if (typeof value === 'number') {
      return Number.isInteger(value) ? 'integer' : 'float';
    }
    return 'string';
  }

  stringify(sections: ConfigSection[]): string {
    let output = '';

    for (const section of sections) {
      if (section.name !== 'General') {
        output += `\n# ${section.name}\n`;
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
        let valueStr = String(setting.value);
        if (typeof setting.value === 'string' && setting.value.includes(' ')) {
          valueStr = `"${setting.value}"`;
        }
        output += `${setting.key}=${valueStr}\n`;
      }
    }

    return output;
  }
}
