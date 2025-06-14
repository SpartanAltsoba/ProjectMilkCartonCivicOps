import { Neo4jEntityStore } from '../models/neo4j_entity_store';
import { OpenAIService } from '../services/openai_service';

const ADVISORY_CONFIG = {
  primary_model: "gpt-4o-2024-05-13",
  tasks: [
    "course of action generation",
    "persuasive writing with role-specific tone",
    "template rendering"
  ],
  fallback_model: "gpt-3.5-turbo-0125",
  imagery_service: {
    model: "dall-e-3",
    purpose: "illustrations or visual evidence if needed"
  }
};

export interface AdvisoryContext {
  state: string;
  county?: string;
  user_type: 'parent' | 'advocate' | 'attorney';
}

export interface AdvisoryResult {
  status: 'success' | 'partial' | 'failed';
  recommendations: string[];
  action_items: string[];
  resources: Array<{
    name: string;
    type: 'legal' | 'advocacy' | 'support';
    contact?: {
      phone?: string;
      email?: string;
      website?: string;
    };
    jurisdiction: string;
  }>;
  context?: AdvisoryContext;
  errors?: string[];
}

export class AdvisoryWorker {
  private neo4j: Neo4jEntityStore | null = null;
  private openai: OpenAIService;

  constructor(
    uri?: string,
    username?: string,
    password?: string
  ) {
    if (uri && username && password) {
      this.neo4j = new Neo4jEntityStore(uri, username, password);
    }
    this.openai = OpenAIService.getInstance();
  }

  async processAdvisoryStage(
    analysis: any,
    context: AdvisoryContext
  ): Promise<AdvisoryResult> {
    try {
      // Generate recommendations based on analysis
      const recommendations = await this.generateRecommendations(analysis);

      // Create action items
      const actionItems = this.createActionItems(analysis, context);

      // Find relevant resources
      const resources = await this.findResources(context);

      return {
        status: 'success',
        recommendations,
        action_items: actionItems,
        resources,
        context
      };

    } catch (error) {
      console.error('Advisory stage error:', error);
      return {
        status: 'failed',
        recommendations: [],
        action_items: [],
        resources: [],
        errors: [(error as Error).message]
      };
    }
  }

  private async generateRecommendations(analysis: any): Promise<string[]> {
    try {
      const systemPrompt = `You are an expert child welfare advisor specializing in contractor oversight and family advocacy. 
      Generate specific, actionable recommendations based on the analysis provided.
      Focus on protecting children's interests while ensuring accountability.`;

      const analysisPrompt = `Based on this child welfare contractor analysis:
      ${JSON.stringify(analysis, null, 2)}

      Generate a prioritized list of specific recommendations. Consider:
      1. Severity of issues (safety, financial, performance, compliance)
      2. Risk level and urgency
      3. Required documentation and evidence
      4. Oversight agency involvement
      5. Family advocacy steps

      Format each recommendation as a clear, actionable statement.`;

      const recommendationsResult = await this.openai.generateCompletion(
        ADVISORY_CONFIG.primary_model,
        analysisPrompt,
        systemPrompt
      );

      // Parse and validate recommendations
      let recommendations = recommendationsResult
        .split('\n')
        .filter(r => r.trim())
        .map(r => r.replace(/^\d+\.\s*/, '')); // Remove leading numbers

      // Fallback to rule-based recommendations if needed
      if (recommendations.length === 0) {
        recommendations = this.generateBasicRecommendations(analysis);
      }

      return [...new Set(recommendations)]; // Remove duplicates
    } catch (error) {
      console.error('Recommendation generation error:', error);
      return this.generateBasicRecommendations(analysis);
    }
  }

  private generateBasicRecommendations(analysis: any): string[] {
    const recommendations: string[] = [];

    // Check for critical issues
    if (analysis.overall_risk > 0.7) {
      recommendations.push(
        'URGENT: Multiple serious issues detected - immediate action recommended'
      );
    }

    // Add entity-specific recommendations
    analysis.entities.forEach((entity: any) => {
      if (entity.flags?.length > 0) {
        entity.flags.forEach((flag: any) => {
          switch (flag.type) {
            case 'financial':
              recommendations.push(
                `Review all financial records related to ${entity.name}`
              );
              break;
            case 'performance':
              recommendations.push(
                `Document service gaps or issues with ${entity.name}`
              );
              break;
            case 'safety':
              recommendations.push(
                `URGENT: Safety concerns identified with ${entity.name} - consider immediate intervention`
              );
              break;
            case 'compliance':
              recommendations.push(
                `Request compliance history for ${entity.name} from oversight agency`
              );
              break;
          }
        });
      }
    });

    return [...new Set(recommendations)]; // Remove duplicates
  }

  private createActionItems(
    analysis: any,
    context: AdvisoryContext
  ): string[] {
    const items: string[] = [];

    // Basic action items for all cases
    items.push('Request complete case file from your caseworker');
    items.push('Document all interactions with contractors and agencies');
    items.push('Keep a detailed timeline of services received or missed');

    // Add context-specific items
    if (context.user_type === 'parent') {
      items.push('Know your rights - request a copy of your state\'s policies');
      items.push('Consider requesting a case review if services are inadequate');
    }

    if (context.user_type === 'advocate' || context.user_type === 'attorney') {
      items.push('Review contractor performance metrics and compliance history');
      items.push('Check for pattern of similar issues across cases');
    }

    // Add risk-based items
    if (analysis.overall_risk > 0.5) {
      items.push('Contact state oversight agency for contractor history');
      items.push('Consider filing formal complaint if issues persist');
    }

    return items;
  }

  private async findResources(context: AdvisoryContext): Promise<Array<{
    name: string;
    type: 'legal' | 'advocacy' | 'support';
    contact?: {
      phone?: string;
      email?: string;
      website?: string;
    };
    jurisdiction: string;
  }>> {
    // Start with national resources
    const resources: Array<{
      name: string;
      type: 'legal' | 'advocacy' | 'support';
      contact?: {
        phone?: string;
        email?: string;
        website?: string;
      };
      jurisdiction: string;
    }> = [
      {
        name: 'National Child Abuse Hotline',
        type: 'support',
        contact: {
          phone: '1-800-4-A-CHILD',
          website: 'https://www.childhelp.org/hotline/'
        },
        jurisdiction: 'national'
      },
      {
        name: 'Child Welfare Information Gateway',
        type: 'support',
        contact: {
          website: 'https://www.childwelfare.gov'
        },
        jurisdiction: 'national'
      }
    ];

    // Add state-specific resources
    if (context.state) {
      const stateResources = await this.getStateResources(context.state);
      resources.push(...stateResources);
    }

    return resources;
  }

  private async getStateResources(state: string): Promise<Array<{
    name: string;
    type: 'legal' | 'advocacy' | 'support';
    contact?: {
      phone?: string;
      email?: string;
      website?: string;
    };
    jurisdiction: string;
  }>> {
    // This could be expanded to fetch from a database
    return [
      {
        name: `${state} Child Welfare Agency`,
        type: 'support',
        jurisdiction: state.toLowerCase()
      },
      {
        name: `${state} Child Advocate Office`,
        type: 'advocacy',
        jurisdiction: state.toLowerCase()
      },
      {
        name: `${state} Legal Aid`,
        type: 'legal',
        jurisdiction: state.toLowerCase()
      }
    ];
  }

  async close(): Promise<void> {
    if (this.neo4j) {
      await this.neo4j.close();
    }
  }
}
