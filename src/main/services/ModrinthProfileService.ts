import Database from 'better-sqlite3';
import * as path from 'path';

interface ModrinthProfile {
  id: string;
  name: string;
  game_version: string;
  loader: string;
  loader_version: string;
  path: string;
}

export class ModrinthProfileService {
  private db: Database.Database | null = null;

  constructor(private modrinthAppPath: string) {}

  /**
   * Open the Modrinth app.db database
   */
  openDatabase(): boolean {
    try {
      const dbPath = path.join(this.modrinthAppPath, 'app.db');
      this.db = new Database(dbPath, { readonly: true });
      return true;
    } catch (error) {
      console.error('Failed to open Modrinth database:', error);
      return false;
    }
  }

  /**
   * Close the database connection
   */
  closeDatabase(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /**
   * Get profile information by instance path
   */
  getProfileByPath(instancePath: string): ModrinthProfile | null {
    if (!this.db) {
      if (!this.openDatabase()) {
        return null;
      }
    }

    try {
      // Modrinth app.db stores profiles in different tables depending on version
      // Try common table names and structures
      
      // First, try to find the table
      const tables = this.db!.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
      console.log('Found tables in app.db:', tables.map(t => t.name));

      // Try common profile table names
      const profileTables = ['profiles', 'instances', 'modpacks'];
      
      for (const tableName of profileTables) {
        if (tables.some(t => t.name === tableName)) {
          try {
            // Try to query the table
            const stmt = this.db!.prepare(`SELECT * FROM ${tableName} WHERE path = ?`);
            const profile = stmt.get(instancePath) as any;
            
            if (profile) {
              console.log(`Found profile in ${tableName}:`, profile);
              return this.normalizeProfile(profile);
            }
          } catch (error) {
            console.log(`Failed to query ${tableName}:`, error);
          }
        }
      }

      // If we couldn't find by exact path, try to find by partial path match
      for (const tableName of profileTables) {
        if (tables.some(t => t.name === tableName)) {
          try {
            const stmt = this.db!.prepare(`SELECT * FROM ${tableName}`);
            const allProfiles = stmt.all() as any[];
            
            for (const profile of allProfiles) {
              // Normalize the profile to get the full path
              const normalized = this.normalizeProfile(profile);
              if (!normalized) continue;
              
              // Check if the paths match (normalize separators and case)
              const profilePath = normalized.path.replace(/\\/g, '/').toLowerCase();
              const searchPath = instancePath.replace(/\\/g, '/').toLowerCase();
              
              if (profilePath === searchPath || 
                  profilePath.endsWith(searchPath) || 
                  searchPath.endsWith(profilePath)) {
                console.log(`Found matching profile in ${tableName}:`, profile);
                return normalized;
              }
            }
          } catch (error) {
            console.log(`Failed to query all ${tableName}:`, error);
          }
        }
      }

      return null;
    } catch (error) {
      console.error('Error querying Modrinth database:', error);
      return null;
    }
  }

  /**
   * Get all profiles
   */
  getAllProfiles(): ModrinthProfile[] {
    if (!this.db) {
      if (!this.openDatabase()) {
        return [];
      }
    }

    try {
      const tables = this.db!.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
      const profileTables = ['profiles', 'instances', 'modpacks'];
      
      for (const tableName of profileTables) {
        if (tables.some(t => t.name === tableName)) {
          try {
            const stmt = this.db!.prepare(`SELECT * FROM ${tableName}`);
            const profiles = stmt.all() as any[];
            return profiles.map(p => this.normalizeProfile(p)).filter(p => p !== null) as ModrinthProfile[];
          } catch (error) {
            console.log(`Failed to query ${tableName}:`, error);
          }
        }
      }

      return [];
    } catch (error) {
      console.error('Error getting all profiles:', error);
      return [];
    }
  }

  /**
   * Normalize different profile structures to a common format
   */
  private normalizeProfile(profile: any): ModrinthProfile | null {
    if (!profile) return null;

    try {
      // The database stores relative path, construct full path
      const profilePath = profile.path || profile.install_path || profile.directory || '';
      const fullPath = profilePath ? path.join(this.modrinthAppPath, 'profiles', profilePath) : '';
      
      return {
        id: profile.id || profile.profile_id || '',
        name: profile.name || profile.profile_name || '',
        game_version: profile.game_version || profile.mc_version || profile.minecraft_version || '',
        loader: profile.mod_loader || profile.loader || profile.loader_type || '',
        loader_version: profile.mod_loader_version || profile.loader_version || '',
        path: fullPath
      };
    } catch (error) {
      console.error('Error normalizing profile:', error);
      return null;
    }
  }

  /**
   * Debug: Print database schema
   */
  printSchema(): void {
    if (!this.db) {
      if (!this.openDatabase()) {
        return;
      }
    }

    try {
      const tables = this.db!.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[];
      
      console.log('\n=== Modrinth Database Schema ===');
      for (const table of tables) {
        console.log(`\nTable: ${table.name}`);
        try {
          const columns = this.db!.prepare(`PRAGMA table_info(${table.name})`).all();
          console.log('Columns:', columns);
          
          // Get a sample row
          const sample = this.db!.prepare(`SELECT * FROM ${table.name} LIMIT 1`).get();
          if (sample) {
            console.log('Sample row:', sample);
          }
        } catch (error) {
          console.log(`  Error reading table: ${error}`);
        }
      }
      console.log('\n================================\n');
    } catch (error) {
      console.error('Error printing schema:', error);
    }
  }
}
