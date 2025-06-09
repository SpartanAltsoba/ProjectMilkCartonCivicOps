import { logger } from "functions/lib/logger";
import { normalizeLocation, NormalizedLocation } from "./utils/dataNormalization";
import { determineLegalFramework, LegalFrameworkResult } from "./utils/legalFramework";
import { identifyStakeholders, StakeholderSearchResult } from "./utils/stakeholderIdentification";
import { PumlGenerator, DiagramData } from "./utils/pumlGenerator";
import { globalSourceCitations } from "./utils/sourceCitations";
import { createError, validateRequired } from "./utils/errorHandling";

interface DecisionGraphInput {
  location: string;
  scenario: string;
  templatePath?: string;
  outputPath?: string;
}

interface DecisionGraphOutput {
  location: NormalizedLocation;
  legalFramework: LegalFrameworkResult;
  stakeholders: StakeholderSearchResult;
  diagram: string;
  sources: {
    byCategory: {
      agency: string[];
      legal: string[];
      contractor: string[];
      representative: string[];
      [key: string]: string[]; // Add index signature
    };
    citations: string;
    statistics: Record<string, number>;
  };
}

/**
 * Runs the decision graph generation process
 */
export async function runDecisionGraphAgent(
  input: DecisionGraphInput
): Promise<DecisionGraphOutput> {
  try {
    logger.info("Starting decision graph generation", { input });

    // Validate input
    validateRequired(input, ["location", "scenario"]);

    // Clear any existing sources from previous runs
    globalSourceCitations.clear();

    // Step 1: Normalize location
    const normalizedLocation = await normalizeLocation(input.location);
    logger.info("Location normalized", { normalizedLocation });

    // Step 2: Determine legal framework
    const legalFramework = await determineLegalFramework(normalizedLocation);
    logger.info("Legal framework determined", {
      type: legalFramework.type,
      sourceCount: legalFramework.sources.length,
    });

    // Step 3: Identify stakeholders
    const stakeholders = await identifyStakeholders(normalizedLocation, input.scenario);
    logger.info("Stakeholders identified", {
      agencyCount: stakeholders.agencies.length,
      contractorCount: stakeholders.contractors.length,
      representativeCount: stakeholders.representatives.length,
    });

    // Step 4: Generate PUML diagram
    const pumlGenerator = new PumlGenerator({
      templatePath: input.templatePath,
      outputPath: input.outputPath,
    });

    const diagramData: DiagramData = {
      agencies: stakeholders.agencies,
      contractors: stakeholders.contractors,
      representatives: stakeholders.representatives,
      scenario: input.scenario,
    };

    const diagram = await pumlGenerator.generateDiagram(diagramData);
    logger.info("Diagram generated successfully");

    // Compile output
    const output: DecisionGraphOutput = {
      location: normalizedLocation,
      legalFramework,
      stakeholders,
      diagram,
      sources: {
        byCategory: {
          ...globalSourceCitations.getSourcesByCategory(),
          // Ensure index signature compatibility
          "": [], // Default empty array for unknown categories
        },
        citations: globalSourceCitations.generateFormattedCitations(),
        statistics: globalSourceCitations.getStatistics(),
      },
    };

    logger.info("Decision graph generation completed successfully", {
      sourceStats: output.sources.statistics,
    });

    return output;
  } catch (error) {
    logger.error("Error in decision graph generation", {
      input,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Convert unknown errors to typed errors
    if (!(error instanceof Error)) {
      throw createError("An unexpected error occurred during decision graph generation");
    }

    throw error;
  }
}

// Export types for external use
export type {
  DecisionGraphInput,
  DecisionGraphOutput,
  NormalizedLocation,
  LegalFrameworkResult,
  StakeholderSearchResult as StakeholderResult,
  DiagramData,
};
