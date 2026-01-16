export interface ParsedRecipe {
  id: string;
  type: string;
  input?: any;
  inputs?: any[];
  output?: any;
  outputs?: any[];
  result?: any;
  results?: any[];
  [key: string]: any;
}
