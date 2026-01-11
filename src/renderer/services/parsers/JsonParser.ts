import { ConfigContent } from '../../types/config.types';
import JSON5 from 'json5';

export class JsonParser {
  parse(content: string, isJson5: boolean = false): ConfigContent {
    try {
      if (isJson5) {
        return JSON5.parse(content);
      }
      return JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      throw new Error(`JSON parsing error: ${error}`);
    }
  }

  stringify(content: ConfigContent, isJson5: boolean = false): string {
    try {
      if (isJson5) {
        return JSON5.stringify(content, null, 2);
      }
      return JSON.stringify(content, null, 2);
    } catch (error) {
      console.error('Failed to stringify JSON:', error);
      throw new Error(`JSON stringify error: ${error}`);
    }
  }
}
