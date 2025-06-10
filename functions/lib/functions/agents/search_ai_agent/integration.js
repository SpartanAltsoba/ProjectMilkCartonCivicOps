"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeIntegratedSearch = exports.SearchIntegration = void 0;
const logger_1 = require("../../lib/logger");
const runLegalSearchAgent_1 = require("./runLegalSearchAgent");
const runPolicySearchAgent_1 = require("./runPolicySearchAgent");
const runSearchAgent_1 = require("./runSearchAgent");
/**
 * Comprehensive search integration that feeds all other AI agents
 */
class SearchIntegration {
    constructor(config) {
        this.config = config;
    }
    /**
     * Execute comprehensive search and prepare data for all agents
     */
    async executeIntegratedSearch() {
        try {
            logger_1.logger.info("Starting integrated search", {
                location: this.config.location,
                scenario: this.config.scenario,
            });
            // Execute all search types in parallel
            const [generalResults, legalResults, policyResults, federalResults] = await Promise.all([
                this.executeGeneralSearch(),
                this.executeLegalSearch(),
                this.executePolicySearch(),
                this.executeFederalSearch(),
            ]);
            // Prepare inputs for each agent
            const agentInputs = {
                decisionGraph: this.prepareDecisionGraphInputs(generalResults, legalResults, policyResults),
                foia: this.prepareFoiaInputs(generalResults, legalResults, policyResults),
                ngoMapping: this.prepareNgoMappingInputs(generalResults, policyResults),
                scoring: this.prepareScoringInputs(generalResults, legalResults, policyResults),
            };
            const response = {
                searchResults: {
                    general: generalResults,
                    legal: legalResults,
                    policy: policyResults,
                    federal: federalResults,
                },
                agentInputs,
                metadata: {
                    location: this.config.location,
                    scenario: this.config.scenario,
                    timestamp: new Date().toISOString(),
                    totalResults: this.getTotalResults(generalResults, legalResults, policyResults, federalResults),
                },
            };
            logger_1.logger.info("Integrated search completed", {
                totalResults: response.metadata.totalResults,
                agentInputCounts: {
                    decisionGraph: agentInputs.decisionGraph.length,
                    foia: agentInputs.foia.length,
                    ngoMapping: agentInputs.ngoMapping.length,
                    scoring: agentInputs.scoring.length,
                },
            });
            return response;
        }
        catch (error) {
            logger_1.logger.error("Integrated search failed", {
                error: error instanceof Error ? error.message : "Unknown error",
            });
            throw error;
        }
    }
    /**
     * Share results with decision graph agent
     */
    async shareWithDecisionGraph(results) {
        try {
            const decisionGraphData = {
                location: this.config.location,
                scenario: this.config.scenario,
                legalAuthorities: results.agentInputs.decisionGraph.filter(item => item.type === "legal_authority"),
                policyReferences: results.agentInputs.decisionGraph.filter(item => item.type === "policy_document"),
                stakeholders: this.extractStakeholders(results.searchResults.general),
                jurisdiction: this.config.location,
            };
            logger_1.logger.info("Sharing integrated search results with decision graph agent", {
                dataPoints: Object.keys(decisionGraphData).length,
            });
            // TODO: Implement actual sharing with decision graph agent
            // await runDecisionGraphAgent(decisionGraphData);
        }
        catch (error) {
            logger_1.logger.error("Failed to share with decision graph agent", { error });
            throw error;
        }
    }
    /**
     * Share results with FOIA agent
     */
    async shareWithFoiaAgent(results) {
        try {
            const foiaData = {
                jurisdiction: this.config.location,
                requestType: "child_welfare",
                targetAgencies: this.extractAgencies(results.searchResults.general),
                legalBasis: results.agentInputs.foia.filter(item => item.source === "legal"),
                policyBasis: results.agentInputs.foia.filter(item => item.source === "policy"),
            };
            logger_1.logger.info("Sharing integrated search results with FOIA agent", {
                agencies: foiaData.targetAgencies.length,
                legalBasis: foiaData.legalBasis.length,
            });
            // TODO: Implement actual sharing with FOIA agent
            // await runFoiaAgent(foiaData);
        }
        catch (error) {
            logger_1.logger.error("Failed to share with FOIA agent", { error });
            throw error;
        }
    }
    async executeGeneralSearch() {
        const query = this.config.scenario
            ? `${this.config.location} child welfare ${this.config.scenario}`
            : `${this.config.location} child welfare system`;
        return (0, runSearchAgent_1.runSearchAgent)(query, {
            maxResults: 15,
            filterDomains: ["gov", "edu", "org"],
        });
    }
    async executeLegalSearch() {
        return (0, runLegalSearchAgent_1.searchChildWelfareLaw)(this.config.location, this.config.scenario, {
            jurisdiction: this.config.location,
            documentTypes: ["statute", "case_law", "regulation"],
        });
    }
    async executePolicySearch() {
        return (0, runPolicySearchAgent_1.searchChildWelfarePolicy)(this.config.location, this.config.scenario, {
            jurisdiction: this.config.location,
            policyType: "all",
        });
    }
    async executeFederalSearch() {
        return (0, runPolicySearchAgent_1.searchFederalRegulations)("child welfare", {
            policyType: "federal",
            agency: "HHS",
        });
    }
    prepareDecisionGraphInputs(general, legal, policy) {
        const inputs = [];
        // Add legal authorities
        legal.results.forEach(result => {
            inputs.push({
                source: result.link,
                content: result.snippet,
                title: result.title,
                type: "legal_authority",
                jurisdiction: this.config.location,
                relevance: this.calculateRelevance(result),
            });
        });
        // Add policy documents
        policy.results.forEach(result => {
            inputs.push({
                source: result.link,
                content: result.snippet,
                title: result.title,
                type: "policy_document",
                jurisdiction: this.config.location,
                relevance: this.calculateRelevance(result),
            });
        });
        // Add general context
        general.results.slice(0, 5).forEach(result => {
            inputs.push({
                source: result.link,
                content: result.snippet,
                title: result.title,
                type: "context",
                relevance: this.calculateRelevance(result),
            });
        });
        return inputs;
    }
    prepareFoiaInputs(general, legal, policy) {
        const inputs = [];
        // Add legal basis for FOIA requests
        legal.results.forEach(result => {
            inputs.push({
                url: result.link,
                description: result.snippet,
                title: result.title,
                source: "legal",
                documentType: "legal_authority",
            });
        });
        // Add policy basis
        policy.results.forEach(result => {
            inputs.push({
                url: result.link,
                description: result.snippet,
                title: result.title,
                source: "policy",
                documentType: "policy",
            });
        });
        return inputs;
    }
    prepareNgoMappingInputs(general, policy) {
        const inputs = [];
        // Extract contractor and NGO references
        [...general.results, ...policy.results].forEach(result => {
            if (this.containsNgoReferences(result)) {
                inputs.push({
                    source: result.link,
                    content: result.snippet,
                    title: result.title,
                    type: "ngo_reference",
                    location: this.config.location,
                });
            }
        });
        return inputs;
    }
    prepareScoringInputs(general, legal, policy) {
        const inputs = [];
        // Add all results as scoring context
        [general, legal, policy].forEach(response => {
            response.results.forEach(result => {
                inputs.push({
                    source: result.link,
                    content: result.snippet,
                    title: result.title,
                    type: "scoring_context",
                    weight: this.calculateRelevance(result) / 10,
                    location: this.config.location,
                });
            });
        });
        return inputs;
    }
    calculateRelevance(result) {
        let score = 0;
        const title = result.title.toLowerCase();
        const snippet = result.snippet.toLowerCase();
        // Location relevance
        if (title.includes(this.config.location.toLowerCase()) ||
            snippet.includes(this.config.location.toLowerCase())) {
            score += 3;
        }
        // Scenario relevance
        if (this.config.scenario) {
            const scenarioLower = this.config.scenario.toLowerCase();
            if (title.includes(scenarioLower) || snippet.includes(scenarioLower)) {
                score += 2;
            }
        }
        // Child welfare relevance
        if (title.includes("child welfare") || snippet.includes("child welfare")) {
            score += 2;
        }
        return Math.min(score, 10); // Cap at 10
    }
    containsNgoReferences(result) {
        const text = `${result.title} ${result.snippet}`.toLowerCase();
        const ngoIndicators = [
            "contractor",
            "nonprofit",
            "ngo",
            "organization",
            "services",
            "provider",
            "agency",
            "foundation",
        ];
        return ngoIndicators.some(indicator => text.includes(indicator));
    }
    extractStakeholders(searchResponse) {
        const stakeholders = new Set();
        searchResponse.results.forEach(result => {
            const text = `${result.title} ${result.snippet}`.toLowerCase();
            // Extract common stakeholder types
            if (text.includes("court"))
                stakeholders.add("Family Court");
            if (text.includes("cps") || text.includes("child protective"))
                stakeholders.add("CPS");
            if (text.includes("sheriff") || text.includes("police"))
                stakeholders.add("Law Enforcement");
            if (text.includes("school") || text.includes("education"))
                stakeholders.add("School District");
            if (text.includes("health") || text.includes("medical"))
                stakeholders.add("Health Services");
        });
        return Array.from(stakeholders);
    }
    extractAgencies(searchResponse) {
        const agencies = new Set();
        searchResponse.results.forEach(result => {
            const text = `${result.title} ${result.snippet}`.toLowerCase();
            // Extract government agencies
            if (text.includes("department") && text.includes("children")) {
                agencies.add("Department of Children and Families");
            }
            if (text.includes("hhs") || text.includes("health and human services")) {
                agencies.add("Department of Health and Human Services");
            }
            if (text.includes("acf")) {
                agencies.add("Administration for Children and Families");
            }
        });
        return Array.from(agencies);
    }
    getTotalResults(...responses) {
        return responses.reduce((total, response) => total + response.results.length, 0);
    }
}
exports.SearchIntegration = SearchIntegration;
// Export convenience function
const executeIntegratedSearch = async (location, scenario, includeAgents) => {
    const integration = new SearchIntegration({
        location,
        scenario,
        includeAgents,
    });
    return integration.executeIntegratedSearch();
};
exports.executeIntegratedSearch = executeIntegratedSearch;
//# sourceMappingURL=integration.js.map