import { logger } from "./utils/logger";
import { InputValidationError, validateEnvironment } from "./utils/errorHandling";
import { normalizeLocation, type NormalizedLocation } from "./utils/dataNormalization";
import { determineLegalFramework, type LegalFrameworkType } from "./utils/legalFramework";
import { getAllStakeholders } from "./utils/stakeholderIdentification";
import { generatePUMLDiagram } from "./utils/pumlGenerator";
import {
  sourceCitations,
  generateCitationReport,
  addMultipleSources,
} from "./utils/sourceCitations";

/**
 * Input interface for the graph builder
 */
export interface GraphBuilderInput {
  location: string;
  scenario: string;
}

/**
 * Stakeholder interface
 */
interface Stakeholder {
  name: string;
  type: "agency" | "contractor" | "representative";
  source: string;
  metadata?: {
    ein?: string;
    role?: string;
  };
}

/**
 * Complete decision graph data structure
 */
export interface DecisionGraph {
  location: NormalizedLocation;
  legalFramework: {
    type: LegalFrameworkType;
    confidence: number;
    sources: string[];
  };
  stakeholders: {
    agencies: Stakeholder[];
    contractors: Stakeholder[];
    representatives: Stakeholder[];
  };
  pumlDiagram: string;
  citations: {
    formatted: string;
    counts: Record<string, number>;
    sources: Record<string, Array<{ url: string; title?: string; retrievedAt: string }>>;
  };
  metadata: {
    generatedAt: string;
    processingTimeMs: number;
    totalSources: number;
  };
}

/**
 * Main graph builder class that orchestrates the decision chain synthesis
 */
export class DecisionGraphBuilder {
  private startTime: number = 0;

  /**
   * Validates the environment and input parameters
   */
  private validateInput(input: GraphBuilderInput): void {
    validateEnvironment(["GOOGLE_CSE_API_KEY", "GOOGLE_CSE_ENGINE_ID"]);

    if (!input.location || typeof input.location !== "string") {
      throw new InputValidationError("Location is required and must be a string");
    }

    if (!input.scenario || typeof input.scenario !== "string") {
      throw new InputValidationError("Scenario is required and must be a string");
    }

    if (input.location.trim().length < 3) {
      throw new InputValidationError("Location must be at least 3 characters long");
    }

    if (input.scenario.trim().length < 10) {
      throw new InputValidationError("Scenario must be at least 10 characters long");
    }
  }

  /**
   * Builds a complete decision graph from the input
   */
  async buildGraph(input: GraphBuilderInput): Promise<DecisionGraph> {
    this.startTime = Date.now();

    try {
      this.validateInput(input);

      // Clear previous citations
      sourceCitations.clear();

      logger.info("Starting decision graph build", {
        location: input.location,
        scenario: input.scenario,
      });

      // Step 1: Normalize location
      logger.debug("Step 1: Normalizing location");
      const location = await normalizeLocation(input.location);

      // Step 2: Determine legal framework
      logger.debug("Step 2: Determining legal framework");
      const legalFrameworkResult = await determineLegalFramework(location);

      // Add legal framework sources to citations
      addMultipleSources(
        legalFrameworkResult.sources.map(url => ({ url })),
        "legal"
      );

      // Step 3: Identify stakeholders
      logger.debug("Step 3: Identifying stakeholders");
      const stakeholders = await getAllStakeholders(location, input.scenario);

      // Add stakeholder sources to citations
      addMultipleSources(
        stakeholders.agencies.map(s => ({ url: s.source, title: s.name })),
        "agency"
      );
      addMultipleSources(
        stakeholders.contractors.map(s => ({ url: s.source, title: s.name })),
        "contractor"
      );
      addMultipleSources(
        stakeholders.representatives.map(s => ({ url: s.source, title: s.name })),
        "representative"
      );

      // Step 4: Generate PUML diagram
      logger.debug("Step 4: Generating PUML diagram");
      const pumlDiagram = await generatePUMLDiagram(
        input.scenario,
        location,
        stakeholders,
        legalFrameworkResult.type
      );

      // Step 5: Generate citation report
      logger.debug("Step 5: Generating citation report");
      const citationReport = generateCitationReport();

      const processingTimeMs = Date.now() - this.startTime;

      const graph: DecisionGraph = {
        location,
        legalFramework: legalFrameworkResult,
        stakeholders,
        pumlDiagram,
        citations: citationReport,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTimeMs,
          totalSources: Object.values(citationReport.counts).reduce((sum, count) => sum + count, 0),
        },
      };

      logger.info("Decision graph build completed successfully", {
        location: location.full,
        legalFramework: legalFrameworkResult.type,
        processingTimeMs,
        stakeholderCounts: {
          agencies: stakeholders.agencies.length,
          contractors: stakeholders.contractors.length,
          representatives: stakeholders.representatives.length,
        },
        totalSources: graph.metadata.totalSources,
      });

      return graph;
    } catch (error) {
      const processingTimeMs = Date.now() - this.startTime;

      logger.error("Decision graph build failed", {
        location: input.location,
        scenario: input.scenario,
        processingTimeMs,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Builds a simplified graph with minimal data for quick responses
   */
  async buildSimplifiedGraph(input: GraphBuilderInput): Promise<Partial<DecisionGraph>> {
    this.startTime = Date.now();

    try {
      this.validateInput(input);
      sourceCitations.clear();

      logger.info("Starting simplified decision graph build", {
        location: input.location,
        scenario: input.scenario,
      });

      const location = await normalizeLocation(input.location);
      const legalFrameworkResult = await determineLegalFramework(location);

      const processingTimeMs = Date.now() - this.startTime;

      return {
        location,
        legalFramework: legalFrameworkResult,
        metadata: {
          generatedAt: new Date().toISOString(),
          processingTimeMs,
          totalSources: legalFrameworkResult.sources.length,
        },
      };
    } catch (error) {
      logger.error("Simplified decision graph build failed", {
        location: input.location,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  /**
   * Validates that a built graph is complete and valid
   */
  validateGraph(graph: DecisionGraph): boolean {
    try {
      // Check required fields
      if (!graph.location || !graph.location.state || !graph.location.county) {
        return false;
      }

      if (!graph.legalFramework || !graph.legalFramework.type) {
        return false;
      }

      if (!graph.stakeholders) {
        return false;
      }

      if (!graph.pumlDiagram || graph.pumlDiagram.length < 100) {
        return false;
      }

      if (!graph.citations || !graph.metadata) {
        return false;
      }

      logger.debug("Graph validation passed", {
        location: graph.location.full,
        diagramLength: graph.pumlDiagram.length,
        totalSources: graph.metadata.totalSources,
      });

      return true;
    } catch (error) {
      logger.error("Graph validation failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      return false;
    }
  }
}

/**
 * Convenience function to build a decision graph
 */
export async function buildDecisionGraph(input: GraphBuilderInput): Promise<DecisionGraph> {
  const builder = new DecisionGraphBuilder();
  return builder.buildGraph(input);
}

/**
 * Convenience function to build a simplified decision graph
 */
export async function buildSimplifiedDecisionGraph(
  input: GraphBuilderInput
): Promise<Partial<DecisionGraph>> {
  const builder = new DecisionGraphBuilder();
  return builder.buildSimplifiedGraph(input);
}
