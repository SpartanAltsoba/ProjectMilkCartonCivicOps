import { logger } from "../logger";
import { GOOGLE_SEARCH_API_KEY, GOOGLE_CSE_ID, validateSearchConfig } from "../config/env";

interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  source: "google";
}

interface SearchResponse {
  results: SearchResult[];
}

/**
 * Perform a Google search using the Custom Search API
 */
export const performGoogleSearch = async (query: string): Promise<SearchResponse> => {
  if (!query || typeof query !== "string") {
    logger.error("Invalid search query", { query });
    throw new Error("Query is required");
  }

  if (!validateSearchConfig()) {
    throw new Error("Google Search API configuration is invalid");
  }

  const apiKey = GOOGLE_SEARCH_API_KEY;
  const searchEngineId = GOOGLE_CSE_ID;

  try {
    // Add a small random delay to avoid rate limiting
    const delayTime = Math.floor(Math.random() * 1000) + 500;
    await new Promise(resolve => setTimeout(resolve, delayTime));

    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.append("key", apiKey);
    url.searchParams.append("cx", searchEngineId);
    url.searchParams.append("q", query);

    logger.info("Making Google Search API request", {
      query,
      url: url.toString().replace(apiKey, "[REDACTED]"),
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const errorMessage = data.error?.message || "Failed to perform Google search";
      logger.error("Google Search API error", {
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        data,
      });
      throw new Error(`Google Search API error: ${errorMessage}`);
    }

    const data = await response.json();
    logger.info("Google Search API response", {
      itemCount: data.items?.length || 0,
      searchInformation: data.searchInformation,
    });

    if (!data.items) {
      return {
        results: [],
      };
    }

    const results: SearchResult[] = data.items.map((item: any) => ({
      title: item.title,
      link: item.link,
      snippet: item.snippet,
      source: "google" as const,
    }));

    logger.info("Google search completed", {
      query,
      resultCount: results.length,
    });

    return {
      results,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    logger.error("Google search error", { error: errorMessage, query });
    throw new Error(errorMessage);
  }
};

/**
 * Validate search query parameters
 */
export const validateSearchParams = (query: string): { valid: boolean; error?: string } => {
  if (!query.trim()) {
    return { valid: false, error: "Search query cannot be empty" };
  }

  if (query.length > 256) {
    return { valid: false, error: "Search query too long (max 256 characters)" };
  }

  // Check for potentially harmful characters
  const dangerousChars = /[<>{}[\]\\]/;
  if (dangerousChars.test(query)) {
    return { valid: false, error: "Search query contains invalid characters" };
  }

  return { valid: true };
};

/**
 * Format search results for display
 */
export const formatSearchResults = (results: SearchResult[]): SearchResult[] => {
  return results.map(result => ({
    ...result,
    // Ensure snippet is not too long
    snippet:
      result.snippet?.length > 200
        ? `${result.snippet.substring(0, 197)}...`
        : result.snippet || "No description available",
    // Ensure title exists
    title: result.title || "Untitled",
  }));
};
