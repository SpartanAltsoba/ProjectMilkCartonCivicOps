"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchFederalRegulations = exports.searchChildWelfarePolicy = exports.runPolicySearchAgent = exports.PolicySearchAgent = void 0;
const logger_1 = require("../../lib/logger");
const runSearchAgent_1 = require("./runSearchAgent");
class PolicySearchAgent extends runSearchAgent_1.SearchAgent {
    constructor(config = {}) {
        // Configure search domains for policy sources
        const policyDomains = [
            "federalregister.gov",
            "regulations.gov",
            "gpo.gov",
            "govinfo.gov",
            "whitehouse.gov",
            "hhs.gov",
            "acf.hhs.gov",
            "childwelfare.gov",
            "cdc.gov",
            "justice.gov",
            "ed.gov",
            "usda.gov",
        ];
        super({
            filterDomains: policyDomains,
            maxResults: 15,
        });
        this.policyConfig = config;
    }
    /**
     * Execute a policy search with specialized policy query enhancement
     */
    async executePolicySearch(query) {
        try {
            // Enhance query with policy-specific terms
            const enhancedQuery = this.enhancePolicyQuery(query);
            logger_1.logger.info("Executing policy search", {
                originalQuery: query,
                enhancedQuery,
                agency: this.policyConfig.agency,
                policyType: this.policyConfig.policyType,
                jurisdiction: this.policyConfig.jurisdiction,
            });
            const response = await this.executeSearch(enhancedQuery);
            // Post-process results for policy relevance
            const policyResults = this.filterPolicyResults(response.results);
            return Object.assign(Object.assign({}, response), { results: policyResults, metadata: Object.assign(Object.assign({}, response.metadata), { filters: Object.assign(Object.assign({}, response.metadata.filters), { policyFilters: {
                            policyType: this.policyConfig.policyType,
                            agency: this.policyConfig.agency,
                            jurisdiction: this.policyConfig.jurisdiction,
                        } }) }) });
        }
        catch (error) {
            logger_1.logger.error("Policy search execution failed", {
                query,
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Search for child welfare policies and regulations
     */
    async searchChildWelfarePolicy(location, scenario) {
        const queries = [
            `${location} child welfare policy`,
            `${location} CPS regulations`,
            `${location} child protection guidelines`,
            `${location} family services policy`,
            `child welfare federal regulations`,
            `ASFA implementation ${location}`,
            `Title IV-E ${location}`,
        ];
        if (scenario) {
            queries.push(`${location} ${scenario} policy guidelines`);
        }
        // Execute multiple searches and combine results
        const allResults = [];
        for (const query of queries) {
            try {
                const response = await this.executePolicySearch(query);
                allResults.push(...response.results);
            }
            catch (error) {
                logger_1.logger.warn("Failed to execute policy search query", { query, error });
            }
        }
        // Remove duplicates and rank by relevance
        const uniqueResults = this.deduplicateResults(allResults);
        const rankedResults = this.rankPolicyResults(uniqueResults, location, scenario);
        return {
            results: rankedResults.slice(0, 12), // Limit to top 12 results
            metadata: {
                query: `Child welfare policy search for ${location}`,
                totalResults: rankedResults.length,
                searchTime: 0, // Combined search time
                filters: {
                    policyFilters: {
                        policyType: "all",
                        jurisdiction: location,
                    },
                },
            },
        };
    }
    /**
     * Search for federal child welfare regulations
     */
    async searchFederalRegulations(topic) {
        const baseQueries = [
            "child welfare federal regulations CFR",
            "Title IV-E regulations",
            "ASFA federal requirements",
            "child protection federal policy",
            "HHS child welfare guidance",
            "ACF child welfare regulations",
        ];
        if (topic) {
            baseQueries.push(`child welfare federal regulations ${topic}`);
        }
        const allResults = [];
        for (const query of baseQueries) {
            try {
                const response = await this.executePolicySearch(query);
                allResults.push(...response.results);
            }
            catch (error) {
                logger_1.logger.warn("Failed to execute federal regulation search", { query, error });
            }
        }
        const uniqueResults = this.deduplicateResults(allResults);
        const rankedResults = this.rankPolicyResults(uniqueResults, undefined, topic);
        return {
            results: rankedResults.slice(0, 10),
            metadata: {
                query: `Federal child welfare regulations${topic ? ` - ${topic}` : ""}`,
                totalResults: rankedResults.length,
                searchTime: 0,
                filters: {
                    policyFilters: {
                        policyType: "federal",
                        agency: "HHS/ACF",
                    },
                },
            },
        };
    }
    /**
     * Share policy search results with other agents
     */
    async shareWithAgents(results, targetAgents) {
        try {
            for (const agent of targetAgents) {
                const formattedResults = this.formatPolicyResultsForAgent(results, agent);
                logger_1.logger.info("Sharing policy search results", {
                    targetAgent: agent,
                    resultCount: formattedResults.length,
                });
                await this.shareResults(results, agent);
            }
        }
        catch (error) {
            logger_1.logger.error("Failed to share policy results", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    enhancePolicyQuery(query) {
        const policyTerms = [];
        // Add agency if specified
        if (this.policyConfig.agency) {
            policyTerms.push(this.policyConfig.agency);
        }
        // Add policy type terms
        if (this.policyConfig.policyType && this.policyConfig.policyType !== "all") {
            policyTerms.push(this.policyConfig.policyType);
        }
        // Add jurisdiction if specified
        if (this.policyConfig.jurisdiction) {
            policyTerms.push(this.policyConfig.jurisdiction);
        }
        // Add policy-specific terms
        policyTerms.push("policy OR regulation OR guidance OR directive OR rule");
        // Combine original query with policy terms
        const enhancedQuery = [query, ...policyTerms].join(" ");
        return enhancedQuery;
    }
    filterPolicyResults(results) {
        return results.filter(result => {
            const title = result.title.toLowerCase();
            const snippet = result.snippet.toLowerCase();
            const link = result.link.toLowerCase();
            // Check for policy indicators
            const policyIndicators = [
                "policy",
                "regulation",
                "rule",
                "guidance",
                "directive",
                "cfr",
                "federal register",
                "code of federal regulations",
                "policy manual",
                "guidelines",
                "standards",
                "child welfare",
                "cps",
                "family services",
                "title iv-e",
                "asfa",
                "capta",
            ];
            return policyIndicators.some(indicator => title.includes(indicator) || snippet.includes(indicator) || link.includes(indicator));
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
    rankPolicyResults(results, location, topic) {
        return results.sort((a, b) => {
            const scoreA = this.calculatePolicyRelevance(a, location, topic);
            const scoreB = this.calculatePolicyRelevance(b, location, topic);
            return scoreB - scoreA; // Higher scores first
        });
    }
    calculatePolicyRelevance(result, location, topic) {
        let score = 0;
        const title = result.title.toLowerCase();
        const snippet = result.snippet.toLowerCase();
        const link = result.link.toLowerCase();
        // Domain authority scoring
        if (link.includes("federalregister.gov"))
            score += 10;
        if (link.includes("regulations.gov"))
            score += 9;
        if (link.includes("govinfo.gov"))
            score += 8;
        if (link.includes("hhs.gov"))
            score += 8;
        if (link.includes("acf.hhs.gov"))
            score += 9;
        if (link.includes("childwelfare.gov"))
            score += 7;
        // Content relevance scoring
        if (title.includes("child welfare") || snippet.includes("child welfare"))
            score += 6;
        if (title.includes("policy") || snippet.includes("policy"))
            score += 4;
        if (title.includes("regulation") || snippet.includes("regulation"))
            score += 4;
        if (title.includes("cfr") || snippet.includes("cfr"))
            score += 5;
        // Federal program relevance
        if (title.includes("title iv-e") || snippet.includes("title iv-e"))
            score += 5;
        if (title.includes("asfa") || snippet.includes("asfa"))
            score += 4;
        if (title.includes("capta") || snippet.includes("capta"))
            score += 4;
        // Location relevance
        if (location) {
            const locationLower = location.toLowerCase();
            if (title.includes(locationLower) || snippet.includes(locationLower))
                score += 3;
        }
        // Topic relevance
        if (topic) {
            const topicLower = topic.toLowerCase();
            if (title.includes(topicLower) || snippet.includes(topicLower))
                score += 3;
        }
        return score;
    }
    formatPolicyResultsForAgent(results, targetAgent) {
        switch (targetAgent) {
            case "decision-graph":
                return results.map(result => ({
                    source: result.link,
                    content: result.snippet,
                    title: result.title,
                    type: "policy_document",
                    relevance: this.calculatePolicyRelevance(result),
                }));
            case "foia":
                return results.map(result => ({
                    url: result.link,
                    description: result.snippet,
                    title: result.title,
                    source: "policy_search",
                    documentType: "policy",
                }));
            case "scoring":
                return results.map(result => ({
                    source: result.link,
                    content: result.snippet,
                    title: result.title,
                    type: "policy_reference",
                    weight: this.calculatePolicyRelevance(result) / 10,
                }));
            default:
                return results;
        }
    }
}
exports.PolicySearchAgent = PolicySearchAgent;
// Export function to create and run policy search agent
const runPolicySearchAgent = async (query, config) => {
    const agent = new PolicySearchAgent(config);
    return agent.executePolicySearch(query);
};
exports.runPolicySearchAgent = runPolicySearchAgent;
// Export function for child welfare policy search
const searchChildWelfarePolicy = async (location, scenario, config) => {
    const agent = new PolicySearchAgent(config);
    return agent.searchChildWelfarePolicy(location, scenario);
};
exports.searchChildWelfarePolicy = searchChildWelfarePolicy;
// Export function for federal regulations search
const searchFederalRegulations = async (topic, config) => {
    const agent = new PolicySearchAgent(config);
    return agent.searchFederalRegulations(topic);
};
exports.searchFederalRegulations = searchFederalRegulations;
//# sourceMappingURL=runPolicySearchAgent.js.map