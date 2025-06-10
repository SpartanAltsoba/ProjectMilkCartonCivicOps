"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecisionGraphBuilder = void 0;
exports.buildDecisionGraph = buildDecisionGraph;
exports.buildSimplifiedDecisionGraph = buildSimplifiedDecisionGraph;
const logger_1 = require("./utils/logger");
const errorHandling_1 = require("./utils/errorHandling");
const dataNormalization_1 = require("./utils/dataNormalization");
const legalFramework_1 = require("./utils/legalFramework");
const stakeholderIdentification_1 = require("./utils/stakeholderIdentification");
const pumlGenerator_1 = require("./utils/pumlGenerator");
const sourceCitations_1 = require("./utils/sourceCitations");
/**
 * Main graph builder class that orchestrates the decision chain synthesis
 */
class DecisionGraphBuilder {
    constructor() {
        this.startTime = 0;
    }
    /**
     * Validates the environment and input parameters
     */
    validateInput(input) {
        (0, errorHandling_1.validateEnvironment)(["GOOGLE_CSE_API_KEY", "GOOGLE_CSE_ENGINE_ID"]);
        if (!input.location || typeof input.location !== "string") {
            throw new errorHandling_1.InputValidationError("Location is required and must be a string");
        }
        if (!input.scenario || typeof input.scenario !== "string") {
            throw new errorHandling_1.InputValidationError("Scenario is required and must be a string");
        }
        if (input.location.trim().length < 3) {
            throw new errorHandling_1.InputValidationError("Location must be at least 3 characters long");
        }
        if (input.scenario.trim().length < 10) {
            throw new errorHandling_1.InputValidationError("Scenario must be at least 10 characters long");
        }
    }
    /**
     * Builds a complete decision graph from the input
     */
    async buildGraph(input) {
        this.startTime = Date.now();
        try {
            this.validateInput(input);
            // Clear previous citations
            sourceCitations_1.sourceCitations.clear();
            logger_1.logger.info("Starting decision graph build", {
                location: input.location,
                scenario: input.scenario,
            });
            // Step 1: Normalize location
            logger_1.logger.debug("Step 1: Normalizing location");
            const location = await (0, dataNormalization_1.normalizeLocation)(input.location);
            // Step 2: Determine legal framework
            logger_1.logger.debug("Step 2: Determining legal framework");
            const legalFrameworkResult = await (0, legalFramework_1.determineLegalFramework)(location);
            // Add legal framework sources to citations
            (0, sourceCitations_1.addMultipleSources)(legalFrameworkResult.sources.map(url => ({ url })), "legal");
            // Step 3: Identify stakeholders
            logger_1.logger.debug("Step 3: Identifying stakeholders");
            const stakeholders = await (0, stakeholderIdentification_1.getAllStakeholders)(location, input.scenario);
            // Add stakeholder sources to citations
            (0, sourceCitations_1.addMultipleSources)(stakeholders.agencies.map(s => ({ url: s.source, title: s.name })), "agency");
            (0, sourceCitations_1.addMultipleSources)(stakeholders.contractors.map(s => ({ url: s.source, title: s.name })), "contractor");
            (0, sourceCitations_1.addMultipleSources)(stakeholders.representatives.map(s => ({ url: s.source, title: s.name })), "representative");
            // Step 4: Generate PUML diagram
            logger_1.logger.debug("Step 4: Generating PUML diagram");
            const pumlDiagram = await (0, pumlGenerator_1.generatePUMLDiagram)(input.scenario, location, stakeholders, legalFrameworkResult.type);
            // Step 5: Generate citation report
            logger_1.logger.debug("Step 5: Generating citation report");
            const citationReport = (0, sourceCitations_1.generateCitationReport)();
            const processingTimeMs = Date.now() - this.startTime;
            const graph = {
                location,
                legalFramework: legalFrameworkResult,
                stakeholders,
                pumlDiagram,
                citations: citationReport,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    processingTimeMs,
                    totalSources: Object.values(citationReport.counts).reduce((sum, count) => sum + count, 0),
                },
            };
            logger_1.logger.info("Decision graph build completed successfully", {
                location: location.full,
                legalFramework: legalFrameworkResult.type,
                processingTimeMs,
                stakeholderCounts: {
                    agencies: stakeholders.agencies.length,
                    contractors: stakeholders.contractors.length,
                    representatives: stakeholders.representatives.length,
                },
                totalSources: graph.metadata.totalSources,
            });
            return graph;
        }
        catch (error) {
            const processingTimeMs = Date.now() - this.startTime;
            logger_1.logger.error("Decision graph build failed", {
                location: input.location,
                scenario: input.scenario,
                processingTimeMs,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Builds a simplified graph with minimal data for quick responses
     */
    async buildSimplifiedGraph(input) {
        this.startTime = Date.now();
        try {
            this.validateInput(input);
            sourceCitations_1.sourceCitations.clear();
            logger_1.logger.info("Starting simplified decision graph build", {
                location: input.location,
                scenario: input.scenario,
            });
            const location = await (0, dataNormalization_1.normalizeLocation)(input.location);
            const legalFrameworkResult = await (0, legalFramework_1.determineLegalFramework)(location);
            const processingTimeMs = Date.now() - this.startTime;
            return {
                location,
                legalFramework: legalFrameworkResult,
                metadata: {
                    generatedAt: new Date().toISOString(),
                    processingTimeMs,
                    totalSources: legalFrameworkResult.sources.length,
                },
            };
        }
        catch (error) {
            logger_1.logger.error("Simplified decision graph build failed", {
                location: input.location,
                error: error instanceof Error ? error.message : String(error),
            });
            throw error;
        }
    }
    /**
     * Validates that a built graph is complete and valid
     */
    validateGraph(graph) {
        try {
            // Check required fields
            if (!graph.location || !graph.location.state || !graph.location.county) {
                return false;
            }
            if (!graph.legalFramework || !graph.legalFramework.type) {
                return false;
            }
            if (!graph.stakeholders) {
                return false;
            }
            if (!graph.pumlDiagram || graph.pumlDiagram.length < 100) {
                return false;
            }
            if (!graph.citations || !graph.metadata) {
                return false;
            }
            logger_1.logger.debug("Graph validation passed", {
                location: graph.location.full,
                diagramLength: graph.pumlDiagram.length,
                totalSources: graph.metadata.totalSources,
            });
            return true;
        }
        catch (error) {
            logger_1.logger.error("Graph validation failed", {
                error: error instanceof Error ? error.message : String(error),
            });
            return false;
        }
    }
}
exports.DecisionGraphBuilder = DecisionGraphBuilder;
/**
 * Convenience function to build a decision graph
 */
async function buildDecisionGraph(input) {
    const builder = new DecisionGraphBuilder();
    return builder.buildGraph(input);
}
/**
 * Convenience function to build a simplified decision graph
 */
async function buildSimplifiedDecisionGraph(input) {
    const builder = new DecisionGraphBuilder();
    return builder.buildSimplifiedGraph(input);
}
//# sourceMappingURL=graphBuilder.js.map