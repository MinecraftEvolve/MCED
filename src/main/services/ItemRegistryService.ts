import path from "path";
import { promises as fs } from "fs";
import { JarLoaderService } from "./JarLoaderService";

export interface ItemInfo {
  id: string; // Format: "modid:itemname"
  modId: string;
  name: string;
  texture: string | null; // Base64 data URL or null
  type: "item" | "block";
  tags?: string[]; // Item tags (e.g., ["#forge:ores", "#minecraft:planks"])
}

export interface ItemRegistryCache {
  items: ItemInfo[];
  blocks: ItemInfo[];
  lastUpdated: number;
}

export class ItemRegistryService {
  private cache: ItemRegistryCache | null = null;
  private cacheDir: string;
  private instancePath: string;
  private tagCache: Map<string, string[]> = new Map(); // tag -> [itemIds]
  private jarLoader: JarLoaderService;

  constructor(instancePath: string) {
    this.instancePath = instancePath;
    this.cacheDir = path.join(instancePath, ".mced", "item-cache");
    this.jarLoader = JarLoaderService.getInstance();
  }

  async initialize(modsFolder: string): Promise<void> {
    console.log("=== ItemRegistryService.initialize CALLED ===");
    // Try to load from cache first
    const cacheLoaded = await this.loadCache();
    console.log(`Cache loaded: ${cacheLoaded}`);
    
    if (!cacheLoaded) {
      console.log("Building new item registry...");
      // Build new cache
      await this.buildItemRegistry(modsFolder);
      await this.saveCache();
    } else {
      console.log("Using cached item registry");
      
      // Check if we have vanilla items
      const hasVanilla = this.cache?.items.some(i => i.modId === 'minecraft');
      if (!hasVanilla && this.cache) {
        console.log("No vanilla items in cache, loading from Forge...");
        const vanillaItems = await this.loadVanillaItemsFromForge(modsFolder);
        if (vanillaItems) {
          this.cache.items.push(...vanillaItems.items);
          this.cache.blocks.push(...vanillaItems.blocks);
          console.log(`Added ${vanillaItems.items.length} vanilla items and ${vanillaItems.blocks.length} vanilla blocks`);
          
          // Load tags after loading items
          await this.loadAllTagsFromJars();
          
          await this.saveCache();
        }
      }
    }
  }

  async buildItemRegistry(modsFolder: string): Promise<void> {
    console.log("=== buildItemRegistry CALLED ===");
    const items: ItemInfo[] = [];
    const blocks: ItemInfo[] = [];

    try {
      // Load Forge JAR for vanilla items
      console.log("Loading vanilla Minecraft items from Forge...");
      const forgeData = await this.jarLoader.findAndLoadForgeJar(modsFolder);
      if (forgeData) {
        forgeData.items.forEach(item => {
          items.push({
            id: item.id,
            modId: forgeData.modId,
            name: item.name,
            texture: `data:image/png;base64,${item.texture}`,
            type: "item",
          });
        });
        console.log(`Loaded ${forgeData.items.length} vanilla items from Forge`);
      }

      // Load all mod JARs
      const allJarData = await this.jarLoader.loadAllJars(modsFolder);
      
      for (const jarData of allJarData) {
        jarData.items.forEach(item => {
          // Determine if it's an item or block based on texture path
          const type: "item" | "block" = "item"; // JarLoader doesn't distinguish yet
          
          const itemInfo: ItemInfo = {
            id: item.id,
            modId: jarData.modId,
            name: item.name,
            texture: `data:image/png;base64,${item.texture}`,
            type,
          };
          
          items.push(itemInfo);
        });
      }

      this.cache = {
        items,
        blocks,
        lastUpdated: Date.now(),
      };
      
      // Load tags from cached JAR data
      this.loadTagsFromCachedJars();
      
      console.log(`Built registry with ${items.length} items and ${blocks.length} blocks`);
    } catch (error) {
      console.error("Failed to build item registry:", error);
      this.cache = { items: [], blocks: [], lastUpdated: Date.now() };
    }
  }

