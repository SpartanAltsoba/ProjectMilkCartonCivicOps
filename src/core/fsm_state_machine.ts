import { EventEmitter } from 'events';
import { ReconWorker } from '../workers/recon_worker';
import { CorrelationWorker } from '../workers/correlation_worker';
import { AnalystWorker } from '../workers/analyst_worker';
import { AdvisoryWorker } from '../workers/advisory_worker';

export type FSMState = 
  | 'INIT'
  | 'RECON'
  | 'CORRELATION' 
  | 'ANALYSIS'
  | 'ADVISORY'
  | 'COMPLETED'
  | 'ERROR';

export interface FSMTransition {
  from: FSMState;
  to: FSMState;
  on: 'success' | 'error';
}

export interface FSMContext {
  scenarioHash: string;
  currentState: FSMState;
  data: any;
  errors: Error[];
}

export class FSMStateMachine extends EventEmitter {
  private context: FSMContext;
  private transitions: FSMTransition[];
  
  // Workers
  private recon: ReconWorker;
  private correlation: CorrelationWorker;
  private analyst: AnalystWorker;
  private advisory: AdvisoryWorker;

  constructor() {
    super();
    
    // Initialize workers
    this.recon = new ReconWorker(
      'neo4j://localhost:7687',
      'neo4j',
      'password'
    );
    
    this.correlation = new CorrelationWorker(
      'neo4j://localhost:7687',
      'neo4j',
      'password'
    );
    
    this.analyst = new AnalystWorker(
      'neo4j://localhost:7687',
      'neo4j',
      'password'
    );
    
    this.advisory = new AdvisoryWorker(
      'neo4j://localhost:7687',
      'neo4j',
      'password'
    );

    // Define state transitions
    this.transitions = [
      { from: 'INIT', to: 'RECON', on: 'success' },
      { from: 'INIT', to: 'ERROR', on: 'error' },
      
      { from: 'RECON', to: 'CORRELATION', on: 'success' },
      { from: 'RECON', to: 'ERROR', on: 'error' },
      
      { from: 'CORRELATION', to: 'ANALYSIS', on: 'success' },
      { from: 'CORRELATION', to: 'ERROR', on: 'error' },
      
      { from: 'ANALYSIS', to: 'ADVISORY', on: 'success' },
      { from: 'ANALYSIS', to: 'ERROR', on: 'error' },
      
      { from: 'ADVISORY', to: 'COMPLETED', on: 'success' },
      { from: 'ADVISORY', to: 'ERROR', on: 'error' }
    ];

    // Initialize context
    this.context = {
      scenarioHash: '',
      currentState: 'INIT',
      data: {},
      errors: []
    };
  }

  async start(scenarioHash: string, initialData: any): Promise<void> {
    this.context.scenarioHash = scenarioHash;
    this.context.data = initialData;
    
    try {
      await this.transition('success');
    } catch (error) {
      await this.handleError(error as Error);
    }
  }

  private async transition(event: 'success' | 'error'): Promise<void> {
    const transition = this.transitions.find(t => 
      t.from === this.context.currentState && t.on === event
    );

    if (!transition) {
      throw new Error(`Invalid transition from ${this.context.currentState} on ${event}`);
    }

    const prevState = this.context.currentState;
    this.context.currentState = transition.to;

    this.emit('stateChange', {
      from: prevState,
      to: this.context.currentState,
      scenarioHash: this.context.scenarioHash
    });

    await this.executeState();
  }

  private async executeState(): Promise<void> {
    try {
      switch (this.context.currentState) {
        case 'RECON':
          const reconResult = await this.recon.processReconStage(
            this.context.scenarioHash,
            this.context.data
          );
          
          if (reconResult.status === 'success') {
            this.context.data = reconResult;
            await this.transition('success');
          } else {
            throw new Error('Recon stage failed');
          }
          break;

        case 'CORRELATION':
          const correlationResult = await this.correlation.processCorrelationStage(
            this.context.data.entities
          );
          
          if (correlationResult.status === 'success' || correlationResult.status === 'partial') {
            this.context.data = correlationResult;
            await this.transition('success');
          } else {
            throw new Error('Correlation stage failed');
          }
          break;

        case 'ANALYSIS':
          const analysisResult = await this.analyst.processAnalysisStage(
            this.context.data
          );
          
          this.context.data = analysisResult;
          await this.transition('success');
          break;

        case 'ADVISORY':
          const advisoryResult = await this.advisory.processAdvisoryStage(
            this.context.data,
            { 
              state: this.context.data.jurisdiction || 'unknown',
              user_type: 'parent'
            }
          );
          
          this.context.data = advisoryResult;
          await this.transition('success');
          break;

        case 'COMPLETED':
          this.emit('completed', {
            scenarioHash: this.context.scenarioHash,
            data: this.context.data
          });
          break;

        case 'ERROR':
          this.emit('error', {
            scenarioHash: this.context.scenarioHash,
            errors: this.context.errors
          });
          break;
      }
    } catch (error) {
      await this.handleError(error as Error);
    }
  }

  private async handleError(error: Error): Promise<void> {
    this.context.errors.push(error);
    await this.transition('error');
  }

  getContext(): FSMContext {
    return { ...this.context };
  }

  async close(): Promise<void> {
    await Promise.all([
      this.recon.close(),
      this.correlation.close(),
      this.analyst.close(),
      this.advisory.close()
    ]);
  }
}
