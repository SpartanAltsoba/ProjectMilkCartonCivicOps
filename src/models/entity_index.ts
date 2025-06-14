import { promises as fs } from 'fs';
import path from 'path';
import { createHash } from 'crypto';

interface EntityData {
  entity_key: string;
  primary_id: string;
  alt_ids: string[];
  name_norm: string;
  jurisdiction?: string;
}

export class EntityIndex {
  private indexPath: string;
  private lockPath: string;
  private lockTimeout = 5000; // 5 seconds

  constructor(baseDir: string = process.cwd()) {
    this.indexPath = path.join(baseDir, 'data', 'entity_index.json');
    this.lockPath = path.join(baseDir, 'data', 'entity_index.lock');
    this.initializeIndex();
  }

  private async initializeIndex(): Promise<void> {
    try {
      // Create data directory if it doesn't exist
      await fs.mkdir(path.dirname(this.indexPath), { recursive: true });

      // Initialize index file if it doesn't exist
      try {
        await fs.access(this.indexPath);
      } catch {
        await fs.writeFile(this.indexPath, JSON.stringify({}));
      }
    } catch (error) {
      console.error('Failed to initialize entity index:', error);
      throw error;
    }
  }

  private async acquireLock(): Promise<void> {
    const startTime = Date.now();
    
    while (true) {
      try {
        // Try to create lock file
        await fs.writeFile(
          this.lockPath,
          JSON.stringify({ timestamp: Date.now() }),
          { flag: 'wx' } // Fail if file exists
        );
        return;
      } catch (error) {
        // Check if lock is stale
        try {
          const lockData = JSON.parse(
            await fs.readFile(this.lockPath, 'utf-8')
          );
          
          if (Date.now() - lockData.timestamp > this.lockTimeout) {
            // Lock is stale, remove it
            await fs.unlink(this.lockPath);
            continue;
          }
        } catch {
          // Lock file is corrupted or was just removed, try again
          continue;
        }

        // Check if we've waited too long
        if (Date.now() - startTime > this.lockTimeout) {
          throw new Error('Failed to acquire lock: timeout');
        }

        // Wait a bit before retrying
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  private async releaseLock(): Promise<void> {
    try {
      await fs.unlink(this.lockPath);
    } catch (error) {
      console.error('Failed to release lock:', error);
    }
  }

  async getEntity(entityKey: string): Promise<EntityData | null> {
    try {
      const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
      return index[entityKey] || null;
    } catch (error) {
      console.error('Failed to read entity:', error);
      return null;
    }
  }

  async updateEntity(
    entityKey: string,
    data: Omit<EntityData, 'entity_key'>
  ): Promise<void> {
    await this.acquireLock();
    
    try {
      const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
      
      if (!index[entityKey]) {
        throw new Error(`Entity ${entityKey} not found`);
      }

      index[entityKey] = {
        entity_key: entityKey,
        ...data
      };

      await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
    } finally {
      await this.releaseLock();
    }
  }

  async createEntity(entity: EntityData): Promise<void> {
    await this.acquireLock();
    
    try {
      const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
      
      if (index[entity.entity_key]) {
        throw new Error(`Entity ${entity.entity_key} already exists`);
      }

      index[entity.entity_key] = entity;
      await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
    } finally {
      await this.releaseLock();
    }
  }

  async searchByJurisdiction(jurisdiction: string): Promise<EntityData[]> {
    try {
      const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
      return Object.values(index).filter((entity): entity is EntityData => {
        return Boolean(entity && 
               typeof entity === 'object' &&
               'jurisdiction' in entity &&
               (entity as EntityData).jurisdiction === jurisdiction);
      });
    } catch (error) {
      console.error('Failed to search by jurisdiction:', error);
      return [];
    }
  }

  async searchByName(namePattern: string): Promise<EntityData[]> {
    try {
      const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
      const regex = new RegExp(namePattern, 'i');
      
      return Object.values(index).filter((entity): entity is EntityData => {
        return Boolean(entity &&
               typeof entity === 'object' &&
               'name_norm' in entity &&
               regex.test((entity as EntityData).name_norm));
      });
    } catch (error) {
      console.error('Failed to search by name:', error);
      return [];
    }
  }

  async searchByAltId(idType: string, value: string): Promise<EntityData[]> {
    try {
      const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
      const searchId = `${idType}:${value}`;
      
      return Object.values(index).filter((entity): entity is EntityData => {
        return Boolean(entity &&
               typeof entity === 'object' &&
               'primary_id' in entity &&
               'alt_ids' in entity &&
               Array.isArray((entity as EntityData).alt_ids) &&
               ((entity as EntityData).primary_id === searchId || (entity as EntityData).alt_ids.includes(searchId)));
      });
    } catch (error) {
      console.error('Failed to search by alt ID:', error);
      return [];
    }
  }

  async deleteEntity(entityKey: string): Promise<void> {
    await this.acquireLock();
    
    try {
      const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
      
      if (!index[entityKey]) {
        throw new Error(`Entity ${entityKey} not found`);
      }

      delete index[entityKey];
      await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
    } finally {
      await this.releaseLock();
    }
  }

  async getAllEntities(): Promise<EntityData[]> {
    try {
      const index = JSON.parse(await fs.readFile(this.indexPath, 'utf-8'));
      return Object.values(index) as EntityData[];
    } catch (error) {
      console.error('Failed to get all entities:', error);
      return [];
    }
  }
}
