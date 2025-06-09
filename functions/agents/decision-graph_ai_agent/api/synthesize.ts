import * as functions from "firebase-functions";
import { logger } from "functions/lib/logger";
import { handleApiError, createError, validateRequired } from "../utils/errorHandling";
import { runDecisionGraphAgent } from "../runDecisionGraphAgent";
import type {
  DecisionGraphInput,
  NormalizedLocation,
  LegalFrameworkResult,
  StakeholderResult,
} from "../runDecisionGraphAgent";

interface SynthesisResponse {
  success: boolean;
  data?: {
    diagram: string;
    metadata: {
      location: NormalizedLocation;
      legalFramework: LegalFrameworkResult;
      stakeholders: StakeholderResult;
    };
    sources: {
      byCategory: Record<string, string[]>;
      citations: string;
      statistics: Record<string, number>;
    };
  };
  error?: {
    code: number;
    message: string;
    type: string;
  };
  timestamp: string;
}

/**
 * Firebase Function to synthesize decision chains
 * Can be called via HTTP trigger or directly from other Firebase Functions
 */
export const synthesizeDecisionChain = functions.https.onRequest(async (req, res) => {
  try {
    // Validate request method
    if (req.method !== "POST") {
      throw createError("Only POST method is allowed", "METHOD_NOT_ALLOWED");
    }

    // Validate request body
    const input = req.body as Partial<DecisionGraphInput>;
    validateRequired(input, ["location", "scenario"]);

    logger.info("Starting decision chain synthesis", {
      location: input.location,
      scenario: input.scenario,
    });

    // Process the request using runDecisionGraphAgent
    const result = await runDecisionGraphAgent({
      location: input.location!,
      scenario: input.scenario!,
      templatePath: input.templatePath,
      outputPath: input.outputPath,
    });

    // Construct successful response
    const response: SynthesisResponse = {
      success: true,
      data: {
        diagram: result.diagram,
        metadata: {
          location: result.location,
          legalFramework: result.legalFramework,
          stakeholders: result.stakeholders,
        },
        sources: result.sources,
      },
      timestamp: new Date().toISOString(),
    };

    logger.info("Decision chain synthesis completed successfully", {
      location: result.location.full,
      stakeholderCounts: {
        agencies: result.stakeholders.agencies.length,
        contractors: result.stakeholders.contractors.length,
        representatives: result.stakeholders.representatives.length,
      },
    });

    res.status(200).json(response);
  } catch (error) {
    logger.error("Error in decision chain synthesis", {
      error: error instanceof Error ? error.message : "Unknown error",
    });

    handleApiError(res, error);
  }
});

/**
 * Callable version of the synthesis function for internal use
 * Can be imported and called directly by other Firebase Functions
 */
export async function synthesize(input: DecisionGraphInput): Promise<SynthesisResponse> {
  try {
    validateRequired(input, ["location", "scenario"]);

    const result = await runDecisionGraphAgent(input);

    return {
      success: true,
      data: {
        diagram: result.diagram,
        metadata: {
          location: result.location,
          legalFramework: result.legalFramework,
          stakeholders: result.stakeholders,
        },
        sources: result.sources,
      },
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    logger.error("Error in synthesize function", {
      error: error instanceof Error ? error.message : "Unknown error",
      input,
    });

    return {
      success: false,
      error: {
        code: 500,
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        type: error instanceof Error ? error.name : "INTERNAL_ERROR",
      },
      timestamp: new Date().toISOString(),
    };
  }
}

export type { DecisionGraphInput, SynthesisResponse };
