import { logger } from "../../../lib/logger";
import { performGoogleSearch } from "../../../lib/googleSearch";
import { NormalizedLocation } from "./dataNormalization";

type LegalFrameworkType = "CHINS" | "CINA" | "FINS" | "State-specific" | "Unknown";

interface LegalFrameworkResult {
  type: LegalFrameworkType;
  sources: string[];
  summary?: string;
}

/**
 * Determines the legal framework type for child welfare cases in a given location
 * @param location Normalized location object
 * @returns Legal framework type and sources
 */
export async function determineLegalFramework(
  location: NormalizedLocation
): Promise<LegalFrameworkResult> {
  try {
    // Construct CSE query
    const query = `${location.state} ${location.county} CPS child removal process site:childwelfare.gov OR site:law.cornell.edu`;

    logger.info("Executing legal framework search", {
      location: location.full,
      query,
    });

    const searchResponse = await performGoogleSearch(query);
    const sources = searchResponse.results.map(result => result.link);

    if (sources.length === 0) {
      logger.warn("No legal framework sources found", {
        location: location.full,
      });

      return {
        type: "Unknown",
        sources: [],
        summary: "No legal framework information found for this jurisdiction",
      };
    }

    // Analyze search results to determine framework type
    const frameworkType = await analyzeLegalFramework(searchResponse.results, location);

    logger.info("Legal framework determined", {
      location: location.full,
      type: frameworkType,
      sourceCount: sources.length,
    });

    return {
      type: frameworkType,
      sources,
      // TODO: Add OpenAI summarization here if needed
    };
  } catch (error) {
    logger.error("Error determining legal framework", {
      location: location.full,
      error: error instanceof Error ? error.message : "Unknown error",
    });

    // Fallback to Unknown with explanation
    return {
      type: "Unknown",
      sources: [],
      summary: "Error occurred while determining legal framework",
    };
  }
}

/**
 * Analyzes search results to determine the legal framework type
 */
async function analyzeLegalFramework(
  results: Array<{ title: string; snippet: string }>,
  location: NormalizedLocation
): Promise<LegalFrameworkType> {
  // Combine all text for analysis
  const combinedText = results
    .map(r => `${r.title} ${r.snippet}`)
    .join(" ")
    .toLowerCase();

  // Check for specific framework indicators
  if (combinedText.includes("child in need of services") || combinedText.includes("chins")) {
    return "CHINS";
  }

  if (combinedText.includes("child in need of aid") || combinedText.includes("cina")) {
    return "CINA";
  }

  if (combinedText.includes("family in need of services") || combinedText.includes("fins")) {
    return "FINS";
  }

  // Check state-specific patterns
  const stateSpecificPatterns: Record<string, RegExp[]> = {
    CA: [/dependency\s+court/i, /welfare\s+and\s+institutions\s+code/i],
    NY: [/article\s+10\s+proceeding/i, /family\s+court\s+act/i],
    TX: [/title\s+5\s+family\s+code/i],
    // Add more state-specific patterns as needed
  };

  if (location.state in stateSpecificPatterns) {
    const patterns = stateSpecificPatterns[location.state];
    if (patterns.some(pattern => pattern.test(combinedText))) {
      return "State-specific";
    }
  }

  // If no specific framework is identified but we have results
  if (results.length > 0) {
    return "State-specific";
  }

  // Default fallback
  return "Unknown";
}

export type { LegalFrameworkType, LegalFrameworkResult };
