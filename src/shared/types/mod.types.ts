export interface ModMetadata {
  modId: string;
  name: string;
  version: string;
  description?: string;
  authors?: string[];
  icon?: string; // base64 or path
  homepage?: string;
  sources?: string;
  issueTracker?: string;
  license?: string;
  logoFile?: string;
  credits?: string;
  displayURL?: string;
  updateJSONURL?: string;
  dependencies?: ModDependency[];
  categories?: string[];
  tags?: string[];
}

export interface ModDependency {
  modId: string;
  type: "required" | "optional" | "incompatible" | "before" | "after";
  versionRange?: string;
}

export interface ModInfo extends ModMetadata {
  jarPath: string;
  loader: "forge" | "fabric" | "neoforge" | "quilt";
  configFiles: ConfigFile[];
  platformData?: PlatformData;
  isFavorite?: boolean;
  lastModified?: number; // Timestamp in milliseconds
}

export interface PlatformData {
  platform: "curseforge" | "modrinth";
  projectId: string | number;
  slug?: string;
  downloadCount?: number;
  lastUpdated?: string;
  dateReleased?: string;
  categories?: string[];
  gameVersions?: string[];
  iconUrl?: string;
  websiteUrl?: string;
}

export interface CurseForgeModData {
  id: number;
  name: string;
  slug: string;
  summary: string;
  downloadCount: number;
  dateReleased: string;
  dateModified: string;
  logo: {
    thumbnailUrl: string;
    url: string;
  };
  links: {
    websiteUrl: string;
    wikiUrl?: string;
    issuesUrl?: string;
    sourceUrl?: string;
  };
  categories: Array<{
    id: number;
    name: string;
    slug: string;
  }>;
  authors: Array<{
    id: number;
    name: string;
    url: string;
  }>;
}

export interface ModrinthModData {
  id: string;
  slug: string;
  title: string;
  description: string;
  categories: string[];
  downloads: number;
  followers: number;
  icon_url: string;
  published: string;
  updated: string;
  license: {
    id: string;
    name: string;
    url?: string;
  };
  source_url?: string;
  issues_url?: string;
  wiki_url?: string;
}

export interface ConfigFile {
  path: string;
  filename: string;
  format: string;
  modId?: string;
}
