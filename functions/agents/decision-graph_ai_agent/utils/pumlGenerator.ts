import { promises as fs } from "fs";
import * as path from "path";
import { logger } from "../../../lib/logger";
import { Agency, Contractor, Representative } from "./stakeholderIdentification";

interface PumlGeneratorConfig {
  templatePath?: string;
  outputPath?: string;
}

interface DiagramData {
  agencies: Agency[];
  contractors: Contractor[];
  representatives: Representative[];
  scenario: string;
}

/**
 * Generates PlantUML diagram for decision chain visualization
 */
export class PumlGenerator {
  private readonly templateDir: string;
  private readonly outputDir: string;

  constructor(config: PumlGeneratorConfig = {}) {
    this.templateDir =
      config.templatePath ||
      path.join(
        __dirname,
        "..",
        "decisionTemplates",
        "decision_chain_examples",
        "cps_decision_chains"
      );
    this.outputDir = config.outputPath || path.join(__dirname, "..", "output");
  }

  /**
   * Generates a PUML diagram based on stakeholder data and scenario
   */
  async generateDiagram(data: DiagramData): Promise<string> {
    try {
      // Select appropriate template based on scenario
      const templateName = this.selectTemplate(data.scenario);
      const templatePath = path.join(this.templateDir, templateName);

      logger.info("Generating PUML diagram", {
        scenario: data.scenario,
        template: templateName,
      });

      // Read template file
      let pumlContent = await fs.readFile(templatePath, "utf-8");

      // Replace stakeholder placeholders with actual data
      pumlContent = await this.replaceStakeholders(pumlContent, data);

      // Ensure output directory exists
      await fs.mkdir(this.outputDir, { recursive: true });

      // Write generated PUML to file
      const outputPath = path.join(this.outputDir, `diagram_${Date.now()}.puml`);
      await fs.writeFile(outputPath, pumlContent, "utf-8");

      logger.info("PUML diagram generated successfully", {
        outputPath,
      });

      return pumlContent;
    } catch (error) {
      logger.error("Error generating PUML diagram", {
        error: error instanceof Error ? error.message : "Unknown error",
        scenario: data.scenario,
      });
      throw error;
    }
  }

  /**
   * Selects appropriate template based on scenario
   */
  private selectTemplate(scenario: string): string {
    const scenarioLower = scenario.toLowerCase();

    // Map scenarios to template files
    const templateMap: Record<string, string> = {
      initial_assessment: "initial_assessment_chain.puml",
      emergency_removal: "emergency_removal_chain.puml",
      placement_change: "placement_change_chain.puml",
      reunification: "reunification_chain.puml",
      termination: "termination_chain.puml",
    };

    // Find best matching template
    const matchingScenario = Object.keys(templateMap).find(key => scenarioLower.includes(key));

    if (!matchingScenario) {
      logger.warn("No specific template found for scenario, using default", {
        scenario,
      });
      return "default_chain.puml";
    }

    return templateMap[matchingScenario];
  }

  /**
   * Replaces stakeholder placeholders in PUML template
   */
  private async replaceStakeholders(pumlContent: string, data: DiagramData): Promise<string> {
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
  private sanitizeId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "_")
      .replace(/_+/g, "_")
      .replace(/^_|_$/g, "");
  }
}

export type { PumlGeneratorConfig, DiagramData };
