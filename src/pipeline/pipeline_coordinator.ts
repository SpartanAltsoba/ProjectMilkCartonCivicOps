import { ReconWorker } from '../workers/recon_worker';
import { CorrelationWorker } from '../workers/correlation_worker';
import { AnalystWorker } from '../workers/analyst_worker';
import { AdvisoryWorker } from '../workers/advisory_worker';
import crypto from 'crypto';

interface PipelineConfig {
  neo4j: {
    uri: string;
    username: string;
    password: string;
  };
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
  };
}

interface PipelineResult {
  scenario_hash: string;
  status: 'COMPLETED' | 'FAILED';
  stages: {
    recon: {
      status: string;
      entities_processed: number;
      coverage_percentage: number;
    };
    correlation: {
      status: string;
      conflicts_resolved: number;
      loops_detected: number;
    };
    analysis: {
      status: string;
      violations_flagged: number;
      ml_confidence: number;
    };
    advisory: {
      status: string;
      coas_generated: number;
      template_coverage: number;
    };
  };
  processing_time_ms: number;
  error?: string;
}

export class PipelineCoordinator {
  private reconWorker: ReconWorker;
  private correlationWorker: CorrelationWorker;
  private analystWorker: AnalystWorker;
  private advisoryWorker: AdvisoryWorker;
  private config: PipelineConfig;

  constructor(config: PipelineConfig) {
    this.config = config;
    this.reconWorker = new ReconWorker(
      config.neo4j.uri,
      config.neo4j.username,
      config.neo4j.password
    );
    this.correlationWorker = new CorrelationWorker(
      config.neo4j.uri,
      config.neo4j.username,
      config.neo4j.password
    );
    this.analystWorker = new AnalystWorker(
      config.neo4j.uri,
      config.neo4j.username,
      config.neo4j.password
    );
    this.advisoryWorker = new AdvisoryWorker(
      config.neo4j.uri,
      config.neo4j.username,
      config.neo4j.password
    );
  }

  async initialize(): Promise<void> {
    await Promise.all([
      this.reconWorker.initialize(),
      this.correlationWorker.initialize(),
      this.analystWorker.initialize(),
      this.advisoryWorker.initialize()
    ]);
  }

  /**
   * Execute the full pipeline with retry logic
   */
  async executePipeline(inputData: any[]): Promise<PipelineResult> {
    const startTime = Date.now();
    const scenarioHash = this.generateScenarioHash();

    try {
      // Stage 1: Recon
      const reconResult = await this.executeWithRetry(
        async () => this.reconWorker.processReconStage(scenarioHash, inputData),
        'Recon'
      );

      if (reconResult.status !== 'COMPLETED') {
        throw new Error(`Recon stage failed: ${reconResult.status}`);
      }

      // Stage 2: Correlation
      const correlationResult = await this.executeWithRetry(
        async () => {
          const neo4jStore = (this.reconWorker as any).neo4jStore;
          const entities = await Promise.all(
            inputData.map(async (item: any) => {
              const vendorEntity = await neo4jStore.findEntityByIdentifier(
                (this.reconWorker as any).extractVendorIdentifiers(item.Vendor).ein
              );
              return vendorEntity;
            }).filter(Boolean)
          );
          return this.correlationWorker.processCorrelationStage(scenarioHash, entities);
        },
        'Correlation'
      );

      if (correlationResult.status !== 'COMPLETED') {
        throw new Error(`Correlation stage failed: ${correlationResult.status}`);
      }

      // Stage 3: Analysis
      const analysisResult = await this.executeWithRetry(
        async () => this.analystWorker.processAnalysisStage(scenarioHash),
        'Analysis'
      );

      if (analysisResult.status !== 'COMPLETED') {
        throw new Error(`Analysis stage failed: ${analysisResult.status}`);
      }

      // Stage 4: Advisory
      const advisoryResult = await this.executeWithRetry(
        async () => this.advisoryWorker.processAdvisoryStage(
          scenarioHash,
          analysisResult.violations_flagged
        ),
        'Advisory'
      );

      if (advisoryResult.status !== 'COMPLETED') {
        throw new Error(`Advisory stage failed: ${advisoryResult.status}`);
      }

      return {
        scenario_hash: scenarioHash,
        status: 'COMPLETED',
        stages: {
          recon: {
            status: reconResult.status,
            entities_processed: reconResult.entities_processed,
            coverage_percentage: reconResult.coverage_percentage
          },
          correlation: {
            status: correlationResult.status,
            conflicts_resolved: correlationResult.conflicts_resolved,
            loops_detected: correlationResult.loops_detected
          },
          analysis: {
            status: analysisResult.status,
            violations_flagged: analysisResult.violations_flagged.length,
            ml_confidence: analysisResult.ml_confidence
          },
          advisory: {
            status: advisoryResult.status,
            coas_generated: advisoryResult.coas_generated.length,
            template_coverage: advisoryResult.template_coverage
          }
        },
        processing_time_ms: Date.now() - startTime
      };

    } catch (error) {
      console.error('Pipeline execution failed:', error);
      return {
        scenario_hash: scenarioHash,
        status: 'FAILED',
        stages: {
          recon: {
            status: 'FAILED',
            entities_processed: 0,
            coverage_percentage: 0
          },
          correlation: {
            status: 'FAILED',
            conflicts_resolved: 0,
            loops_detected: 0
          },
          analysis: {
            status: 'FAILED',
            violations_flagged: 0,
            ml_confidence: 0
          },
          advisory: {
            status: 'FAILED',
            coas_generated: 0,
            template_coverage: 0
          }
        },
        processing_time_ms: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Execute a stage with retry logic
   */
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    stageName: string
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= this.config.retryConfig.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`${stageName} stage attempt ${attempt} failed:`, error);
        
        if (attempt < this.config.retryConfig.maxRetries) {
          await this.delay(this.config.retryConfig.retryDelayMs);
        }
      }
    }

    throw lastError || new Error(`${stageName} stage failed after all retries`);
  }

  private generateScenarioHash(): string {
    return crypto
      .createHash('sha256')
      .update(`scenario_${Date.now()}_${Math.random()}`)
      .digest('hex');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async close(): Promise<void> {
    await Promise.all([
      this.reconWorker.close(),
      this.correlationWorker.close(),
      this.analystWorker.close(),
      this.advisoryWorker.close()
    ]);
  }
}
