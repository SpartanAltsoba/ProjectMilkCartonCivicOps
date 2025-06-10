import { logger } from "../../lib/logger";
import {
  performGoogleSearch,
  validateSearchParams,
  formatSearchResults,
} from "../../lib/googleSearch";
import { SearchResult, SearchConfig, SearchResponse } from "../../types/search";

interface SearchAgentConfig extends SearchConfig {
  // Additional search agent specific config
  retryAttempts?: number;
  timeoutMs?: number;
}

export class SearchAgent {
  private config: SearchAgentConfig;

  constructor(config: SearchAgentConfig = {}) {
    this.config = {
      maxResults: 10,
      retryAttempts: 3,
      timeoutMs: 30000,
      ...config,
    };
  }

  /**
   * Execute a search query and return formatted results
   */
  async executeSearch(query: string): Promise<SearchResponse> {
    const startTime = Date.now();

    try {
      // Validate search parameters
      const validation = validateSearchParams(query);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Enhance query with domain filters if configured
      let enhancedQuery = query;
      if (this.config.filterDomains?.length) {
        const siteFilters = this.config.filterDomains.map(domain => `site:${domain}`).join(" OR ");
        enhancedQuery = `${query} (${siteFilters})`;
      }
      if (this.config.excludeDomains?.length) {
        const excludeFilters = this.config.excludeDomains
          .map(domain => `-site:${domain}`)
          .join(" ");
        enhancedQuery = `${enhancedQuery} ${excludeFilters}`;
      }

      // Execute search
      const searchResponse = await performGoogleSearch(enhancedQuery);
      let results = formatSearchResults(searchResponse.results);

      // Apply date range filter if configured (skip for now as SearchResult doesn't have date info)
      // TODO: Enhance SearchResult interface to include date information
      if (this.config.dateRange) {
        // For now, we'll include all results since we don't have date metadata
        logger.info(
          "Date range filtering requested but not available in current SearchResult format"
        );
      }

      // Limit results if configured
      if (this.config.maxResults) {
        results = results.slice(0, this.config.maxResults);
      }

      const response: SearchResponse = {
        results,
        metadata: {
          query,
          totalResults: results.length,
          searchTime: Date.now() - startTime,
          filters: {
            domains: this.config.filterDomains,
            excludedDomains: this.config.excludeDomains,
            dateRange: this.config.dateRange
              ? {
                  start: this.config.dateRange.start.toISOString(),
                  end: this.config.dateRange.end.toISOString(),
                }
              : undefined,
          },
        },
      };

      logger.info("Search completed successfully", {
        query,
        resultCount: results.length,
        searchTime: response.metadata.searchTime,
      });

      return response;
    } catch (error) {
      logger.error("Search execution failed", {
        query,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  /**
   * Share results with other AI agents
   */
  async shareResults(results: SearchResult[], targetAgent: string): Promise<void> {
    try {
      // Format results for the target agent
      const formattedResults = this.formatResultsForAgent(results, targetAgent);

      // Log the sharing operation
      logger.info("Sharing search results", {
        targetAgent,
        resultCount: results.length,
      });

      // TODO: Implement result sharing logic based on target agent
      switch (targetAgent) {
        case "decision-graph":
          // Share with decision graph agent
          break;
        case "foia":
          // Share with FOIA agent
          break;
        case "ngo-mapping":
          // Share with NGO mapping agent
          break;
        case "scoring":
          // Share with scoring agent
          break;
        default:
          throw new Error(`Unknown target agent: ${targetAgent}`);
      }
    } catch (error) {
      logger.error("Failed to share search results", {
        targetAgent,
        error: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private formatResultsForAgent(results: SearchResult[], targetAgent: string): any {
    // Format results based on target agent requirements
    switch (targetAgent) {
      case "decision-graph":
        return results.map(result => ({
          source: result.link,
          content: result.snippet,
          title: result.title,
          type: "search_result",
        }));
      case "foia":
        return results.map(result => ({
          url: result.link,
          description: result.snippet,
          title: result.title,
          source: "search",
        }));
      default:
        return results;
    }
  }
}

// Export a function to create and run the search agent
export const runSearchAgent = async (
  query: string,
  config?: SearchAgentConfig
): Promise<SearchResponse> => {
  const agent = new SearchAgent(config);
  return agent.executeSearch(query);
};
