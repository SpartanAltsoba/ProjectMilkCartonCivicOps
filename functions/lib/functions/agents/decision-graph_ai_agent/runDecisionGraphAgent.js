"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runDecisionGraphAgent = runDecisionGraphAgent;
const logger_1 = require("functions/lib/logger");
const dataNormalization_1 = require("./utils/dataNormalization");
const legalFramework_1 = require("./utils/legalFramework");
const stakeholderIdentification_1 = require("./utils/stakeholderIdentification");
const pumlGenerator_1 = require("./utils/pumlGenerator");
const sourceCitations_1 = require("./utils/sourceCitations");
const errorHandling_1 = require("./utils/errorHandling");
/**
 * Runs the decision graph generation process
 */
async function runDecisionGraphAgent(input) {
    try {
        logger_1.logger.info("Starting decision graph generation", { input });
        // Validate input
        (0, errorHandling_1.validateRequired)(input, ["location", "scenario"]);
        // Clear any existing sources from previous runs
        sourceCitations_1.globalSourceCitations.clear();
        // Step 1: Normalize location
        const normalizedLocation = await (0, dataNormalization_1.normalizeLocation)(input.location);
        logger_1.logger.info("Location normalized", { normalizedLocation });
        // Step 2: Determine legal framework
        const legalFramework = await (0, legalFramework_1.determineLegalFramework)(normalizedLocation);
        logger_1.logger.info("Legal framework determined", {
            type: legalFramework.type,
            sourceCount: legalFramework.sources.length,
        });
        // Step 3: Identify stakeholders
        const stakeholders = await (0, stakeholderIdentification_1.identifyStakeholders)(normalizedLocation, input.scenario);
        logger_1.logger.info("Stakeholders identified", {
            agencyCount: stakeholders.agencies.length,
            contractorCount: stakeholders.contractors.length,
            representativeCount: stakeholders.representatives.length,
        });
        // Step 4: Generate PUML diagram
        const pumlGenerator = new pumlGenerator_1.PumlGenerator({
            templatePath: input.templatePath,
            outputPath: input.outputPath,
        });
        const diagramData = {
            agencies: stakeholders.agencies,
            contractors: stakeholders.contractors,
            representatives: stakeholders.representatives,
            scenario: input.scenario,
        };
        const diagram = await pumlGenerator.generateDiagram(diagramData);
        logger_1.logger.info("Diagram generated successfully");
        // Compile output
        const output = {
            location: normalizedLocation,
            legalFramework,
            stakeholders,
            diagram,
            sources: {
                byCategory: Object.assign(Object.assign({}, sourceCitations_1.globalSourceCitations.getSourcesByCategory()), { 
                    // Ensure index signature compatibility
                    "": [] }),
                citations: sourceCitations_1.globalSourceCitations.generateFormattedCitations(),
                statistics: sourceCitations_1.globalSourceCitations.getStatistics(),
            },
        };
        logger_1.logger.info("Decision graph generation completed successfully", {
            sourceStats: output.sources.statistics,
        });
        return output;
    }
    catch (error) {
        logger_1.logger.error("Error in decision graph generation", {
            input,
            error: error instanceof Error ? error.message : "Unknown error",
        });
        // Convert unknown errors to typed errors
        if (!(error instanceof Error)) {
            throw (0, errorHandling_1.createError)("An unexpected error occurred during decision graph generation");
        }
        throw error;
    }
}
//# sourceMappingURL=runDecisionGraphAgent.js.map