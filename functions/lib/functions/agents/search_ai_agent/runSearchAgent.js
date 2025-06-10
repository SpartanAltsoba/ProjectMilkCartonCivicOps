"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runSearchAgent = exports.SearchAgent = void 0;
const logger_1 = require("../../lib/logger");
const googleSearch_1 = require("../../lib/googleSearch");
class SearchAgent {
    constructor(config = {}) {
        this.config = Object.assign({ maxResults: 10, retryAttempts: 3, timeoutMs: 30000 }, config);
    }
    /**
     * Execute a search query and return formatted results
     */
    async executeSearch(query) {
        var _a, _b;
        const startTime = Date.now();
        try {
            // Validate search parameters
            const validation = (0, googleSearch_1.validateSearchParams)(query);
            if (!validation.valid) {
                throw new Error(validation.error);
            }
            // Enhance query with domain filters if configured
            let enhancedQuery = query;
            if ((_a = this.config.filterDomains) === null || _a === void 0 ? void 0 : _a.length) {
                const siteFilters = this.config.filterDomains.map(domain => `site:${domain}`).join(" OR ");
                enhancedQuery = `${query} (${siteFilters})`;
            }
            if ((_b = this.config.excludeDomains) === null || _b === void 0 ? void 0 : _b.length) {
                const excludeFilters = this.config.excludeDomains
                    .map(domain => `-site:${domain}`)
                    .join(" ");
                enhancedQuery = `${enhancedQuery} ${excludeFilters}`;
            }
            // Execute search
            const searchResponse = await (0, googleSearch_1.performGoogleSearch)(enhancedQuery);
            let results = (0, googleSearch_1.formatSearchResults)(searchResponse.results);
            // Apply date range filter if configured (skip for now as SearchResult doesn't have date info)
            // TODO: Enhance SearchResult interface to include date information
            if (this.config.dateRange) {
                // For now, we'll include all results since we don't have date metadata
                logger_1.logger.info("Date range filtering requested but not available in current SearchResult format");
            }
            // Limit results if configured
            if (this.config.maxResults) {
                results = results.slice(0, this.config.maxResults);
            }
            const response = {
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
            logger_1.logger.info("Search completed successfully", {
                query,
                resultCount: results.length,
                searchTime: response.metadata.searchTime,
            });
            return response;
        }
        catch (error) {
            logger_1.logger.error("Search execution failed", {
                query,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Share results with other AI agents
     */
    async shareResults(results, targetAgent) {
        try {
            // Format results for the target agent
            const formattedResults = this.formatResultsForAgent(results, targetAgent);
            // Log the sharing operation
            logger_1.logger.info("Sharing search results", {
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
        }
        catch (error) {
            logger_1.logger.error("Failed to share search results", {
                targetAgent,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    formatResultsForAgent(results, targetAgent) {
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
exports.SearchAgent = SearchAgent;
// Export a function to create and run the search agent
const runSearchAgent = async (query, config) => {
    const agent = new SearchAgent(config);
    return agent.executeSearch(query);
};
exports.runSearchAgent = runSearchAgent;
//# sourceMappingURL=runSearchAgent.js.map