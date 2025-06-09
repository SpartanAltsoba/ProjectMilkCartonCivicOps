import { logger } from "../../lib/logger";
import { SearchResult, SearchResponse } from "../../types/search";
import { runLegalSearchAgent, searchChildWelfareLaw } from "./runLegalSearchAgent";
import { runPolicySearchAgent, searchChildWelfarePolicy, searchFederalRegulations } from "./runPolicySearchAgent";
import { runSearchAgent } from "./runSearchAgent";

interface IntegrationConfig {
  location: string;
  scenario?: string;
  includeAgents?: string[];
}

interface DecisionGraphInput {
  source: string;
  content: string;
  title: string;
  type: "legal_authority" | "policy_document" | "context";
  jurisdiction?: string;
  relevance: number;
}

interface FoiaInput {
  url: string;
  description: string;
  title: string;
  source: "legal" | "policy";
  documentType: string;
}

interface NgoMappingInput {
  source: string;
  content: string;
  title: string;
  type: "ngo_reference";
  location: string;
}

interface ScoringInput {
  source: string;
  content: string;
  title: string;
  type: "scoring_context";
  weight: number;
  location: string;
}

interface IntegratedSearchResponse {
  searchResults: {
    general: SearchResponse;
    legal: SearchResponse;
    policy: SearchResponse;
    federal: SearchResponse;
  };
  agentInputs: {
    decisionGraph: DecisionGraphInput[];
    foia: FoiaInput[];
    ngoMapping: NgoMappingInput[];
    scoring: ScoringInput[];
  };
  metadata: {
    location: string;
    scenario?: string;
    timestamp: string;
    totalResults: number;
  };
}

/**
 * Comprehensive search integration that feeds all other AI agents
 */
