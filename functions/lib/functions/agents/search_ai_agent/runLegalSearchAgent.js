"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchChildWelfareLaw = exports.runLegalSearchAgent = exports.LegalSearchAgent = void 0;
const logger_1 = require("../../lib/logger");
const runSearchAgent_1 = require("./runSearchAgent");
class LegalSearchAgent extends runSearchAgent_1.SearchAgent {
    constructor(config = {}) {
        // Configure search domains for legal sources
        const legalDomains = [
            "law.cornell.edu",
            "justia.com",
            "findlaw.com",
            "courtlistener.com",
            "govinfo.gov",
            "congress.gov",
            "supremecourt.gov",
            "uscourts.gov",
            "childwelfare.gov",
            "acf.hhs.gov",
        ];
        super({
            filterDomains: legalDomains,
            maxResults: 20,
        });
        this.legalConfig = config;
    }
    /**
     * Execute a legal search with specialized legal query enhancement
     */
    async executeLegalSearch(query) {
        try {
            // Enhance query with legal-specific terms
            const enhancedQuery = this.enhanceLegalQuery(query);
            logger_1.logger.info("Executing legal search", {
                originalQuery: query,
                enhancedQuery,
                jurisdiction: this.legalConfig.jurisdiction,
                courtLevel: this.legalConfig.courtLevel,
            });
            const response = await this.executeSearch(enhancedQuery);
            // Post-process results for legal relevance
            const legalResults = this.filterLegalResults(response.results);
            return Object.assign(Object.assign({}, response), { results: legalResults, metadata: Object.assign(Object.assign({}, response.metadata), { filters: Object.assign(Object.assign({}, response.metadata.filters), { legalFilters: {
                            jurisdiction: this.legalConfig.jurisdiction,
                            courtLevel: this.legalConfig.courtLevel,
                            documentTypes: this.legalConfig.documentTypes,
                        } }) }) });
        }
        catch (error) {
            logger_1.logger.error("Legal search execution failed", {
                query,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Search for child welfare legal frameworks
     */
    async searchChildWelfareLaw(location, scenario) {
        const queries = [
            `${location} child welfare law`,
            `${location} CPS legal framework`,
            `${location} child protection statute`,
            `${location} family court jurisdiction`,
        ];
        if (scenario) {
            queries.push(`${location} ${scenario} legal requirements`);
        }
        // Execute multiple searches and combine results
        const allResults = [];
        for (const query of queries) {
            try {
                const response = await this.executeLegalSearch(query);
                allResults.push(...response.results);
            }
            catch (error) {
                logger_1.logger.warn("Failed to execute legal search query", { query, error });
            }
        }
        // Remove duplicates and rank by relevance
        const uniqueResults = this.deduplicateResults(allResults);
        const rankedResults = this.rankLegalResults(uniqueResults, location, scenario);
        return {
            results: rankedResults.slice(0, 15), // Limit to top 15 results
            metadata: {
                query: `Child welfare law search for ${location}`,
                totalResults: rankedResults.length,
                searchTime: 0, // Combined search time
                filters: {
                    legalFilters: {
                        jurisdiction: location,
                        documentTypes: ["statute", "case_law", "regulation"],
                    },
                },
            },
        };
    }
    /**
     * Share legal search results with decision graph agent
     */
    async shareWithDecisionGraph(results, location) {
        try {
            const formattedResults = results.map(result => ({
                source: result.link,
                content: result.snippet,
                title: result.title,
                type: "legal_authority",
                jurisdiction: location,
                relevance: this.calculateLegalRelevance(result),
            }));
            logger_1.logger.info("Sharing legal search results with decision graph agent", {
                resultCount: formattedResults.length,
                jurisdiction: location,
            });
            // TODO: Implement actual sharing mechanism with decision graph agent
            await this.shareResults(results, "decision-graph");
        }
        catch (error) {
            logger_1.logger.error("Failed to share legal results with decision graph agent", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    enhanceLegalQuery(query) {
        var _a;
        const legalTerms = [];
        // Add jurisdiction if specified
        if (this.legalConfig.jurisdiction) {
            legalTerms.push(this.legalConfig.jurisdiction);
        }
        // Add court level terms
        if (this.legalConfig.courtLevel && this.legalConfig.courtLevel !== "all") {
            legalTerms.push(this.legalConfig.courtLevel);
        }
        // Add document type terms
        if ((_a = this.legalConfig.documentTypes) === null || _a === void 0 ? void 0 : _a.length) {
            const docTerms = this.legalConfig.documentTypes.map(type => {
                switch (type) {
                    case "statute":
                        return "statute OR law OR code";
                    case "case_law":
                        return "case OR decision OR opinion";
                    case "regulation":
                        return "regulation OR rule OR CFR";
                    case "policy":
                        return "policy OR guidance OR directive";
                    default:
                        return type;
                }
            });
            legalTerms.push(`(${docTerms.join(" OR ")})`);
        }
        // Combine original query with legal terms
        const enhancedQuery = [query, ...legalTerms].join(" ");
        return enhancedQuery;
    }
    filterLegalResults(results) {
        return results.filter(result => {
            const title = result.title.toLowerCase();
            const snippet = result.snippet.toLowerCase();
            const link = result.link.toLowerCase();
            // Check for legal indicators
            const legalIndicators = [
                "law",
                "statute",
                "code",
                "regulation",
                "rule",
                "court",
                "case",
                "decision",
                "opinion",
                "legal",
                "judicial",
                "jurisdiction",
                "child welfare",
                "cps",
                "family court",
                "dependency",
                "custody",
                "protection",
            ];
            return legalIndicators.some(indicator => title.includes(indicator) || snippet.includes(indicator) || link.includes(indicator));
        });
    }
    deduplicateResults(results) {
        const seen = new Set();
        return results.filter(result => {
            const key = result.link;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    rankLegalResults(results, location, scenario) {
        return results.sort((a, b) => {
            const scoreA = this.calculateLegalRelevance(a, location, scenario);
            const scoreB = this.calculateLegalRelevance(b, location, scenario);
            return scoreB - scoreA; // Higher scores first
        });
    }
    calculateLegalRelevance(result, location, scenario) {
        let score = 0;
        const title = result.title.toLowerCase();
        const snippet = result.snippet.toLowerCase();
        const link = result.link.toLowerCase();
        // Domain authority scoring
        if (link.includes("law.cornell.edu"))
            score += 10;
        if (link.includes("govinfo.gov"))
            score += 9;
        if (link.includes("childwelfare.gov"))
            score += 8;
        if (link.includes("uscourts.gov"))
            score += 7;
        if (link.includes("supremecourt.gov"))
            score += 7;
        // Content relevance scoring
        if (title.includes("child welfare") || snippet.includes("child welfare"))
            score += 5;
        if (title.includes("cps") || snippet.includes("cps"))
            score += 4;
        if (title.includes("family court") || snippet.includes("family court"))
            score += 4;
        // Location relevance
        if (location) {
            const locationLower = location.toLowerCase();
            if (title.includes(locationLower) || snippet.includes(locationLower))
                score += 6;
        }
        // Scenario relevance
        if (scenario) {
            const scenarioLower = scenario.toLowerCase();
            if (title.includes(scenarioLower) || snippet.includes(scenarioLower))
                score += 3;
        }
        return score;
    }
}
exports.LegalSearchAgent = LegalSearchAgent;
// Export function to create and run legal search agent
const runLegalSearchAgent = async (query, config) => {
    const agent = new LegalSearchAgent(config);
    return agent.executeLegalSearch(query);
};
exports.runLegalSearchAgent = runLegalSearchAgent;
// Export function for child welfare law search
const searchChildWelfareLaw = async (location, scenario, config) => {
    const agent = new LegalSearchAgent(config);
    return agent.searchChildWelfareLaw(location, scenario);
};
exports.searchChildWelfareLaw = searchChildWelfareLaw;
//# sourceMappingURL=runLegalSearchAgent.js.map