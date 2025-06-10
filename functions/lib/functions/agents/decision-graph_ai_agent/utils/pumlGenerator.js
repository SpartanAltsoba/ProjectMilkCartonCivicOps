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
exports.PumlGenerator = void 0;
const fs_1 = require("fs");
const path = __importStar(require("path"));
const logger_1 = require("functions/lib/logger");
/**
 * Generates PlantUML diagram for decision chain visualization
 */
class PumlGenerator {
    constructor(config = {}) {
        this.templateDir =
            config.templatePath ||
                path.join(__dirname, "..", "decisionTemplates", "decision_chain_examples", "cps_decision_chains");
        this.outputDir = config.outputPath || path.join(__dirname, "..", "output");
    }
    /**
     * Generates a PUML diagram based on stakeholder data and scenario
     */
    async generateDiagram(data) {
        try {
            // Select appropriate template based on scenario
            const templateName = this.selectTemplate(data.scenario);
            const templatePath = path.join(this.templateDir, templateName);
            logger_1.logger.info("Generating PUML diagram", {
                scenario: data.scenario,
                template: templateName,
            });
            // Read template file
            let pumlContent = await fs_1.promises.readFile(templatePath, "utf-8");
            // Replace stakeholder placeholders with actual data
            pumlContent = await this.replaceStakeholders(pumlContent, data);
            // Ensure output directory exists
            await fs_1.promises.mkdir(this.outputDir, { recursive: true });
            // Write generated PUML to file
            const outputPath = path.join(this.outputDir, `diagram_${Date.now()}.puml`);
            await fs_1.promises.writeFile(outputPath, pumlContent, "utf-8");
            logger_1.logger.info("PUML diagram generated successfully", {
                outputPath,
            });
            return pumlContent;
        }
        catch (error) {
            logger_1.logger.error("Error generating PUML diagram", {
                error: error instanceof Error ? error.message : "Unknown error",
                scenario: data.scenario,
            });
            throw error;
        }
    }
    /**
     * Selects appropriate template based on scenario
     */
    selectTemplate(scenario) {
        const scenarioLower = scenario.toLowerCase();
        // Map scenarios to template files
        const templateMap = {
            initial_assessment: "initial_assessment_chain.puml",
            emergency_removal: "emergency_removal_chain.puml",
            placement_change: "placement_change_chain.puml",
            reunification: "reunification_chain.puml",
            termination: "termination_chain.puml",
        };
        // Find best matching template
        const matchingScenario = Object.keys(templateMap).find(key => scenarioLower.includes(key));
        if (!matchingScenario) {
            logger_1.logger.warn("No specific template found for scenario, using default", {
                scenario,
            });
            return "default_chain.puml";
        }
        return templateMap[matchingScenario];
    }
    /**
     * Replaces stakeholder placeholders in PUML template
     */
    async replaceStakeholders(pumlContent, data) {
        let updatedContent = pumlContent;
        // Replace agency actors
        data.agencies.forEach(agency => {
            const actorDef = `actor "${agency.name}" as ${this.sanitizeId(agency.name)} // Source: ${agency.source}`;
            updatedContent = updatedContent.replace(/{{AGENCY_PLACEHOLDER}}/, actorDef);
        });
        // Replace contractor actors
        data.contractors.forEach(contractor => {
            const actorDef = `actor "${contractor.name}" as ${this.sanitizeId(contractor.name)} // Source: ${contractor.source}`;
            updatedContent = updatedContent.replace(/{{CONTRACTOR_PLACEHOLDER}}/, actorDef);
        });
        // Replace representative actors
        data.representatives.forEach(rep => {
            const actorDef = `actor "${rep.name}\\n(${rep.role})" as ${this.sanitizeId(rep.name)} // Source: ${rep.source}`;
            updatedContent = updatedContent.replace(/{{REPRESENTATIVE_PLACEHOLDER}}/, actorDef);
        });
        // Remove any remaining placeholders
        updatedContent = updatedContent
            .replace(/{{AGENCY_PLACEHOLDER}}/g, "")
            .replace(/{{CONTRACTOR_PLACEHOLDER}}/g, "")
            .replace(/{{REPRESENTATIVE_PLACEHOLDER}}/g, "");
        return updatedContent;
    }
    /**
     * Sanitizes string for use as PlantUML identifier
     */
    sanitizeId(name) {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_|_$/g, "");
    }
}
exports.PumlGenerator = PumlGenerator;
//# sourceMappingURL=pumlGenerator.js.map