export class SearchIntegration {
  private config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  /**
   * Execute comprehensive search and prepare data for all agents
   */
  async executeIntegratedSearch(): Promise<IntegratedSearchResponse> {
    try {
      logger.info("Starting integrated search", {
        location: this.config.location,
        scenario: this.config.scenario,
      });

      // Execute all search types in parallel
      const [generalResults, legalResults, policyResults, federalResults] = await Promise.all([
        this.executeGeneralSearch(),
        this.executeLegalSearch(),
        this.executePolicySearch(),
        this.executeFederalSearch(),
      ]);

      // Prepare inputs for each agent
      const agentInputs = {
        decisionGraph: this.prepareDecisionGraphInputs(generalResults, legalResults, policyResults),
        foia: this.prepareFoiaInputs(generalResults, legalResults, policyResults),
        ngoMapping: this.prepareNgoMappingInputs(generalResults, policyResults),
        scoring: this.prepareScoringInputs(generalResults, legalResults, policyResults),
      };

      const response: IntegratedSearchResponse = {
        searchResults: {
          general: generalResults,
          legal: legalResults,
          policy: policyResults,
          federal: federalResults,
        },
        agentInputs,
        metadata: {
          location: this.config.location,
          scenario: this.config.scenario,
          timestamp: new Date().toISOString(),
          totalResults: this.getTotalResults(generalResults, legalResults, policyResults, federalResults),
        },
      };

      logger.info("Integrated search completed", {
        totalResults: response.metadata.totalResults,
        agentInputCounts: {
          decisionGraph: agentInputs.decisionGraph.length,
          foia: agentInputs.foia.length,
          ngoMapping: agentInputs.ngoMapping.length,
          scoring: agentInputs.scoring.length,
        },
      });

      return response;

    } catch (error) {
      logger.error("Integrated search failed", {
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Share results with decision graph agent
   */
  async shareWithDecisionGraph(results: IntegratedSearchResponse): Promise<void> {
    try {
      const decisionGraphData = {
        location: this.config.location,
        scenario: this.config.scenario,
        legalAuthorities: results.agentInputs.decisionGraph.filter(item => item.type === "legal_authority"),
        policyReferences: results.agentInputs.decisionGraph.filter(item => item.type === "policy_document"),
        stakeholders: this.extractStakeholders(results.searchResults.general),
        jurisdiction: this.config.location,
      };

      logger.info("Sharing integrated search results with decision graph agent", {
        dataPoints: Object.keys(decisionGraphData).length,
      });

      // TODO: Implement actual sharing with decision graph agent
      // await runDecisionGraphAgent(decisionGraphData);

    } catch (error) {
      logger.error("Failed to share with decision graph agent", { error });
      throw error;
    }
  }

  /**
   * Share results with FOIA agent
   */
  async shareWithFoiaAgent(results: IntegratedSearchResponse): Promise<void> {
    try {
      const foiaData = {
        jurisdiction: this.config.location,
        requestType: "child_welfare",
        targetAgencies: this.extractAgencies(results.searchResults.general),
        legalBasis: results.agentInputs.foia.filter(item => item.source === "legal"),
        policyBasis: results.agentInputs.foia.filter(item => item.source === "policy"),
      };

      logger.info("Sharing integrated search results with FOIA agent", {
        agencies: foiaData.targetAgencies.length,
        legalBasis: foiaData.legalBasis.length,
      });

      // TODO: Implement actual sharing with FOIA agent
      // await runFoiaAgent(foiaData);

    } catch (error) {
      logger.error("Failed to share with FOIA agent", { error });
      throw error;
    }
  }

  private async executeGeneralSearch(): Promise<SearchResponse> {
    const query = this.config.scenario 
      ? `${this.config.location} child welfare ${this.config.scenario}`
      : `${this.config.location} child welfare system`;
    
    return runSearchAgent(query, {
      maxResults: 15,
      filterDomains: ["gov", "edu", "org"],
    });
  }

  private async executeLegalSearch(): Promise<SearchResponse> {
    return searchChildWelfareLaw(this.config.location, this.config.scenario, {
      jurisdiction: this.config.location,
      documentTypes: ["statute", "case_law", "regulation"],
    });
  }

  private async executePolicySearch(): Promise<SearchResponse> {
    return searchChildWelfarePolicy(this.config.location, this.config.scenario, {
      jurisdiction: this.config.location,
      policyType: "all",
    });
  }

  private async executeFederalSearch(): Promise<SearchResponse> {
    return searchFederalRegulations("child welfare", {
      policyType: "federal",
      agency: "HHS",
    });
  }

  private prepareDecisionGraphInputs(
    general: SearchResponse,
    legal: SearchResponse,
    policy: SearchResponse
  ): DecisionGraphInput[] {
    const inputs: DecisionGraphInput[] = [];

    // Add legal authorities
    legal.results.forEach(result => {
      inputs.push({
        source: result.link,
        content: result.snippet,
        title: result.title,
        type: "legal_authority",
        jurisdiction: this.config.location,
        relevance: this.calculateRelevance(result),
      });
    });

    // Add policy documents
    policy.results.forEach(result => {
      inputs.push({
        source: result.link,
        content: result.snippet,
        title: result.title,
        type: "policy_document",
        jurisdiction: this.config.location,
        relevance: this.calculateRelevance(result),
      });
    });

    // Add general context
    general.results.slice(0, 5).forEach(result => {
      inputs.push({
        source: result.link,
        content: result.snippet,
        title: result.title,
        type: "context",
        relevance: this.calculateRelevance(result),
      });
    });

    return inputs;
  }

  private prepareFoiaInputs(
    general: SearchResponse,
    legal: SearchResponse,
    policy: SearchResponse
  ): FoiaInput[] {
    const inputs: FoiaInput[] = [];

    // Add legal basis for FOIA requests
    legal.results.forEach(result => {
      inputs.push({
        url: result.link,
        description: result.snippet,
        title: result.title,
        source: "legal",
        documentType: "legal_authority",
      });
    });

    // Add policy basis
    policy.results.forEach(result => {
      inputs.push({
        url: result.link,
        description: result.snippet,
        title: result.title,
        source: "policy",
        documentType: "policy",
      });
    });

    return inputs;
  }

  private prepareNgoMappingInputs(
    general: SearchResponse,
    policy: SearchResponse
  ): NgoMappingInput[] {
    const inputs: NgoMappingInput[] = [];

    // Extract contractor and NGO references
    [...general.results, ...policy.results].forEach(result => {
      if (this.containsNgoReferences(result)) {
        inputs.push({
          source: result.link,
          content: result.snippet,
          title: result.title,
          type: "ngo_reference",
          location: this.config.location,
        });
      }
    });

    return inputs;
  }

  private prepareScoringInputs(
    general: SearchResponse,
    legal: SearchResponse,
    policy: SearchResponse
  ): ScoringInput[] {
    const inputs: ScoringInput[] = [];

    // Add all results as scoring context
    [general, legal, policy].forEach(response => {
      response.results.forEach(result => {
        inputs.push({
          source: result.link,
          content: result.snippet,
          title: result.title,
          type: "scoring_context",
          weight: this.calculateRelevance(result) / 10,
          location: this.config.location,
        });
      });
    });

    return inputs;
  }

  private calculateRelevance(result: SearchResult): number {
    let score = 0;
    const title = result.title.toLowerCase();
    const snippet = result.snippet.toLowerCase();

    // Location relevance
    if (title.includes(this.config.location.toLowerCase()) || 
        snippet.includes(this.config.location.toLowerCase())) {
      score += 3;
    }

    // Scenario relevance
    if (this.config.scenario) {
      const scenarioLower = this.config.scenario.toLowerCase();
      if (title.includes(scenarioLower) || snippet.includes(scenarioLower)) {
        score += 2;
      }
    }

    // Child welfare relevance
    if (title.includes("child welfare") || snippet.includes("child welfare")) {
      score += 2;
    }

    return Math.min(score, 10); // Cap at 10
  }

  private containsNgoReferences(result: SearchResult): boolean {
    const text = `${result.title} ${result.snippet}`.toLowerCase();
    const ngoIndicators = [
      "contractor", "nonprofit", "ngo", "organization",
      "services", "provider", "agency", "foundation"
    ];
    return ngoIndicators.some(indicator => text.includes(indicator));
  }

  private extractStakeholders(searchResponse: SearchResponse): string[] {
    const stakeholders = new Set<string>();
    
    searchResponse.results.forEach(result => {
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      
      // Extract common stakeholder types
      if (text.includes("court")) stakeholders.add("Family Court");
      if (text.includes("cps") || text.includes("child protective")) stakeholders.add("CPS");
      if (text.includes("sheriff") || text.includes("police")) stakeholders.add("Law Enforcement");
      if (text.includes("school") || text.includes("education")) stakeholders.add("School District");
      if (text.includes("health") || text.includes("medical")) stakeholders.add("Health Services");
    });

    return Array.from(stakeholders);
  }

  private extractAgencies(searchResponse: SearchResponse): string[] {
    const agencies = new Set<string>();
    
    searchResponse.results.forEach(result => {
      const text = `${result.title} ${result.snippet}`.toLowerCase();
      
      // Extract government agencies
      if (text.includes("department") && text.includes("children")) {
        agencies.add("Department of Children and Families");
      }
      if (text.includes("hhs") || text.includes("health and human services")) {
        agencies.add("Department of Health and Human Services");
      }
      if (text.includes("acf")) {
        agencies.add("Administration for Children and Families");
      }
    });

    return Array.from(agencies);
  }

  private getTotalResults(...responses: SearchResponse[]): number {
    return responses.reduce((total, response) => total + response.results.length, 0);
  }
}

// Export convenience function
export const executeIntegratedSearch = async (
  location: string,
  scenario?: string,
  includeAgents?: string[]
): Promise<IntegratedSearchResponse> => {
  const integration = new SearchIntegration({
    location,
    scenario,
    includeAgents,
  });
  
  return integration.executeIntegratedSearch();
};
