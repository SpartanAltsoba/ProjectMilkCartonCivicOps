import { FSMStateMachine } from '../core/fsm_state_machine';
import { ReconWorker } from '../workers/recon_worker';
import { CorrelationWorker } from '../workers/correlation_worker';
import { AnalystWorker } from '../workers/analyst_worker';
import { AdvisoryWorker } from '../workers/advisory_worker';
import { createHash } from 'crypto';

export interface UserQuery {
  state: string;
  county?: string;
  timeframe?: {
    start: string;
    end: string;
  };
}

export interface ContractorInfo {
  name: string;
  issues?: string[];
  money?: string;
  timeline?: string;
  status: 'active' | 'terminated' | 'under_investigation';
}

export interface ActionableResult {
  contractors: ContractorInfo[];
  actionItems: string[];
  resources: Array<{
    name: string;
    phone?: string;
    website?: string;
  }>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class UserInterface {
  private fsm: FSMStateMachine;
  private recon: ReconWorker;
  private correlation: CorrelationWorker;
  private analyst: AnalystWorker;
  private advisory: AdvisoryWorker;

  constructor() {
    // Initialize workers with proper configuration
    this.recon = new ReconWorker(
      'neo4j://localhost:7687',
      'neo4j',
      'password',
      { skipNeo4j: true }
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

    // Set up FSM pipeline
    this.fsm = new FSMStateMachine();
  }

  /**
   * Main entry point - user types state/county, gets actionable results
   */
  async processUserQuery(query: UserQuery): Promise<ActionableResult> {
    // Generate scenario hash for tracking
    const scenarioHash = this.generateScenarioHash(query);
    
    console.log(`🎯 Processing query for ${query.state}${query.county ? ', ' + query.county : ''}`);

    // Stage 1: RECON - Find contractors & issues automatically
    const reconData = await this.runReconStage(scenarioHash, query);
    
    // Stage 2: CORRELATION - Connect entities and relationships
    const graphData = await this.runCorrelationStage(reconData.entities);
    
    // Stage 3: ANALYSIS - Identify violations and risks
    const analysis = await this.runAnalysisStage(graphData);
    
    // Stage 4: ADVISORY - Generate actionable recommendations
    const advisory = await this.runAdvisoryStage(analysis, query);

    // Return user-friendly format
    return this.formatResults(analysis, advisory);
  }

  private generateScenarioHash(query: UserQuery): string {
    const payload = JSON.stringify({
      state: query.state,
      county: query.county || 'statewide',
      timestamp: new Date().toISOString().split('T')[0] // Daily uniqueness
    });
    
    return createHash('sha256').update(payload).digest('hex').substring(0, 16);
  }

  private async runReconStage(scenarioHash: string, query: UserQuery) {
    console.log('🔍 RECON: Searching for contractors and issues...');
    
    // Create search context based on user input
    const searchContext = [{
      'State/Territory': query.state,
      'System': 'Child Welfare Services',
      'Scope': query.county || 'Statewide',
      'Query_Type': 'contractor_investigation'
    }];

    return await this.recon.processReconStage(scenarioHash, searchContext);
  }

  private async runCorrelationStage(entities: any[]) {
    console.log('🔗 CORRELATION: Connecting relationships...');
    
    return await this.correlation.processCorrelationStage(entities);
  }

  private async runAnalysisStage(graphData: any) {
    console.log('⚖️ ANALYSIS: Identifying violations and risks...');
    
    return await this.analyst.processAnalysisStage(graphData);
  }

  private async runAdvisoryStage(analysis: any, query: UserQuery) {
    console.log('📋 ADVISORY: Generating action items...');
    
    return await this.advisory.processAdvisoryStage(analysis, {
      state: query.state,
      county: query.county,
      user_type: 'parent'
    });
  }

  private formatResults(analysis: any, advisory: any): ActionableResult {
    // Extract contractor information
    const contractors: ContractorInfo[] = analysis.entities
      .filter((e: any) => e.alt_ids.includes('type:vendor'))
      .map((vendor: any) => {
        const issues = [];
        const moneyInfo = vendor.alt_ids.find((id: string) => id.startsWith('contract_value:'));
        
        // Check for known issues
        if (vendor.alt_ids.includes('status:terminated')) issues.push('Contract terminated');
        if (vendor.alt_ids.includes('status:investigation')) issues.push('Under investigation');
        if (vendor.alt_ids.includes('issue:financial')) issues.push('Financial problems');
        if (vendor.alt_ids.includes('issue:performance')) issues.push('Performance issues');

        return {
          name: vendor.name_norm,
          issues: issues.length > 0 ? issues : undefined,
          money: moneyInfo ? moneyInfo.split(':')[1] : undefined,
          timeline: vendor.alt_ids.find((id: string) => id.startsWith('timeline:'))?.split(':')[1],
          status: vendor.alt_ids.includes('status:terminated') ? 'terminated' : 
                  vendor.alt_ids.includes('status:investigation') ? 'under_investigation' : 'active'
        };
      });

    // Generate action items based on findings
    const actionItems = this.generateActionItems(contractors, advisory);

    // Determine risk level
    const riskLevel = this.calculateRiskLevel(contractors, analysis);

    return {
      contractors,
      actionItems,
      resources: this.getStateResources(advisory.context?.state),
      riskLevel
    };
  }

  private generateActionItems(contractors: ContractorInfo[], advisory: any): string[] {
    const items = [];

    // Check for terminated contracts
    const terminated = contractors.filter(c => c.status === 'terminated');
    if (terminated.length > 0) {
      items.push(`🚨 ${terminated.length} contractor(s) had terminated contracts - get records from BEFORE and AFTER termination dates`);
      items.push('📞 Contact your state child advocate immediately');
    }

    // Check for ongoing investigations
    const investigating = contractors.filter(c => c.status === 'under_investigation');
    if (investigating.length > 0) {
      items.push(`⚠️ ${investigating.length} contractor(s) under investigation - document any service gaps`);
    }

    // General action items
    items.push('📋 Request complete case file from your caseworker');
    items.push('📝 Document all interactions with contractors and agencies');
    items.push('🏛️ Know your rights - request a copy of your state\'s child welfare policies');

    return items;
  }

  private calculateRiskLevel(contractors: ContractorInfo[], analysis: any): 'low' | 'medium' | 'high' | 'critical' {
    let riskScore = 0;

    // Terminated contracts = high risk
    const terminated = contractors.filter(c => c.status === 'terminated').length;
    riskScore += terminated * 3;

    // Under investigation = medium risk
    const investigating = contractors.filter(c => c.status === 'under_investigation').length;
    riskScore += investigating * 2;

    // Financial issues = medium risk
    const financial = contractors.filter(c => c.issues?.includes('Financial problems')).length;
    riskScore += financial * 2;

    if (riskScore >= 6) return 'critical';
    if (riskScore >= 4) return 'high';
    if (riskScore >= 2) return 'medium';
    return 'low';
  }

  private getStateResources(state?: string) {
    // Default resources - could be expanded per state
    return [
      {
        name: 'National Child Abuse Hotline',
        phone: '1-800-4-A-CHILD (1-800-422-4453)',
        website: 'https://www.childhelp.org/hotline/'
      },
      {
        name: 'Children\'s Rights Organization',
        website: 'https://www.childrensrights.org/',
        phone: '212-683-2210'
      },
      {
        name: 'State Child Advocate',
        phone: 'Contact your state government for local number'
      }
    ];
  }

  async close(): Promise<void> {
    await this.recon.close();
    // Close other workers as needed
  }
}
