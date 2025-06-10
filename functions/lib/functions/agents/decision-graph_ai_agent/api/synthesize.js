"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.synthesizeDecisionChain = void 0;
exports.synthesize = synthesize;
const functions = __importStar(require("firebase-functions"));
const logger_1 = require("functions/lib/logger");
const errorHandling_1 = require("../utils/errorHandling");
const runDecisionGraphAgent_1 = require("../runDecisionGraphAgent");
/**
 * Firebase Function to synthesize decision chains
 * Can be called via HTTP trigger or directly from other Firebase Functions
 */
exports.synthesizeDecisionChain = functions.https.onRequest(async (req, res) => {
    try {
        // Validate request method
        if (req.method !== "POST") {
            throw (0, errorHandling_1.createError)("Only POST method is allowed", "METHOD_NOT_ALLOWED");
        }
        // Validate request body
        const input = req.body;
        (0, errorHandling_1.validateRequired)(input, ["location", "scenario"]);
        logger_1.logger.info("Starting decision chain synthesis", {
            location: input.location,
            scenario: input.scenario,
        });
        // Process the request using runDecisionGraphAgent
        const result = await (0, runDecisionGraphAgent_1.runDecisionGraphAgent)({
            location: input.location,
            scenario: input.scenario,
            templatePath: input.templatePath,
            outputPath: input.outputPath,
        });
        // Construct successful response
        const response = {
            success: true,
            data: {
                diagram: result.diagram,
                metadata: {
                    location: result.location,
                    legalFramework: result.legalFramework,
                    stakeholders: result.stakeholders,
                },
                sources: result.sources,
            },
            timestamp: new Date().toISOString(),
        };
        logger_1.logger.info("Decision chain synthesis completed successfully", {
            location: result.location.full,
            stakeholderCounts: {
                agencies: result.stakeholders.agencies.length,
                contractors: result.stakeholders.contractors.length,
                representatives: result.stakeholders.representatives.length,
            },
        });
        res.status(200).json(response);
    }
    catch (error) {
        logger_1.logger.error("Error in decision chain synthesis", {
            error: error instanceof Error ? error.message : "Unknown error",
        });
        (0, errorHandling_1.handleApiError)(res, error);
    }
});
/**
 * Callable version of the synthesis function for internal use
 * Can be imported and called directly by other Firebase Functions
 */
async function synthesize(input) {
    try {
        (0, errorHandling_1.validateRequired)(input, ["location", "scenario"]);
        const result = await (0, runDecisionGraphAgent_1.runDecisionGraphAgent)(input);
        return {
            success: true,
            data: {
                diagram: result.diagram,
                metadata: {
                    location: result.location,
                    legalFramework: result.legalFramework,
                    stakeholders: result.stakeholders,
                },
                sources: result.sources,
            },
            timestamp: new Date().toISOString(),
        };
    }
    catch (error) {
        logger_1.logger.error("Error in synthesize function", {
            error: error instanceof Error ? error.message : "Unknown error",
            input,
        });
        return {
            success: false,
            error: {
                code: 500,
                message: error instanceof Error ? error.message : "An unexpected error occurred",
                type: error instanceof Error ? error.name : "INTERNAL_ERROR",
            },
            timestamp: new Date().toISOString(),
        };
    }
}
//# sourceMappingURL=synthesize.js.map