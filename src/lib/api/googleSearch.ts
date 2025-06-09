import axios from "axios";
import { logger } from "../logger";

interface GoogleSearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
}

interface GoogleSearchResponse {
  results: GoogleSearchResult[];
  searchInformation?: {
    totalResults: string;
    searchTime: number;
  };
  error?: string;
}

class GoogleSearchClient {
  private apiKey: string;
  private cseId: string;
  private baseUrl = "https://www.googleapis.com/customsearch/v1";

  constructor() {
    this.apiKey = process.env.GOOGLE_SEARCH_API_KEY || "";
    this.cseId = process.env.GOOGLE_CSE_ID || "";

    if (!this.apiKey || !this.cseId) {
      logger.warn("Google Search API credentials not configured");
    }
  }

  async search(
    query: string,
    options: {
      num?: number;
      start?: number;
      siteSearch?: string;
    } = {}
  ): Promise<GoogleSearchResponse> {
    if (!this.apiKey || !this.cseId) {
      return {
        results: [],
        error: "Google Search API not configured",
      };
    }

    try {
      const params = {
        key: this.apiKey,
        cx: this.cseId,
        q: query,
        num: options.num || 10,
        start: options.start || 1,
        ...(options.siteSearch && { siteSearch: options.siteSearch }),
      };

      logger.info("Performing Google search", { query, params: { ...params, key: "[REDACTED]" } });

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 10000,
      });

      const items = response.data.items || [];
      const results: GoogleSearchResult[] = items.map((item: any) => ({
        title: item.title || "",
        link: item.link || "",
        snippet: item.snippet || "",
        displayLink: item.displayLink,
      }));

      return {
        results,
        searchInformation: response.data.searchInformation,
      };
    } catch (error) {
      logger.error("Google search failed", error as Error, { query });

      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const message = error.response?.data?.error?.message || error.message;

        return {
          results: [],
          error: `Google Search API error (${status}): ${message}`,
        };
      }

      return {
        results: [],
        error: "Unknown error occurred during search",
      };
    }
  }

  async searchWithRetry(query: string, maxRetries = 3): Promise<GoogleSearchResponse> {
    let lastError: string | undefined;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await this.search(query);

        if (!result.error) {
          return result;
        }

        lastError = result.error;

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.info(`Search attempt ${attempt} failed, retrying in ${delay}ms`, {
            query,
            error: result.error,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (error) {
        lastError = error instanceof Error ? error.message : "Unknown error";

        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          logger.info(`Search attempt ${attempt} failed, retrying in ${delay}ms`, {
            query,
            error: lastError,
          });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    return {
      results: [],
      error: lastError || "All retry attempts failed",
    };
  }
}

const googleSearchClient = new GoogleSearchClient();

export async function performGoogleSearch(query: string): Promise<GoogleSearchResponse> {
  return googleSearchClient.searchWithRetry(query);
}

export { GoogleSearchClient };
export type { GoogleSearchResult, GoogleSearchResponse };
