import { NextApiRequest, NextApiResponse } from "next";
import {
  runSearchAgent,
  runLegalSearchAgent,
  runPolicySearchAgent,
  executeIntegratedSearch,
} from "../../../functions/agents/search_ai_agent";
import { logApiRequest, logError } from "../../middleware/logger";
import { SearchResponse, SearchError } from "../../types/search";

interface SearchApiRequest extends NextApiRequest {
  body: {
    query: string;
    source?: "all" | "local" | "google" | "legal" | "policy" | "integrated";
    location?: string;
    filters?: {
      dateRange?: {
        start: string;
        end: string;
      };
      jurisdiction?: string;
      documentTypes?: string[];
      agency?: string;
    };
  };
}

export default async function handler(
  req: SearchApiRequest,
  res: NextApiResponse<SearchResponse | SearchError>
) {
  // Log the API request
  logApiRequest(req, res);

  if (req.method !== "POST") {
    return res.status(405).json({
      code: "METHOD_NOT_ALLOWED",
      message: "Only POST method is allowed",
    });
  }

  const { query, source = "all", location, filters } = req.body;

  if (!query || typeof query !== "string" || query.trim().length === 0) {
    return res.status(400).json({
      code: "INVALID_QUERY",
      message: "Query parameter is required and must be a non-empty string",
    });
  }

  try {
    let searchResponse: SearchResponse;

    switch (source) {
      case "legal": {
        searchResponse = await runLegalSearchAgent(query, {
          jurisdiction: location || filters?.jurisdiction,
          documentTypes: filters?.documentTypes as any,
        });
        break;
      }

      case "policy": {
        searchResponse = await runPolicySearchAgent(query, {
          jurisdiction: location || filters?.jurisdiction,
          agency: filters?.agency,
        });
        break;
      }

      case "integrated": {
        if (!location) {
          return res.status(400).json({
            code: "LOCATION_REQUIRED",
            message: "Location is required for integrated search",
          });
        }
        const integratedResult = await executeIntegratedSearch(location, query);
        // Convert integrated response to standard search response
        searchResponse = {
          results: integratedResult.searchResults.general.results,
          metadata: {
            query,
            totalResults: integratedResult.metadata.totalResults,
            searchTime: 0, // Will be calculated by the integration
            filters: {
              source: "integrated",
              location,
            },
          },
        };
        break;
      }

      case "google":
      case "local":
      case "all":
      default: {
        searchResponse = await runSearchAgent(query, {
          maxResults: 20,
          filterDomains: source === "local" ? ["gov", "edu"] : undefined,
        });
        break;
      }
    }

    // Add search time if not already present
    if (!searchResponse.metadata.searchTime) {
      searchResponse.metadata.searchTime = 0; // This would be calculated by timing the search
    }

    res.status(200).json(searchResponse);
  } catch (error) {
    logError(error as Error, { query, source, location, filters });

    const errorResponse: SearchError = {
      code: "SEARCH_FAILED",
      message: error instanceof Error ? error.message : "An unknown error occurred during search",
      details: process.env.NODE_ENV === "development" ? error : undefined,
    };

    res.status(500).json(errorResponse);
  }
}
