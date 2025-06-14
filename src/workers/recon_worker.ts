import { createHash } from 'crypto';
import { DocumentStore } from '../core/document_store';
import { IdLinker } from '../core/id_linker';
import { EntityIndex } from '../models/entity_index';

interface ReconConfig {
  cse_api_key: string;
  fec_api_key: string;
  coverage_threshold: number;
  retry_max: number;
}

interface ScenarioInput {
  scenario_hash: string;
  coverage_needed: string[];
  optional_raw_docs?: string[];
}

interface ReconReport {
  coverage_ratio: number;
  fetch_latency: number;
  entities_found: string[];
  data_sources: string[];
}

export class ReconWorker {
  private documentStore: DocumentStore;
  private idLinker: IdLinker;
  private entityIndex: EntityIndex;
  private config: ReconConfig;

  constructor(
    documentStore: DocumentStore,
    entityIndex: EntityIndex,
    config: ReconConfig
  ) {
    this.documentStore = documentStore;
    this.entityIndex = entityIndex;
    this.idLinker = new IdLinker(entityIndex);
    this.config = config;
  }

  async processScenario(input: ScenarioInput): Promise<ReconReport> {
    console.log('Starting recon for scenario:', input.scenario_hash);
    const startTime = Date.now();

    try {
      // Track coverage and sources
      const coveredFields = new Set<string>();
      const dataSources = new Set<string>();
      const entitiesFound = new Set<string>();

      // Process any provided raw documents first
      if (input.optional_raw_docs) {
        for (const doc of input.optional_raw_docs) {
          await this.processRawDocument(doc, input.scenario_hash);
        }
      }

      // Generate ranked queries based on missing coverage
      const queries = await this.generateQueries(
        input.coverage_needed,
        Array.from(coveredFields)
      );

      // Execute queries through cascading sources
      for (const query of queries) {
        // Try CSE first
        try {
          const cseResults = await this.queryCSE(query);
          if (cseResults.length > 0) {
            dataSources.add('CSE');
            for (const result of cseResults) {
              const entities = await this.processRawDocument(
                result.content,
                input.scenario_hash,
                result.url
              );
              entities.forEach(e => entitiesFound.add(e));
            }
          }
        } catch (error) {
          console.error('CSE query failed:', error);
          
          // Fallback to FEC API
          try {
            const fecResults = await this.queryFEC(query);
            if (fecResults.length > 0) {
              dataSources.add('FEC');
              for (const result of fecResults) {
                const entities = await this.processRawDocument(
                  result.content,
                  input.scenario_hash,
                  result.url
                );
                entities.forEach(e => entitiesFound.add(e));
              }
            }
          } catch (fecError) {
            console.error('FEC query failed:', fecError);
          }
        }
      }

      // Calculate coverage ratio
      const coverageRatio = coveredFields.size / input.coverage_needed.length;

      // Prepare recon report
      const report: ReconReport = {
        coverage_ratio: coverageRatio,
        fetch_latency: Date.now() - startTime,
        entities_found: Array.from(entitiesFound),
        data_sources: Array.from(dataSources)
      };

      // Log completion status
      if (coverageRatio >= this.config.coverage_threshold) {
        console.log('ReconCompleted:', report);
      } else {
        console.log('ReconRetry: Insufficient coverage', report);
      }

      return report;

    } catch (error) {
      console.error('ReconFailed:', error);
      throw error;
    }
  }

  private async generateQueries(
    needed: string[],
    covered: string[]
  ): Promise<string[]> {
    const missing = needed.filter(field => !covered.includes(field));
    
    // Generate two types of queries per missing field:
    // 1. Precision-focused query
    // 2. Recall-focused query
    const queries: string[] = [];
    
    for (const field of missing) {
      // Precision query
      queries.push(`"${field}" site:gov`);
      
      // Recall query 
      queries.push(`intitle:(contract OR vendor) ${field}`);
    }

    return queries;
  }

  private async queryCSE(query: string): Promise<Array<{content: string, url: string}>> {
    if (!this.config.cse_api_key) {
      throw new Error('CSE API key not configured');
    }

    // TODO: Implement actual CSE API call
    // For now return empty results
    return [];
  }

  private async queryFEC(query: string): Promise<Array<{content: string, url: string}>> {
    if (!this.config.fec_api_key) {
      throw new Error('FEC API key not configured');
    }

    // TODO: Implement actual FEC API call
    // For now return empty results
    return [];
  }

  private async processRawDocument(
    content: string,
    scenarioHash: string,
    sourceUrl?: string
  ): Promise<string[]> {
    // Store document and get fingerprint
    const fingerprint = await this.documentStore.storeDocument(
      content,
      scenarioHash,
      sourceUrl
    );

    // Extract entities from content
    // TODO: Implement actual entity extraction
    // For now just return empty array
    return [];
  }
}