  private loadTagsFromCachedJars(): void {
    console.log('Loading tags from cached JAR data...');
    const allJarData = this.jarLoader.getAllCachedData();
    
    let tagsLoaded = 0;
    for (const jarData of allJarData) {
      jarData.tags.forEach((tagData, tagPath) => {
        if (tagData.values && Array.isArray(tagData.values)) {
          this.tagCache.set(tagPath, tagData.values);
          tagsLoaded++;
        }
      });
    }
    
    console.log(`Loaded ${tagsLoaded} tags from cached JAR data`);
  }

  private async loadVanillaItemsFromForge(modsFolder: string): Promise<{ items: ItemInfo[]; blocks: ItemInfo[] } | null> {
    try {
      // Find Forge JAR in Modrinth App versions folder
      const forgeJar = await this.findForgeJar(modsFolder);
      if (!forgeJar) {
        console.log("No Forge JAR found");
        return null;
      }

      console.log(`Extracting vanilla items from Forge JAR: ${forgeJar}`);
      return await this.extractTexturesFromJar(forgeJar, "minecraft");
    } catch (error) {
      console.error("Failed to load vanilla items from Forge:", error);
      return null;
    }
  }

  private async findForgeJar(modsFolder: string): Promise<string | null> {
    try {
      // Check for Modrinth App structure
      const appData = process.env.APPDATA || process.env.HOME + "/AppData/Roaming";
      const modrinthVersions = path.join(appData, "ModrinthApp", "meta", "versions");
      
      console.log(`Checking for Modrinth Forge at: ${modrinthVersions}`);
      try {
        await fs.access(modrinthVersions);
        const versionFolders = await fs.readdir(modrinthVersions);
        console.log(`Found version folders: ${versionFolders.join(', ')}`);
        
        // Look for Forge versions (format: 1.20.1-47.4.1)
        for (const versionFolder of versionFolders) {
          if (versionFolder.includes("-")) {
            const jarPath = path.join(modrinthVersions, versionFolder, `${versionFolder}.jar`);
            console.log(`Checking for JAR at: ${jarPath}`);
            try {
              await fs.access(jarPath);
              console.log(`Found Forge JAR: ${jarPath}`);
              return jarPath;
            } catch (err) {
              console.log(`JAR not found at: ${jarPath}`);
              continue;
            }
          }
        }
      } catch {
        console.log("Modrinth App versions folder not found");
      }
      
      // Check for CurseForge structure
      const userProfile = process.env.USERPROFILE;
      if (userProfile) {
        const curseforgeVersions = path.join(userProfile, "curseforge", "minecraft", "Install", "versions");
        console.log(`Checking for CurseForge at: ${curseforgeVersions}`);
        
        try {
          await fs.access(curseforgeVersions);
          const versionFolders = await fs.readdir(curseforgeVersions);
          console.log(`Found CurseForge version folders: ${versionFolders.join(', ')}`);
          
          // Look for forge/neoforge versions
          for (const versionFolder of versionFolders) {
            if (versionFolder.startsWith("forge-") || versionFolder.startsWith("neoforge-")) {
              const jarPath = path.join(curseforgeVersions, versionFolder, `${versionFolder}.jar`);
              console.log(`Checking for CurseForge JAR at: ${jarPath}`);
              try {
                await fs.access(jarPath);
                console.log(`Found CurseForge JAR: ${jarPath}`);
                return jarPath;
              } catch (err) {
                console.log(`JAR not found at: ${jarPath}`);
                continue;
              }
            }
          }
        } catch {
          console.log("CurseForge versions folder not found");
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error finding Forge JAR:", error);
      return null;
    }
  }

  private async extractTexturesFromJar(
    jarPath: string,
    forceModId?: string
  ): Promise<{ items: ItemInfo[]; blocks: ItemInfo[] }> {
    const items: ItemInfo[] = [];
    const blocks: ItemInfo[] = [];

    try {
      const jarData = await this.jarLoader.loadJar(jarPath, forceModId);

      // Convert JarLoader data to ItemInfo format
      for (const item of jarData.items) {
        items.push({
          id: item.id,
          modId: jarData.modId,
          name: item.name,
          texture: `data:image/png;base64,${item.texture}`,
          type: "item",
        });
      }

      // For blocks, we need to load them separately since JarLoader doesn't extract blocks yet
      // TODO: Add block extraction to JarLoader in the future
    } catch (error) {
      console.error(`Failed to extract textures from ${jarPath}:`, error);
    }

    return { items, blocks };
  }

  async getItems(): Promise<ItemInfo[]> {
    return this.cache?.items || [];
  }

  async getBlocks(): Promise<ItemInfo[]> {
    return this.cache?.blocks || [];
  }

  async getAllItems(): Promise<ItemInfo[]> {
    const items = this.cache?.items || [];
    const blocks = this.cache?.blocks || [];
    const minecraftItems = items.filter(i => i.modId === 'minecraft');
    const minecraftBlocks = blocks.filter(b => b.modId === 'minecraft');
    console.log(`Item cache stats: ${items.length} items (${minecraftItems.length} vanilla), ${blocks.length} blocks (${minecraftBlocks.length} vanilla)`);
    
    // Debug: check if minecraft:chorus_fruit exists
    const chorusFruit = [...items, ...blocks].find(i => i.id === 'minecraft:chorus_fruit');
    if (chorusFruit) {
      console.log(`✓ Found minecraft:chorus_fruit in registry:`, chorusFruit);
    } else {
      console.log(`✗ minecraft:chorus_fruit NOT in registry`);
      const mcFruits = [...items, ...blocks].filter(i => i.id.includes('chorus'));
      console.log(`Items with 'chorus':`, mcFruits.map(i => i.id));
    }
    
    const combined = [...items, ...blocks];
    
    // Deduplicate by ID - keep the item with the most data
    const itemMap = new Map<string, ItemInfo>();
    for (const item of combined) {
      const existing = itemMap.get(item.id);
      if (!existing) {
        itemMap.set(item.id, item);
      } else {
        // Compare which item has more data
        const itemScore = (item.texture ? 1 : 0) + (item.name ? 1 : 0) + (item.modId ? 1 : 0);
        const existingScore = (existing.texture ? 1 : 0) + (existing.name ? 1 : 0) + (existing.modId ? 1 : 0);
        
        // Keep the item with more data (higher score wins)
        if (itemScore > existingScore) {
          itemMap.set(item.id, item);
        }
      }
    }
    
    return Array.from(itemMap.values());
  }

  async searchItems(query: string): Promise<ItemInfo[]> {
    const allItems = await this.getAllItems();
    const lowerQuery = query.toLowerCase();
    
    return allItems.filter(
      (item) =>
        item.id.toLowerCase().includes(lowerQuery) ||
        item.name.toLowerCase().includes(lowerQuery) ||
        item.modId.toLowerCase().includes(lowerQuery)
    );
  }

  async getItemById(id: string): Promise<ItemInfo | null> {
    const allItems = await this.getAllItems();
    return allItems.find((item) => item.id === id) || null;
  }

  async getItemsByTag(tag: string): Promise<ItemInfo[]> {
    // Remove # prefix if present
    const cleanTag = tag.replace(/^#/, '');
    
    console.log(`Getting items for tag: ${cleanTag}`);
    
    // Check cache first
    if (this.tagCache.has(cleanTag)) {
      console.log(`Tag found in cache: ${cleanTag}`);
      const cachedItemIds = this.tagCache.get(cleanTag) || [];
      const items: ItemInfo[] = [];
      for (const itemId of cachedItemIds) {
        const item = await this.getItemById(itemId);
        if (item) items.push(item);
      }
      return items;
    }
    
    const [namespace, ...pathParts] = cleanTag.split(':');
    const tagPath = pathParts.join(':');
    
    // Try to load from mod JARs
    const tagItems = await this.loadTagFromModJars(namespace, tagPath);
    if (tagItems.length > 0) {
      return tagItems.slice(0, 10);
    }
    
    // Fallback: Simple matching based on tag name
    const allItems = await this.getAllItems();
    const tagParts = cleanTag.split(/[/:]/);
    
    return allItems.filter(item => {
      const itemLower = item.id.toLowerCase();
      return tagParts.some(part => itemLower.includes(part.toLowerCase()));
    }).slice(0, 10); // Limit to 10 items for performance
  }

  private async loadTagFromModJars(namespace: string, tagPath: string): Promise<ItemInfo[]> {
    try {
      const tagName = `#${namespace}:${tagPath}`;
      
      // Check cache first
      if (this.tagCache.has(tagName)) {
        console.log(`Using cached tag: ${tagName}`);
        const cachedItemIds = this.tagCache.get(tagName) || [];
        const items: ItemInfo[] = [];
        for (const itemId of cachedItemIds) {
          const item = await this.getItemById(itemId);
          if (item) items.push(item);
        }
        return items;
      }
      
      console.log(`Loading tag from mod JARs: ${tagName}`);
      
      // Get all mod JARs and Forge JAR
      // this.cacheDir is like: C:\Users\Luke\AppData\Roaming\ModrinthApp\profiles\CC7 Trial  0.0.2\.mced\item-cache
      const instancePath = this.cacheDir.replace(path.join('.mced', 'item-cache'), '').replace(/[\/\\]$/, '');
      console.log(`Instance path: ${instancePath}`);
      const modsPath = path.join(instancePath, 'mods');
      console.log(`Mods path: ${modsPath}`);
      const jarFiles: string[] = [];
      
      // Add Forge JAR from Modrinth App versions folder
      const appData = process.env.APPDATA || process.env.HOME + "/AppData/Roaming";
      const modrinthVersions = path.join(appData, "ModrinthApp", "meta", "versions");
      try {
        const versionFolders = await fs.readdir(modrinthVersions);
        for (const folder of versionFolders) {
          if (folder.includes('forge') || folder.match(/^\d+\.\d+\.\d+-\d+\.\d+/)) {
            const forgeJarPath = path.join(modrinthVersions, folder, `${folder}.jar`);
            try {
              await fs.access(forgeJarPath);
              console.log(`Found Forge JAR: ${forgeJarPath}`);
              jarFiles.push(forgeJarPath);
              break;
            } catch {}
          }
        }
      } catch (err) {
        console.warn('Could not read Modrinth versions folder:', err);
      }
      
      // Add mod JARs from instance
      try {
        const files = await fs.readdir(modsPath);
        for (const file of files) {
          if (file.endsWith('.jar')) {
            jarFiles.push(path.join(modsPath, file));
          }
        }
        console.log(`Found ${jarFiles.length} total JAR files to search`);
      } catch (err) {
        console.warn('Could not read mods folder:', err);
      }
      
      // Search for tag in all JARs
      for (const jarPath of jarFiles) {
        try {
          const AdmZip = require('adm-zip');
          const zip = new AdmZip(jarPath);
          const entries = zip.getEntries();
          
          console.log(`Searching for tag in ${path.basename(jarPath)}`);
          
          // Look for tag file: data/<namespace>/tags/items/<tagPath>.json
          const tagFile = entries.find((e: any) => 
            e.entryName === `data/${namespace}/tags/items/${tagPath}.json` ||
            e.entryName === `data/${namespace}/tags/item/${tagPath}.json`
          );
          
          if (tagFile) {
            console.log(`✓ Found tag in ${path.basename(jarPath)}`);
            const tagData = tagFile.getData().toString('utf-8');
            const tagJson = JSON.parse(tagData);
            const itemIds = tagJson.values || [];
            
            console.log(`Tag contains ${itemIds.length} item IDs:`, itemIds);
            
            // Load items by their IDs
            const allItems = await this.getAllItems();
            console.log(`Registry has ${allItems.length} total items`);
            
            const tagItems = allItems.filter(item => 
              itemIds.some((entry: any) => {
                // Handle both string IDs and objects with id property
                let id: string;
                if (typeof entry === 'string') {
                  id = entry;
                } else if (entry && typeof entry === 'object' && entry.id) {
                  id = entry.id;
                } else {
                  return false;
                }
                
                // Handle tag references
                if (id.startsWith('#')) return false; // Skip nested tags for now
                
                // Handle items without namespace (assume minecraft)
                const normalizedId = id.includes(':') ? id : `minecraft:${id}`;
                const matches = item.id === normalizedId;
                if (matches) {
                  console.log(`✓ Matched ${normalizedId} to ${item.id}`);
                }
                return matches;
              })
            );
            
            console.log(`Found ${tagItems.length} matching items in registry`);
            
            // Cache the tag with actual matched item IDs
            const matchedItemIds = tagItems.map(item => item.id);
            this.tagCache.set(tagName, matchedItemIds);
            console.log(`Cached tag ${tagName} with items:`, matchedItemIds);
            
            if (tagItems.length > 0) {
              return tagItems;
            }
          }
        } catch (error) {
          console.warn(`Error searching in ${path.basename(jarPath)}:`, error);
          // Continue to next JAR
          continue;
        }
      }
      
      console.log('Tag not found in any JAR');
      return [];
    } catch (error) {
      console.error('Failed to load tag from mod JARs:', error);
      return [];
    }
  }

  private resolveNestedTags(items: string[], processedTags: Set<string> = new Set()): string[] {
    const resolved: string[] = [];
    
    for (const item of items) {
      if (item.startsWith('#')) {
        // It's a nested tag
        const nestedTagName = item.substring(1);
        if (processedTags.has(nestedTagName)) {
          console.warn(`Circular tag reference detected: ${nestedTagName}`);
          continue;
        }
        
        processedTags.add(nestedTagName);
        const nestedItems = this.tagCache.get(nestedTagName);
        if (nestedItems) {
          resolved.push(...this.resolveNestedTags(nestedItems, processedTags));
        }
      } else {
        resolved.push(item);
      }
    }
    
    return resolved;
  }

  async preloadAllTags(instancePath: string): Promise<void> {
    console.log('Preloading tags for instance:', instancePath);
    this.instancePath = instancePath;
    // Tags will be loaded on-demand and cached
    // No need to preload all tags to avoid excessive loading
  }

  async loadAllTagsFromJars(): Promise<void> {
    if (!this.instancePath) return;
    
    try {
      console.log('=== Loading all tags from JAR files ===');
      const modsPath = path.join(this.instancePath, 'mods');
      const jarFiles: string[] = [];
      
      // Add Forge JAR
      const { app } = require('electron');
      const profileName = path.basename(this.instancePath);
      const modrinthVersionsPath = path.join(
        app.getPath('appData'),
        'ModrinthApp',
        'meta',
        'versions'
      );
      
      try {
        const versionDirs = await fs.readdir(modrinthVersionsPath);
        for (const dir of versionDirs) {
          if (dir.includes('forge')) {
            const forgePath = path.join(modrinthVersionsPath, dir);
            const forgeFiles = await fs.readdir(forgePath);
            for (const file of forgeFiles) {
              if (file.endsWith('.jar')) {
                jarFiles.push(path.join(forgePath, file));
              }
            }
          }
        }
      } catch (err) {
        console.warn('Could not read Modrinth versions folder:', err);
      }
      
      // Add mod JARs
      try {
        const files = await fs.readdir(modsPath);
        for (const file of files) {
          if (file.endsWith('.jar')) {
            jarFiles.push(path.join(modsPath, file));
          }
        }
      } catch (err) {
        console.warn('Could not read mods folder:', err);
      }
      
      console.log(`Found ${jarFiles.length} JAR files to scan for tags`);
      
      // Scan all JARs for tag files
      const AdmZip = require('adm-zip');
      let tagsLoaded = 0;
      
      for (const jarPath of jarFiles) {
        try {
          const zip = new AdmZip(jarPath);
          const entries = zip.getEntries();
          
          // Find all tag files in data/*/tags/items/*.json or data/*/tags/item/*.json
          const tagEntries = entries.filter((e: any) => 
            (e.entryName.includes('/tags/items/') || e.entryName.includes('/tags/item/')) &&
            e.entryName.endsWith('.json')
          );
          
          for (const tagEntry of tagEntries) {
            try {
              const tagData = tagEntry.getData().toString('utf-8');
              const tagJson = JSON.parse(tagData);
              const itemIds: string[] = tagJson.values || [];
              
              // Extract namespace and tag path from entry name
              // e.g., data/forge/tags/items/fruits/chorus_fruit.json
              const parts = tagEntry.entryName.split('/');
              const namespace = parts[1];
              const tagPathParts = parts.slice(4, -1); // Remove 'data', namespace, 'tags', 'items/item', and filename
              const filename = parts[parts.length - 1].replace('.json', '');
              const fullTagPath = [...tagPathParts, filename].join('/');
              const tagId = `${namespace}:${fullTagPath}`;
              
              // Store raw tag items (may include nested tags)
              this.tagCache.set(tagId, itemIds);
              tagsLoaded++;
              
              console.log(`📋 Loaded tag: ${tagId} with ${itemIds.length} entries`);
            } catch (err) {
              // Skip invalid tag files
            }
          }
        } catch (err) {
          // Skip invalid JARs
        }
      }
      
      console.log(`✓ Loaded ${tagsLoaded} tags from JAR files`);
    } catch (error) {
      console.error('Failed to load tags from JARs:', error);
    }
  }

  async loadCache(): Promise<boolean> {
    try {
      const cachePath = path.join(this.cacheDir, "registry.json");
      const data = await fs.readFile(cachePath, "utf-8");
      this.cache = JSON.parse(data);
      
      // Clean up any double-prefixed textures from old caches
      if (this.cache) {
        this.cache.items = this.cache.items.map(item => ({
          ...item,
          texture: item.texture?.replace(/^data:image\/png;base64,/, '') || null
        }));
        this.cache.blocks = this.cache.blocks.map(block => ({
          ...block,
          texture: block.texture?.replace(/^data:image\/png;base64,/, '') || null
        }));
      }
      
      // Check if cache is recent (less than 7 days old)
      const age = Date.now() - (this.cache?.lastUpdated || 0);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      return age < maxAge;
    } catch {
      return false;
    }
  }

  private async saveCache(): Promise<void> {
    if (!this.cache) return;

    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
      const cachePath = path.join(this.cacheDir, "registry.json");
      await fs.writeFile(cachePath, JSON.stringify(this.cache, null, 2), "utf-8");
    } catch (error) {
      console.error("Failed to save item registry cache:", error);
    }
  }

  async clearCache(): Promise<void> {
    try {
      const cachePath = path.join(this.cacheDir, "registry.json");
      await fs.unlink(cachePath);
      this.cache = null;
    } catch {}
  }

  async rebuildCache(modsFolder: string): Promise<void> {
    await this.clearCache();
    await this.buildItemRegistry(modsFolder);
    await this.saveCache();
  }

  async getItemsForTag(tag: string): Promise<ItemInfo[]> {
    try {
      // Ensure tag starts with # for cache lookup
      const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
      
      console.log(`Getting items for tag: ${normalizedTag}`);
      
      // Check if tag is in cache
      const cachedItemIds = this.tagCache.get(normalizedTag);
      if (!cachedItemIds) {
        console.log(`Tag ${normalizedTag} not found in cache`);
        return [];
      }
      
      console.log(`Tag has ${cachedItemIds.length} entries:`, cachedItemIds);
      
      // Resolve nested tags
      const resolvedIds = this.resolveNestedTags(cachedItemIds);
      console.log(`Resolved to ${resolvedIds.length} item IDs:`, resolvedIds);
      
      // Get all items from registry
      const allItems = await this.getAllItems();
      
      // Match items by ID
      const matchedItems = allItems.filter(item => {
        for (const id of resolvedIds) {
          if (typeof id !== 'string') continue;
          const normalizedId = id.includes(':') ? id : `minecraft:${id}`;
          if (item.id === normalizedId) {
            return true;
          }
        }
        return false;
      });
      
      console.log(`Matched ${matchedItems.length} items from registry`);
      return matchedItems;
    } catch (error) {
      console.error('Failed to get tag items:', error);
      return [];
    }
  }
}
