import { createHash } from 'crypto';
import { EntityIndex } from '../models/entity_index';

interface EntityIdentifiers {
  ein?: string;
  cik?: string;
  uei?: string;
  fec_id?: string;
  lei?: string;
  duns?: string;
  [key: string]: string | undefined;
}

interface CanonicalEntity {
  entity_key: string;
  primary_id: string;
  alt_ids: string[];
  name_norm: string;
  jurisdiction?: string;
}

export class IdLinker {
  private entityIndex: EntityIndex;

  constructor(entityIndex: EntityIndex) {
    this.entityIndex = entityIndex;
  }

  async canonicalizeEntity(
    name: string,
    identifiers: EntityIdentifiers,
    jurisdiction?: string
  ): Promise<CanonicalEntity> {
    // Filter out null/undefined identifiers
    const filteredIds = this.filterValidIds(identifiers);
    
    // Generate entity key using sorted ID hash
    const entityKey = this.generateEntityKey(filteredIds);
    
    // Normalize name
    const nameNorm = this.normalizeName(name);
    
    // Determine primary ID (first available in priority order)
    const primaryId = this.selectPrimaryId(filteredIds);
    
    // Create alt_ids array
    const altIds = Object.entries(filteredIds)
      .filter(([key, value]) => value !== primaryId.split(':')[1])
      .map(([key, value]) => `${key}:${value}`);

    const canonicalEntity: CanonicalEntity = {
      entity_key: entityKey,
      primary_id: primaryId,
      alt_ids: altIds,
      name_norm: nameNorm,
      jurisdiction
    };

    // Update EntityIndex with single-writer semantics
    await this.updateEntityIndex(canonicalEntity);

    console.log('Entity index updated for:', nameNorm);
    return canonicalEntity;
  }

  private filterValidIds(identifiers: EntityIdentifiers): Record<string, string> {
    const filtered: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(identifiers)) {
      if (value && value.trim() !== '') {
        filtered[key] = value.trim();
      }
    }
    
    return filtered;
  }

  private generateEntityKey(identifiers: Record<string, string>): string {
    // Sort identifiers for consistent hashing
    const sortedIds = Object.entries(identifiers)
      .sort(([a], [b]) => a.localeCompare(b))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

    // Generate SHA256 hash of sorted JSON
    const jsonString = JSON.stringify(sortedIds);
    return createHash('sha256').update(jsonString).digest('hex');
  }

  private normalizeName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_')    // Replace spaces with underscores
      .trim();
  }

  private selectPrimaryId(identifiers: Record<string, string>): string {
    // Priority order for primary ID selection
    const priorityOrder = ['ein', 'cik', 'uei', 'fec_id', 'lei', 'duns'];
    
    for (const idType of priorityOrder) {
      if (identifiers[idType]) {
        return `${idType}:${identifiers[idType]}`;
      }
    }
    
    // If no priority ID found, use first available
    const firstEntry = Object.entries(identifiers)[0];
    return firstEntry ? `${firstEntry[0]}:${firstEntry[1]}` : 'unknown:unknown';
  }

  private async updateEntityIndex(entity: CanonicalEntity): Promise<void> {
    try {
      // Single-writer semantics: check if entity_key already exists
      const existing = await this.entityIndex.getEntity(entity.entity_key);
      
      if (existing) {
        // Update existing entity
        await this.entityIndex.updateEntity(entity.entity_key, {
          primary_id: entity.primary_id,
          alt_ids: entity.alt_ids,
          name_norm: entity.name_norm,
          jurisdiction: entity.jurisdiction
        });
      } else {
        // Create new entity
        await this.entityIndex.createEntity(entity);
      }
    } catch (error) {
      console.error('Failed to update entity index:', error);
      throw new Error('indexing_failure');
    }
  }

  // Collision detection for deterministic entity_key generation
  async detectCollisions(entities: CanonicalEntity[]): Promise<string[]> {
    const collisions: string[] = [];
    const seenKeys = new Set<string>();

    for (const entity of entities) {
      if (seenKeys.has(entity.entity_key)) {
        collisions.push(entity.entity_key);
      } else {
        seenKeys.add(entity.entity_key);
      }
    }

    return collisions;
  }

  // Validate that 100% of IDs produce deterministic entity_key
  validateDeterministicKeys(entities: CanonicalEntity[]): boolean {
    const regeneratedKeys = entities.map(entity => {
      // Reconstruct identifiers from primary_id and alt_ids
      const identifiers: Record<string, string> = {};
      
      // Parse primary_id
      const [primaryType, primaryValue] = entity.primary_id.split(':');
      if (primaryType && primaryValue) {
        identifiers[primaryType] = primaryValue;
      }
      
      // Parse alt_ids
      entity.alt_ids.forEach(altId => {
        const [type, value] = altId.split(':');
        if (type && value) {
          identifiers[type] = value;
        }
      });
      
      return this.generateEntityKey(identifiers);
    });

    // Check if all regenerated keys match original keys
    return entities.every((entity, index) => 
      entity.entity_key === regeneratedKeys[index]
    );
  }
}
